"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const transmittal_model_1 = require("../models/transmittal.model");
const logger_service_1 = require("../../services/logger.service");
const transmittalItem_model_1 = require("../models/transmittalItem.model");
const transmittalTransporter_model_1 = require("../models/transmittalTransporter.model");
const transmittalFile_model_1 = require("../models/transmittalFile.model");
const general_utils_1 = require("../../utils/general.utils");
const GraphicsMagick = require("gm");
const team_model_1 = require("../../app/models/team.model");
const ObjectId = mongoose.Types.ObjectId;
class TransmittalController {
    aggregateCustomLabels = {
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
    constructor() {
        this.index = this.index.bind(this);
        this.apiList = this.apiList.bind(this);
        this.apiDetail = this.apiDetail.bind(this);
        this.apiCreate = this.apiCreate.bind(this);
        this.apiDelete = this.apiDelete.bind(this);
        this.uploadFile = this.uploadFile.bind(this);
        const test = new transmittalFile_model_1.default();
        if (test) {
            console.log(test);
        }
    }
    async index(req, res) {
        res.render('app/index', { token: await req.user.generateToken() });
    }
    async apiDetail(req, res) {
        logger_service_1.default.info(`TransmittalController.apiDetail`);
        res.json({
            api: 'TransmittalController:apiDetail'
        });
    }
    async apiCreate(req, res) {
        logger_service_1.default.info(`TransmittalController.apiCreate`);
        const { name, items, files, transporter } = req.body;
        const { user } = req;
        try {
            const updateTeam = await team_model_1.default.findOneAndUpdate({ _id: user.team._id }, { $inc: { transmittalNumber: 1 } }, { new: true });
            const transmittal = new transmittal_model_1.default({
                name,
                team: user.team,
                number: updateTeam.transmittalNumber,
                createdBy: user._id
            });
            await transmittal.save();
            const itemsResponse = await Promise.all(items.map((item) => (new transmittalItem_model_1.default({
                ...item,
                transmittal
            }).save())));
            if (files && files.length) {
                transmittal.files = files;
                await transmittal.save();
                await transmittalFile_model_1.default.updateMany({ _id: { $in: files } }, { $set: { transmittal } });
            }
            const transporterResponse = await new transmittalTransporter_model_1.default({
                ...transporter,
                transmittal
            }).save();
            res.json({
                transmittal,
                itemsResponse,
                transporterResponse
            });
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`TransmittalController.apiCreate: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            res.status(500).json(e);
        }
    }
    async apiDelete(req, res) {
        logger_service_1.default.info(`TransmittalController.apiDelete`);
        res.json({
            api: 'TransmittalController:apiDelete'
        });
    }
    async apiList(req, res) {
        logger_service_1.default.info(`TransmittalController.apiList`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
        const team = req.user.team._id;
        const { page, pageSize, search, orderBy, orderType } = req.query;
        // paginate options
        const options = {
            sort: {
                [orderBy || '_id']: orderType === 'ascending' ? 1 : -1
            },
            populate: [{
                    path: 'transporter',
                    select: ['carrier', 'driver', 'patent'],
                    populate: [{
                            path: 'carrier',
                            select: ['name']
                        }, {
                            path: 'driver',
                            select: ['firstName', 'lastName']
                        }]
                }, {
                    path: 'items',
                    select: ['car', 'requestItem', 'destination', 'origin', 'loadingDate', 'arrivalDate'],
                    populate: [{
                            path: 'car',
                            select: ['invoice', 'entry', 'denomination', 'patent', 'material', 'vin', 'brand', 'color']
                        }, {
                            path: 'destination',
                            select: ['name']
                        }, {
                            path: 'origin',
                            select: ['name']
                        }]
                }, {
                    path: 'files',
                    select: ['file', 'thumbnail']
                }, {
                    path: 'createdBy',
                    select: ['firstName', 'lastName']
                }],
            page: parseInt(page ? page : '1', 10),
            limit: parseInt(pageSize ? pageSize : '20', 10)
        };
        const filter = {
            team
        };
        if (search) {
            // add here conditions to search
        }
        try {
            const transmittals = await this.getTransmittals(filter, options);
            /* istanbul ignore if  */
            if (options.page && transmittals.pages && transmittals.pages < options.page) {
                res.status(400).json({
                    message: 'La página solicitada no existe.',
                    status: 400
                });
            }
            else {
                res.json({
                    count: transmittals.total,
                    pages: transmittals.pages,
                    hasPrevious: options.page && options.page > 1 && transmittals.pages && transmittals.pages >= options.page,
                    hasNext: options.page && transmittals.pages && transmittals.pages > options.page,
                    results: transmittals.docs,
                    status: 200
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`TransmittalController.apiList: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            res.status(500).json(e);
        }
    }
    async apiListByAgregate(req, res) {
        logger_service_1.default.info(`TransmittalController.apiListByAgregate`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
        const { team } = req.user;
        const { page, pageSize, orderBy, orderType, filters } = req.body;
        try {
            console.log('filters', filters);
            const options = {
                page: parseInt(page ? page : '1', 10),
                limit: parseInt(pageSize ? pageSize : '10', 10),
                customLabels: this.aggregateCustomLabels,
                countQuery: transmittal_model_1.default.aggregate([{
                        $match: {
                            team: ObjectId(team._id)
                        }
                    }])
            };
            const transmittalsAggregate = transmittal_model_1.default.aggregate([{
                    $match: {
                        team: ObjectId(team._id)
                    }
                }, {
                    $lookup: { from: 'transmittalitems', localField: '_id', foreignField: 'transmittal', as: 'items' }
                }, {
                    $lookup: { from: 'transmittaltransporters', localField: '_id', foreignField: 'transmittal', as: 'transporter' }
                }, {
                    $unwind: { path: '$transporter', preserveNullAndEmptyArrays: true }
                }, {
                    $sort: { [orderBy]: orderType === 'ascending' ? 1 : -1 }
                }]);
            const transmittals = await transmittal_model_1.default.aggregatePaginate(transmittalsAggregate, options);
            if (options.page && transmittals.pages && transmittals.pages < options.page) {
                res.status(400).json({
                    message: 'La página solicitada no existe.',
                    status: 400
                });
            }
            else {
                res.json({
                    count: transmittals.total,
                    pages: transmittals.pages,
                    hasPrevious: transmittals.hasPrevious,
                    hasNext: transmittals.hasNext,
                    results: transmittals.docs,
                    status: 200
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`TransmittalController.apiList: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            res.status(500).json(e);
        }
    }
    getTransmittals(filter, options) {
        return new Promise((resolve, reject) => {
            transmittal_model_1.default.paginate(filter, options, (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
    async uploadFile(req, res) {
        const { user } = req;
        logger_service_1.default.info(`TransmittalController.uploadFile`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
        const file = general_utils_1.default.getFileFromRequest(req.files, 'file');
        if (file) {
            try {
                const transmittaltFile = new transmittalFile_model_1.default();
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
                file.team = user.team._id;
                transmittaltFile.user = user._id;
                transmittaltFile.team = user.team._id;
                // fix exif
                if (new RegExp('\\bimage\\b').test(file.mimetype)) {
                    try {
                        await this.autoRotate(file.path);
                    }
                    catch (e) {
                        logger_service_1.default.error('TransmittalController.uploadFile: Error making autoRotate');
                    }
                }
                await transmittaltFile.attach('file', file);
                if (new RegExp('\\bimage\\b').test(file.mimetype)) {
                    try {
                        await this.resizeImage(file.path);
                        await transmittaltFile.attach('thumbnail', file);
                    }
                    catch (e) {
                        logger_service_1.default.error('TransmittalController.uploadFile: Error making thumbnail');
                    }
                }
                await transmittaltFile.save();
                res.status(201).json({
                    data: {
                        _id: transmittaltFile._id,
                        file: transmittaltFile.file
                    },
                    status: 201
                });
            }
            catch (e) {
                /* istanbul ignore next */
                logger_service_1.default.error(`TransmittalController.uploadFile: Async Error.`);
                /* istanbul ignore next */
                logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
                /* istanbul ignore next */
                logger_service_1.default.error(e);
                /* istanbul ignore next */
                res.status(400).json(e);
            }
        }
        else {
            logger_service_1.default.error(`TransmittalController.uploadFile: The file are required.`);
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
exports.default = new TransmittalController();
//# sourceMappingURL=transmittal.controller.js.map