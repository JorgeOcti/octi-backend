"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
const car_model_1 = require("../../app/models/car.model");
const team_model_1 = require("../../app/models/team.model");
const server_1 = require("../../server");
const logger_service_1 = require("../../services/logger.service");
const request_model_1 = require("../models/request.model");
const requestItem_model_1 = require("../models/requestItem.model");
const requestItemStatus_model_1 = require("../models/requestItemStatus.model");
class RequestController {
    constructor() {
        this.itemPopulate = [{
                path: 'car'
            }, {
                path: 'request'
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
                        _id: -1
                    }
                },
                populate: this.itemPopulate
            }];
        this.index = this.index.bind(this);
        this.apiList = this.apiList.bind(this);
        this.apiDetail = this.apiDetail.bind(this);
        this.apiCreate = this.apiCreate.bind(this);
        this.getRequets = this.getRequets.bind(this);
        this.apiPatchItem = this.apiPatchItem.bind(this);
        this.apiDeleteRequest = this.apiDeleteRequest.bind(this);
        this.apiDeleteRequestItem = this.apiDeleteRequestItem.bind(this);
    }
    async index(req, res) {
        res.render('app/index', { token: await req.user.generateToken() });
    }
    async apiCreate(req, res) {
        const { team, company } = req.user;
        const { cars, venue, fleet } = req.body;
        try {
            const defaultItemStatus = await requestItemStatus_model_1.default.findOneOrCreate({ team, default: true }, { name: 'En proceso', default: true, team });
            const updateTeam = await team_model_1.default.findOne({ _id: team._id });
            const request = await new request_model_1.default({
                team,
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
                    washed: car.washed,
                    equipment: car.equipment,
                    priority: car.priority,
                    origin: venue,
                    destination: venue,
                    status: defaultItemStatus,
                    createdBy: req.user
                }).save();
            }
            await team_model_1.default.findOneAndUpdate({ _id: team._id }, { $inc: { requestNumber: 1 } }, { new: true });
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
    async apiList(req, res) {
        logger_service_1.default.info(`RequestController.apiList`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
        const { team } = req.user;
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
            team
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
        const { team } = req.user;
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
        const { team } = req.user;
        const { id } = req.params;
        try {
            const request = await request_model_1.default
                .findOne({
                _id: id,
                team
            });
            if (request) {
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
        const { team } = req.user;
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
        const { team } = req.user;
        const { search } = req.query;
        try {
            /*const searchText = new RegExp(search, 'i');
            const cars = await Car.aggregate([{
              $match: {
                team,
                $or:[{
                  brand: {$regex: searchText}
                }, {
                  denomination: {$regex: searchText}
                }]
              }
            }, {
              $project: {
                vin: 1,
                brand: 1,
                denomination: 1,
              }
            }, {
              $group: {
                _id: {
                  brand: '$brand',
                  denomination: '$denomination'
                }
              }
            }, {
              $limit: 100
            }, {
              $project: {
                brand: "$_id.brand",
                denomination: "$_id.denomination",
                score: "$_id.score",
                _id: false
              }
            }]);*/
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
            /*const cars = await Car.find({
              team,
              $or:[{
                  brand: {$regex: searchText}
                }, {
                  denomination: {$regex: searchText}
                }]
            }, {_id:1, brand: 1, denomination: 1}).limit(100);*/
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
    async apiPatchItem(req, res) {
        const { team } = req.user;
        const updateObject = req.body;
        const { id } = req.params;
        try {
            await requestItem_model_1.default.update({ _id: id, team }, { $set: { ...updateObject } });
            await car_model_1.default.update({ _id: updateObject.car._id, team }, { $set: updateObject.car });
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
}
exports.default = new RequestController();
//# sourceMappingURL=request.controller.js.map