"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const archiver = require("archiver");
const bluebird = require("bluebird");
const excel = require("exceljs");
const fs = require("fs");
const https = require("https");
const GraphicsMagick = require("gm");
const moment = require("moment");
const tempfile = require("tempfile");
const bson_1 = require("bson");
const car_model_1 = require("../../app/models/car.model");
const team_model_1 = require("../../app/models/team.model");
const participant_model_1 = require("../../form/models/participant.model");
const inventoryCar_model_1 = require("../../inventory/models/inventoryCar.model");
const server_1 = require("../../server");
const logger_service_1 = require("../../services/logger.service");
const general_utils_1 = require("../../utils/general.utils");
const request_model_1 = require("../models/request.model");
const requestFile_model_1 = require("../models/requestFile.model");
const requestItem_model_1 = require("../models/requestItem.model");
const requestItemStatus_model_1 = require("../models/requestItemStatus.model");
class RequestController {
    constructor() {
        this.itemPopulate = [{
                path: 'car'
            }, {
                path: 'request'
            }, {
                path: 'files'
            }, {
                path: 'reason',
                select: ['name']
            }, {
                path: 'status',
                select: ['name', 'weigth']
            }, {
                path: 'carrier',
                select: ['name']
            }, {
                path: 'origin',
                select: ['name']
            }, {
                path: 'destination',
                select: ['name']
            }];
        this.requestPopulate = [{
                path: 'origin',
                select: ['name']
            }, {
                path: 'destination',
                select: ['name']
            }, {
                path: 'createdBy',
                select: ['firstName', 'lastName']
            }, {
                path: 'items',
                options: {
                    sort: {
                        _id: 1
                    }
                },
                populate: this.itemPopulate
            }];
        this.aggregateCustomLabels = {
            totalDocs: 'total',
            docs: 'docs',
            limit: 'perPage',
            page: 'currentPage',
            nextPage: 'next',
            prevPage: 'prev',
            totalPages: 'pages',
            hasPrevPage: 'hasPrevious',
            hasNextPage: 'hasNext',
            pagingCounter: 'pageCounter'
        };
        this.index = this.index.bind(this);
        this.apiList = this.apiList.bind(this);
        this.apiListItems = this.apiListItems.bind(this);
        this.apiDetail = this.apiDetail.bind(this);
        this.apiCreate = this.apiCreate.bind(this);
        this.getRequets = this.getRequets.bind(this);
        this.apiPatchItem = this.apiPatchItem.bind(this);
        this.apiDeleteRequest = this.apiDeleteRequest.bind(this);
        this.apiDeleteRequestItem = this.apiDeleteRequestItem.bind(this);
        this.apiCreateItem = this.apiCreateItem.bind(this);
        this.exportExcel = this.exportExcel.bind(this);
        this.uploadFile = this.uploadFile.bind(this);
        this.autoRotate = this.autoRotate.bind(this);
        this.resizeImage = this.resizeImage.bind(this);
        this.downloadItemFiles = this.downloadItemFiles.bind(this);
        this.downloadFile = this.downloadFile.bind(this);
    }
    async index(req, res) {
        res.render('app/index', { token: await req.user.generateToken() });
    }
    async apiCreate(req, res) {
        logger_service_1.default.info(`RequestController.apiCreate`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)} }`);
        const { company } = req.user;
        const team = req.user.team._id;
        const { cars, venue, fleet, sellerText } = req.body;
        try {
            const defaultItemStatus = await requestItemStatus_model_1.default.findOneOrCreate({ team, default: true }, { name: 'Pendiente', default: true, team, weigth: 10 });
            const updateTeam = await team_model_1.default.findOne({ _id: team._id });
            const request = await new request_model_1.default({
                team,
                sellerText,
                number: updateTeam.requestNumber + 1,
                origin: venue,
                destination: venue,
                // status,
                fleet,
                createdBy: req.user
            }).save();
            for (const car of cars) {
                const newCar = await new car_model_1.default({
                    team,
                    company,
                    brand: car.brand,
                    denomination: car.denomination,
                    material: car.material,
                    color: car.color,
                    status: car_model_1.ChoicesStatusCar.pending,
                    createdBy: req.user
                }).save();
                await new requestItem_model_1.default({
                    team,
                    request,
                    car: newCar,
                    reason: car.reason,
                    files: car.files,
                    washed: car.washed,
                    equipment: car.equipment,
                    observation: car.observation,
                    priority: car.priority,
                    origin: req.user.venue,
                    destination: venue,
                    status: defaultItemStatus,
                    createdBy: req.user
                }).save();
            }
            await team_model_1.default.findOneAndUpdate({ _id: team._id }, { $inc: { requestNumber: 1 } }, { new: true });
            const newRequest = await request_model_1.default.findById(request._id).populate(this.requestPopulate);
            server_1.io.to(`request-list-${team}`).emit('CREATE_REQUEST', {
                request: newRequest
            });
            server_1.io.to(`request-detail-${team}`).emit('CREATE_REQUEST', {
                request: newRequest
            });
            res.json({
                status: 200
            });
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`RequestController.apiCreate: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}`);
            logger_service_1.default.error(e);
            res.status(500).json(e);
        }
    }
    async apiListItems(req, res) {
        logger_service_1.default.info(`RequestController.apiListItems`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)} }`);
        const team = req.user.team._id;
        const { page, pageSize, orderBy, orderType, filters } = req.body;
        console.log('**************************************');
        console.log(filters);
        let venuesIds = [];
        const extraQuery = {};
        const extraMatch = {};
        if (filters.venues && filters.venues.length) {
            venuesIds = req.user.venuesPermissions().filter(i => (filters.venues.includes(i.toString())));
        }
        else {
            venuesIds = req.user.venuesPermissions();
        }
        if (filters.status && filters.status.length) {
            extraQuery.status = { $in: filters.status.map((s) => new bson_1.ObjectID(s)) };
        }
        if (filters.from) {
            if (!extraQuery.hasOwnProperty('createdAt')) {
                extraQuery.createdAt = {};
            }
            extraQuery.createdAt.$gte = moment(filters.from).startOf('day').toDate();
        }
        if (filters.to) {
            if (!extraQuery.hasOwnProperty('createdAt')) {
                extraQuery.createdAt = {};
            }
            extraQuery.createdAt.$lte = moment(filters.to).endOf('day').toDate();
        }
        const requestNumbers = filters.request.replace(/[^0-9\,]/g, '').split(',').filter((requestNumber) => (requestNumber.length));
        if (requestNumbers.length) {
            extraMatch.requestNumber = { $in: requestNumbers };
        }
        if (filters.text) {
            extraMatch.$or = [];
            extraMatch.$or.push({
                'car.vin': { '$regex': filters.text, '$options': 'i' }
            });
            extraMatch.$or.push({
                'car.brand': { '$regex': filters.text, '$options': 'i' }
            });
            extraMatch.$or.push({
                'car.color': { '$regex': filters.text, '$options': 'i' }
            });
            extraMatch.$or.push({
                'car.denomination': { '$regex': filters.text, '$options': 'i' }
            });
            extraMatch.$or.push({
                'car.material': { '$regex': filters.text, '$options': 'i' }
            });
            extraMatch.$or.push({
                'requestNumber': { '$regex': filters.text, '$options': 'i' }
            });
        }
        try {
            const requestsAggregate = requestItem_model_1.default.aggregate([{
                    $match: {
                        team,
                        $or: [{
                                destination: {
                                    $in: venuesIds
                                }
                            }, {
                                origin: {
                                    $in: venuesIds
                                }
                            }],
                        ...extraQuery
                    }
                }, {
                    $lookup: { from: 'cars', localField: 'car', foreignField: '_id', as: 'car' }
                }, {
                    $unwind: { path: '$car', preserveNullAndEmptyArrays: true }
                }, {
                    $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id', as: 'createdBy' }
                }, {
                    $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true }
                }, {
                    $lookup: { from: 'venues', localField: 'origin', foreignField: '_id', as: 'origin' }
                }, {
                    $unwind: { path: '$origin', preserveNullAndEmptyArrays: true }
                }, {
                    $lookup: { from: 'venues', localField: 'destination', foreignField: '_id', as: 'destination' }
                }, {
                    $unwind: { path: '$destination', preserveNullAndEmptyArrays: true }
                }, {
                    $lookup: { from: 'requests', localField: 'request', foreignField: '_id', as: 'request' }
                }, {
                    $unwind: { path: '$request', preserveNullAndEmptyArrays: false }
                }, {
                    $lookup: { from: 'requestitemstatuses', localField: 'status', foreignField: '_id', as: 'status' }
                }, {
                    $unwind: { path: '$status', preserveNullAndEmptyArrays: true }
                }, {
                    $lookup: { from: 'carriers', localField: 'carrier', foreignField: '_id', as: 'carrier' }
                }, {
                    $unwind: { path: '$carrier', preserveNullAndEmptyArrays: true }
                }, {
                    $lookup: { from: 'requestfiles', localField: 'files', foreignField: '_id', as: 'files' }
                }, {
                    $lookup: { from: 'reasons', localField: 'reason', foreignField: '_id', as: 'reason' }
                }, {
                    $unwind: { path: '$reason', preserveNullAndEmptyArrays: true }
                }, {
                    $addFields: { requestNumber: { $toString: '$request.number' } }
                }, {
                    $project: {
                        '_id': 1,
                        'request': 1,
                        'priority': 1,
                        'observation': 1,
                        'equipment': 1,
                        'washed': 1,
                        'review': 1,
                        'body': 1,
                        'files': 1,
                        'requestNumber': 1,
                        'status._id': 1,
                        'status.name': 1,
                        'carrier._id': 1,
                        'carrier.name': 1,
                        'status.weigth': 1,
                        'createdBy._id': 1,
                        'createdBy.firstName': 1,
                        'createdBy.lastName': 1,
                        'car': 1,
                        'origin._id': 1,
                        'origin.name': 1,
                        'destination._id': 1,
                        'destination.name': 1,
                        'reason._id': 1,
                        'reason.name': 1,
                        'uploadDate': 1,
                        'estimatedArrival': 1,
                        'createdAt': 1,
                        'updatedAt': 1
                    }
                }, {
                    $match: {
                        $or: [{
                                'destination._id': {
                                    $in: venuesIds
                                }
                            }, {
                                'origin._id': {
                                    $in: venuesIds
                                }
                            }],
                        ...extraMatch
                    }
                }, {
                    $sort: { [orderBy]: orderType === 'ascending' ? 1 : -1 }
                }]);
            const options = {
                page: parseInt(page ? page : '1', 10),
                limit: parseInt(pageSize ? pageSize : '10', 10),
                customLabels: this.aggregateCustomLabels
            };
            const requests = await requestItem_model_1.default.aggregatePaginate(requestsAggregate, options);
            if (options.page && requests.pages && requests.pages < options.page) {
                res.status(400).json({
                    message: 'La página solicitada no existe.',
                    status: 400
                });
            }
            else {
                res.json({
                    count: requests.total,
                    pages: requests.pages,
                    hasPrevious: requests.hasPrevious,
                    hasNext: requests.hasNext,
                    results: requests.docs,
                    status: 200
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`RequestController.apiListItems: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}, params: ${JSON.stringify(req.params)}`);
            logger_service_1.default.error(e);
            res.status(500).json(e);
        }
    }
    async exportExcel(req, res) {
        const team = req.user.team._id;
        try {
            const requestItems = await requestItem_model_1.default.aggregate([{
                    $match: {
                        team,
                        'destination': {
                            $in: req.user.venuesPermissions()
                        }
                    }
                }, {
                    $lookup: { from: 'cars', localField: 'car', foreignField: '_id', as: 'car' }
                }, {
                    $unwind: { path: '$car', preserveNullAndEmptyArrays: true }
                }, {
                    $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id', as: 'createdBy' }
                }, {
                    $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true }
                }, {
                    $lookup: { from: 'venues', localField: 'origin', foreignField: '_id', as: 'origin' }
                }, {
                    $unwind: { path: '$origin', preserveNullAndEmptyArrays: true }
                }, {
                    $lookup: { from: 'venues', localField: 'destination', foreignField: '_id', as: 'destination' }
                }, {
                    $unwind: { path: '$destination', preserveNullAndEmptyArrays: true }
                }, {
                    $lookup: { from: 'requests', localField: 'request', foreignField: '_id', as: 'request' }
                }, {
                    $unwind: { path: '$request', preserveNullAndEmptyArrays: false }
                }, {
                    $lookup: { from: 'requestitemstatuses', localField: 'status', foreignField: '_id', as: 'status' }
                }, {
                    $unwind: { path: '$status', preserveNullAndEmptyArrays: true }
                }, {
                    $lookup: { from: 'carriers', localField: 'carrier', foreignField: '_id', as: 'carrier' }
                }, {
                    $unwind: { path: '$carrier', preserveNullAndEmptyArrays: true }
                }, {
                    $lookup: { from: 'reasons', localField: 'reason', foreignField: '_id', as: 'reason' }
                }, {
                    $unwind: { path: '$reason', preserveNullAndEmptyArrays: true }
                }, {
                    $project: {
                        '_id': 1,
                        'request': 1,
                        'priority': 1,
                        'observation': 1,
                        'equipment': 1,
                        'washed': 1,
                        'review': 1,
                        'body': 1,
                        'status._id': 1,
                        'status.name': 1,
                        'carrier._id': 1,
                        'carrier.name': 1,
                        'status.weigth': 1,
                        'createdBy._id': 1,
                        'createdBy.firstName': 1,
                        'createdBy.lastName': 1,
                        'car': 1,
                        'origin._id': 1,
                        'origin.name': 1,
                        'destination._id': 1,
                        'destination.name': 1,
                        'reason._id': 1,
                        'reason.name': 1,
                        'uploadDate': 1,
                        'estimatedArrival': 1,
                        'createdAt': 1,
                        'updatedAt': 1
                    }
                }, {
                    $sort: { _id: 1 }
                }]);
            const workbook = new excel.Workbook();
            const worksheet = workbook.addWorksheet('Usuarios', {
                properties: {
                    defaultRowHeight: 30
                }, pageSetup: {
                    fitToPage: true, fitToHeight: 100, fitToWidth: 1
                }
            });
            /* headers */
            worksheet.columns = [{
                    header: 'Nª SOLICITUD', key: 'request', width: 10
                }, {
                    header: 'FECHA SOLICITUD', key: 'created', width: 21, style: { numFmt: 'dd/mm/yyyy hh:mm' }
                }, {
                    header: 'FLOTA', key: 'fleet', width: 20
                }, {
                    header: 'PRIORIDAD', key: 'priority', width: 20
                }, {
                    header: 'SUCURSAL (CREACION)', key: 'origin', width: 20
                }, {
                    header: 'SOLICITANTE', key: 'createdBy', width: 20
                }, {
                    header: 'VENDEDOR', key: 'seller', width: 20
                }, {
                    header: 'MOTIVO', key: 'reason', width: 20
                }, {
                    header: 'GRUPO, PROPIEDAD', key: 'group', width: 20
                }, {
                    header: 'MARCA', key: 'brand', width: 20
                }, {
                    header: 'MODELO', key: 'denomination', width: 20
                }, {
                    header: 'MATERIAL', key: 'material', width: 20
                }, {
                    header: 'COLOR', key: 'color', width: 20
                }, {
                    header: 'ESTADO', key: 'status', width: 20
                }, {
                    header: 'VIN/ID', key: 'vin', width: 20
                }, {
                    header: 'CDO', key: 'cdo', width: 20
                }, {
                    header: 'ACCESORIZACIÓN', key: 'equipment', width: 10
                }, {
                    header: 'PRE-LAVADO', key: 'washed', width: 10
                }, {
                    header: 'INSPECCIÓN Pre-entrega', key: 'review', width: 10
                }, {
                    header: 'CARROCERO', key: 'body', width: 10
                }, {
                    header: 'EQUIPAMIENTO', key: 'equipment_2', width: 10
                }, {
                    header: 'DESTINO', key: 'destination', width: 20
                }, {
                    header: 'TRANSPORTISTA', key: 'carrier', width: 20
                }, {
                    header: 'FECHA CARGA', key: 'uploadDate', width: 21, style: { numFmt: 'dd/mm/yyyy hh:mm' }
                }, {
                    header: 'FECHA LLEGADA', key: 'estimatedArrival', width: 21, style: { numFmt: 'dd/mm/yyyy hh:mm' }
                }, {
                    header: 'FECHA ACTUALIZACION', key: 'updted', width: 21, style: { numFmt: 'dd/mm/yyyy hh:mm' }
                }, {
                    header: 'OBSERVACIÓN', key: 'observation', width: 21
                }];
            for (const item of requestItems) {
                worksheet.addRow({
                    request: item.request.number,
                    created: item.createdAt,
                    updated: item.updatedAt,
                    observation: item.observation,
                    fleet: item.request.fleet ? 'Si' : 'No',
                    priority: item.priority ? 'Si' : 'No',
                    createdBy: item.createdBy ? `${item.createdBy.firstName} ${item.createdBy.lastName}` : '-',
                    seller: item.request.sellerText,
                    reason: item.reason.name,
                    group: '',
                    brand: item.car.brand,
                    denomination: item.car.denomination,
                    material: item.car.material,
                    vin: item.car.vin,
                    cdo: item.car.internalNumber,
                    color: item.car.color,
                    destination: item.destination.name,
                    origin: item.origin.name,
                    status: item.status.name,
                    equipment: item.equipment ? 'Si' : 'No',
                    body: item.body ? 'Si' : 'No',
                    washed: item.washed ? 'Si' : 'No',
                    review: item.review ? 'Si' : 'No',
                    carrier: item.carrier ? item.carrier.name : '',
                    uploadDate: item.uploadDate,
                    estimatedArrival: item.estimatedArrival
                });
            }
            const tempFilePath = tempfile('.xlsx');
            await workbook.xlsx.writeFile(tempFilePath);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=requests.xlsx');
            return res.sendFile(tempFilePath);
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            /* istanbul ignore next */
            logger_service_1.default.error(`RequestController.exportExcel: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}, params: ${JSON.stringify(req.params)}`);
            logger_service_1.default.error(e);
            res.status(500).json(e);
        }
    }
    async apiList(req, res) {
        logger_service_1.default.info(`RequestController.apiList`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
        const team = req.user.team._id;
        const { page, pageSize, search, orderBy, orderType } = req.query;
        // paginate options
        const options = {
            sort: {
                [orderBy]: orderType === 'ascending' ? 1 : -1
            },
            populate: this.requestPopulate,
            // select: {_id: true},
            page: parseInt(page ? page : '1', 10),
            limit: parseInt(pageSize ? pageSize : '20', 10)
        };
        const filter = {
            team,
            destination: {
                $in: req.user.venuesPermissions()
            }
        };
        if (search) {
            // add here conditions tu search
        }
        try {
            const requests = await this.getRequets(filter, options);
            /* istanbul ignore if  */
            if (options.page && requests.pages && requests.pages < options.page) {
                res.status(400).json({
                    message: 'La página solicitada no existe.',
                    status: 400
                });
            }
            else {
                res.json({
                    count: requests.total,
                    pages: requests.pages,
                    hasPrevious: options.page && options.page > 1 && requests.pages && requests.pages >= options.page,
                    hasNext: options.page && requests.pages && requests.pages > options.page,
                    results: requests.docs,
                    status: 200
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`RequestController.apiList: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            res.status(500).json(e);
        }
    }
    async apiDetail(req, res) {
        logger_service_1.default.info(`RequestController.apiDetail`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
        const team = req.user.team._id;
        const { id } = req.params;
        try {
            const request = await request_model_1.default
                .findOne({
                _id: id,
                team
            })
                .populate(this.requestPopulate);
            if (request) {
                res.json(request);
            }
            else {
                res.status(404).json({
                    message: `No se ha encontrado la solicitud ${id}`,
                    status: 404
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`RequestController.apiDetail: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}, params: ${JSON.stringify(req.params)}`);
            logger_service_1.default.error(e);
            res.status(500).json(e);
        }
    }
    async apiDeleteRequest(req, res) {
        logger_service_1.default.info(`RequestController.apiDeleteRequest`);
        const team = req.user.team._id;
        const { id } = req.params;
        try {
            const request = await request_model_1.default
                .findOne({
                _id: id,
                team
            });
            if (request) {
                await requestItem_model_1.default.find({ _id: id, team }).remove();
                await request.remove();
                server_1.io.to(`request-list-${team}`).emit('DELETE_REQUEST', {
                    idRequest: request._id
                });
                server_1.io.to(`request-detail-${team}`).emit('DELETE_REQUEST', {
                    idRequest: request._id
                });
                res.status(200).json({
                    message: `ok`,
                    status: 200
                });
            }
            else {
                res.status(404).json({
                    message: `No se ha encontrado la solicitud ${id}`,
                    status: 404
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`RequestController.apiDeleteRequest: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}, params: ${JSON.stringify(req.params)}`);
            logger_service_1.default.error(e);
            res.status(500).json(e);
        }
    }
    async apiDeleteRequestItem(req, res) {
        logger_service_1.default.info(`RequestController.apiDeleteRequestItem`);
        const team = req.user.team._id;
        const { id } = req.params;
        try {
            const item = await requestItem_model_1.default
                .findOne({
                _id: id,
                team
            })
                .populate(this.itemPopulate);
            if (item) {
                await item.remove();
                await request_model_1.default.update({ _id: item.request._id }, { $set: { updatedAt: moment() } });
                server_1.io.to(`request-list-${team}`).emit('DELETE_REQUEST_ITEM', {
                    idRequest: item.request._id,
                    item
                });
                server_1.io.to(`request-detail-${team}`).emit('DELETE_REQUEST_ITEM', {
                    idRequest: item.request._id,
                    item
                });
                res.status(200).json({
                    message: `ok`,
                    status: 200
                });
            }
            else {
                res.status(404).json({
                    message: `No se ha encontrado la solicitud ${id}`,
                    status: 404
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`RequestController.apiDeleteRequestItem: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}, params: ${JSON.stringify(req.params)}`);
            logger_service_1.default.error(e);
            res.status(500).json(e);
        }
    }
    async searhCar(req, res) {
        logger_service_1.default.info(`RequestController.searhCar`);
        const team = req.user.team._id;
        const { search } = req.query;
        try {
            const cars = await car_model_1.default.aggregate([{
                    $match: {
                        team,
                        $text: {
                            $search: search,
                            $diacriticSensitive: false
                        }
                    }
                }, {
                    $project: {
                        vin: 1,
                        brand: 1,
                        denomination: 1,
                        material: 1,
                        score: {
                            $meta: 'textScore'
                        }
                    }
                }, {
                    $match: {
                        score: {
                            $gt: 0.5
                        }
                    }
                }, {
                    $group: {
                        _id: {
                            brand: '$brand',
                            denomination: '$denomination',
                            material: '$material',
                            score: '$score'
                        }
                    }
                }, {
                    $sort: {
                        '_id.score': -1
                    }
                }, {
                    $limit: 100
                }, {
                    $project: {
                        brand: '$_id.brand',
                        denomination: '$_id.denomination',
                        material: '$_id.material',
                        score: '$_id.score',
                        _id: false
                    }
                }]);
            res.json({
                cars
            });
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`RequestController.searhCar: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            logger_service_1.default.error(e);
            res.status(500).json(e);
        }
    }
    async apiCreateItem(req, res) {
        logger_service_1.default.info(`RequestController.apiCreateItem`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)} }`);
        const { company } = req.user;
        const team = req.user.team._id;
        const { car, idRequest } = req.body;
        try {
            const request = await request_model_1.default.findOne({ _id: idRequest, team });
            if (request) {
                const defaultItemStatus = await requestItemStatus_model_1.default.findOneOrCreate({ team, default: true }, { name: 'En proceso', default: true, team });
                const newCar = await new car_model_1.default({
                    team,
                    company,
                    brand: car.brand,
                    denomination: car.denomination,
                    material: car.material,
                    color: car.color,
                    status: car_model_1.ChoicesStatusCar.pending,
                    createdBy: req.user
                }).save();
                const newItem = await new requestItem_model_1.default({
                    team,
                    request,
                    car: newCar,
                    reason: car.reason,
                    washed: car.washed,
                    equipment: car.equipment,
                    priority: car.priority,
                    origin: request.origin,
                    destination: request.destination,
                    status: defaultItemStatus,
                    createdBy: req.user
                }).save();
                const item = await requestItem_model_1.default.findOne({ _id: newItem._id }).populate(this.itemPopulate);
                request.update({ $set: { updatedAt: moment() } });
                server_1.io.to(`request-list-${team}`).emit('CREATE_REQUEST_ITEM', {
                    idRequest: request._id,
                    item
                });
                server_1.io.to(`request-detail-${team}`).emit('CREATE_REQUEST_ITEM', {
                    idRequest: request._id,
                    item
                });
                res.status(200).json({
                    ...item
                });
            }
            else {
                res.status(404).json({
                    message: 'No se ha encontrado la solicitud.',
                    status: 404
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            console.log(e);
            logger_service_1.default.error(`RequestController.apiCreateItem: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            res.status(500).json(e);
        }
    }
    async apiPatchItem(req, res) {
        logger_service_1.default.info(`RequestController.apiPatchItem`);
        const team = req.user.team._id;
        const updateObject = req.body;
        const { id } = req.params;
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(updateObject)} }`);
        try {
            const requestItem = await requestItem_model_1.default.findOneAndUpdate({ _id: id, team }, { $set: { ...updateObject } }).populate([{ path: 'car' }]);
            if (Object.keys(updateObject.car).length) {
                // add vin2 to car
                updateObject.car.vin2 = updateObject.car && updateObject.car.vin ? updateObject.car.vin.substr(updateObject.car.vin.length - 6) : '';
                const existCar = await car_model_1.default.findOne({ team, vin: updateObject.car.vin });
                if (existCar && requestItem && existCar.vin !== requestItem.car.vin) {
                    // validate exist car and change vin
                    await requestItem_model_1.default.update({ _id: id, team }, { $set: { car: existCar } });
                }
                else if (requestItem && requestItem.car.vin !== updateObject.car.vin) {
                    // validate chamge vin
                    const inventories = await inventoryCar_model_1.default.find({ car: requestItem.car }).count();
                    const participants = await participant_model_1.default.find({ team, car: requestItem.car }).count();
                    const requests = await requestItem_model_1.default.find({ team, car: requestItem.car, _id: { $ne: requestItem._id } }).count();
                    if (inventories || participants || requests) {
                        // validate car has actions in the system
                        delete updateObject.car._id;
                        const newCar = await new car_model_1.default(updateObject.car).save();
                        await requestItem_model_1.default.update({ _id: id, team }, { $set: { car: newCar } });
                    }
                    else {
                        await car_model_1.default.update({ _id: updateObject.car._id, team }, { $set: updateObject.car });
                    }
                }
                else {
                    await car_model_1.default.update({ _id: updateObject.car._id, team }, { $set: updateObject.car });
                }
            }
            const item = await requestItem_model_1.default
                .findOne({ _id: id, team })
                .populate(this.itemPopulate)
                .lean();
            await request_model_1.default.update({ _id: item.request._id }, { $set: { updatedAt: moment() } });
            server_1.io.to(`request-list-${team}`).emit('UPDATE_REQUEST_ITEM', {
                idRequest: item.request._id,
                item
            });
            server_1.io.to(`request-detail-${team}`).emit('UPDATE_REQUEST_ITEM', {
                idRequest: item.request._id,
                item
            });
            res.status(200).json({
                ...item
            });
            // todo: send update object to socket team
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            /* istanbul ignore next */
            logger_service_1.default.error(`RequestController.apiPatchItem: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            res.status(500).json(e);
        }
    }
    getRequets(filter, options) {
        return new Promise((resolve, reject) => {
            request_model_1.default.paginate(filter, options, (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
    async downloadItemFiles(req, res) {
        const { id } = req.params;
        const team = req.user.team._id;
        try {
            const requestItems = await requestItem_model_1.default
                .findOne({ _id: id, team })
                .populate(this.itemPopulate);
            if (requestItems) {
                const archive = archiver('zip', {
                    zlib: {
                        level: 0
                    }
                });
                archive.on('error', (err) => {
                    res.status(500).send({
                        error: err.message
                    });
                });
                const filename = `attachments_${requestItems._id}.zip`;
                archive.on('end', () => {
                    console.log(`${filename}: Archive wrote ${(archive.pointer() / (1024 * 1024)).toFixed(2)}MB`);
                });
                res.attachment(filename);
                const filesToDownload = [];
                const filesToCompress = [];
                for (const file of requestItems.files) {
                    const destDirectory = `/tmp/${file._id}_${file.file.name}`;
                    filesToDownload.push(() => this.downloadFile(decodeURI(file.file.url), destDirectory));
                    filesToCompress.push({
                        destDirectory,
                        name: file.file.name
                    });
                }
                // download files
                console.log('EXECUTE PROMISES');
                let results = [];
                let numb = 1;
                while (filesToDownload.length) {
                    console.log('promise', numb);
                    results = [...results, ...await bluebird.all(filesToDownload.splice(0, 20).map((promise) => promise()))];
                    numb++;
                }
                // compress files
                console.log('EXECUTE COMPRESS');
                filesToCompress.map((file) => {
                    archive.file(file.destDirectory, {
                        name: file.name
                    });
                    setTimeout(() => {
                        if (fs.existsSync(file.destDirectory)) {
                            console.log(`clear ${file.destDirectory}`);
                            fs.unlink(file.destDirectory, (err) => {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        }
                    }, 7200000);
                });
                console.log('results', results);
                res.setHeader('size', results.reduce((a, b) => a + b));
                archive.pipe(res);
                archive.finalize();
            }
            else {
                res.status(404).json({ message: 'Not found' });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            /* istanbul ignore next */
            logger_service_1.default.error(`RequestController.downloadItemFiles: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            res.status(500).json(e);
        }
    }
    async downloadFile(url, dest) {
        return new Promise(async (resolve, reject) => {
            try {
                // generate directory name from dest var
                const directories = dest.split('/');
                directories.pop();
                // validate that the directory exist and create recursive if it does not exist
                const directoyName = directories.join('/');
                if (!fs.existsSync(directoyName)) {
                    fs.mkdirSync(directoyName, { recursive: true });
                }
                const file = fs.createWriteStream(dest);
                // download file
                https.get(url, (response) => {
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve(response.headers['content-length'] ? parseInt(response.headers['content-length'], 10) : 0);
                    });
                });
            }
            catch (e) {
                // Validate that the file exists and delete it if it exists.
                if (fs.existsSync(dest)) {
                    fs.unlink(dest, (err) => {
                        if (err) {
                            reject(err);
                        }
                    });
                }
                else {
                    console.log(url);
                    reject(e);
                }
            }
        });
    }
    async uploadFile(req, res) {
        const { company } = req.user;
        const team = req.user.team._id;
        logger_service_1.default.info(`RequestController.uploadFile`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
        const file = general_utils_1.default.getFileFromRequest(req.files, 'file');
        if (file) {
            try {
                const requestFile = new requestFile_model_1.default();
                /*
                  {
                    fieldname: 'file',
                    originalname: 'Captura de pantalla 2018-06-28 a la(s) 11.59.58.png',
                    encoding: '7bit',
                    mimetype: 'image/png',
                    destination: '/tmp/',
                    filename: 'Captura de pantalla 2018-06-28 a la(s) 11.59.58.png',
                    path: '/tmp/Captura de pantalla 2018-06-28 a la(s) 11.59.58.png',
                    size: 794429
                  }
                */
                file.headers = {
                    'Content-Type': file.mimetype
                };
                file.team = team._id;
                requestFile.user = req.user._id;
                requestFile.company = company._id;
                // fix exif
                if (new RegExp('\\bimage\\b').test(file.mimetype)) {
                    try {
                        await this.autoRotate(file.path);
                    }
                    catch (e) {
                        logger_service_1.default.error('RequestController.uploadFile: Error making autoRotate');
                    }
                }
                await requestFile.attach('file', file);
                if (new RegExp('\\bimage\\b').test(file.mimetype)) {
                    try {
                        await this.resizeImage(file.path);
                        await requestFile.attach('thumbnail', file);
                    }
                    catch (e) {
                        logger_service_1.default.error('RequestController.uploadFile: Error making thumbnail');
                    }
                }
                await requestFile.save();
                res.status(201).json({
                    data: {
                        _id: requestFile._id,
                        file: requestFile.file
                    },
                    status: 201
                });
            }
            catch (e) {
                /* istanbul ignore next */
                logger_service_1.default.error(`RequestController.uploadFile: Async Error.`);
                /* istanbul ignore next */
                logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
                /* istanbul ignore next */
                logger_service_1.default.error(e);
                /* istanbul ignore next */
                res.status(400).json(e);
            }
        }
        else {
            logger_service_1.default.error(`RequestController.uploadFile: The file are required.`);
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            res.status(400).json({
                message: 'La imagen es obligatoria.',
                status: 400
            });
        }
    }
    autoRotate(path) {
        // doc http://aheckmann.github.io/gm/docs.html
        /**** REQUIRE *****
         brew install imagemagick
         brew install graphicsmagick
         * */
        return new Promise((resolve, reject) => {
            GraphicsMagick(path)
                .autoOrient()
                .write(path, (err) => {
                if (err) {
                    /* istanbul ignore next */
                    reject(err);
                }
                else {
                    resolve({});
                }
            });
        });
    }
    resizeImage(path) {
        // doc http://aheckmann.github.io/gm/docs.html
        /**** REQUIRE *****
         brew install imagemagick
         brew install graphicsmagick
         * */
        return new Promise((resolve, reject) => {
            GraphicsMagick(path)
                .resize(100, 100)
                .write(path, (err) => {
                if (err) {
                    /* istanbul ignore next */
                    reject(err);
                }
                else {
                    resolve(true);
                }
            });
        });
    }
}
exports.default = new RequestController();
//# sourceMappingURL=request.controller.js.map