"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_service_1 = require("../../services/logger.service");
const server_1 = require("../../server");
const reason_model_1 = require("../models/reason.model");
class ReasonController {
    constructor() {
        this.apiList = this.apiList.bind(this);
        this.apiCreate = this.apiCreate.bind(this);
        this.apiUpdate = this.apiUpdate.bind(this);
        this.apiDelete = this.apiDelete.bind(this);
    }
    async apiList(req, res) {
        logger_service_1.default.info(`ReasonController.apiList`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
        const team = req.user.team._id;
        const { page, pageSize } = req.query;
        // paginate options
        const options = {
            sort: {
                name: 1
            },
            select: {
                name: true,
                file: true,
                questions: true,
                updatedAt: true,
                createdAt: true
            },
            page: parseInt(page ? page : '1', 10),
            limit: parseInt(pageSize ? pageSize : '20', 10)
        };
        try {
            const reasons = await this.getReasons({ team }, options);
            /* istanbul ignore if  */
            if (options.page && reasons.pages && reasons.pages < options.page) {
                res.status(400).json({
                    message: 'La página solicitada no existe.',
                    status: 400
                });
            }
            else {
                res.json({
                    count: reasons.total,
                    pages: reasons.pages,
                    hasPrevious: options.page && options.page > 1 && reasons.pages && reasons.pages >= options.page,
                    hasNext: options.page && reasons.pages && reasons.pages > options.page,
                    results: reasons.docs,
                    status: 200
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`ReasonController.apiList: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            res.status(500).json(e);
        }
    }
    async apiCreate(req, res) {
        const { team } = req.user;
        const object = req.body;
        try {
            const reason = await new reason_model_1.default({ ...object, team }).save();
            server_1.io.to(`reasons-list-${team._id}`).emit('REFRESH', {
                update: true
            });
            res.status(200).json({
                ...reason
            });
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`ReasonController.apiCreate: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            res.status(500).json(e);
        }
    }
    async apiUpdate(req, res) {
        const { team } = req.user;
        const { id } = req.params;
        const update = req.body;
        try {
            const reason = await reason_model_1.default.findOneAndUpdate({ _id: id }, { $set: { ...update } });
            server_1.io.to(`reasons-list-${team._id}`).emit('REFRESH', {
                update: true
            });
            res.status(200).json({
                ...reason
            });
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`ReasonController.apiUpdate: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            res.status(500).json(e);
        }
    }
    async apiDelete(req, res) {
        const { team } = req.user;
        const { id } = req.params;
        try {
            const reason = await reason_model_1.default.findOneAndDelete({ _id: id, team });
            server_1.io.to(`reasons-list-${team._id}`).emit('REFRESH', {
                update: true
            });
            res.status(200).json({
                ...reason
            });
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`ReasonController.apiDelete: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            res.status(500).json(e);
        }
    }
    getReasons(filter, options) {
        return new Promise((resolve, reject) => {
            reason_model_1.default.paginate(filter, options, (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
}
exports.default = new ReasonController();
//# sourceMappingURL=reason.controller.js.map