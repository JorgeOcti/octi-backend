"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transmittalItem_model_1 = require("../models/transmittalItem.model");
const logger_service_1 = require("../../services/logger.service");
class TransmittalItemController {
    constructor() {
        this.index = this.index.bind(this);
        this.apiList = this.apiList.bind(this);
        this.apiDetail = this.apiDetail.bind(this);
        this.apiCreate = this.apiCreate.bind(this);
        this.apiDelete = this.apiDelete.bind(this);
        this.apiUpdate = this.apiUpdate.bind(this);
    }
    async index(req, res) {
        res.render('app/index', { token: await req.user.generateToken() });
    }
    async apiList(req, res) {
        res.json({
            api: 'apiList:apiDetail'
        });
    }
    async apiDetail(req, res) {
        res.json({
            api: 'TransmittalItemController:apiDetail'
        });
    }
    async apiUpdate(req, res) {
        logger_service_1.default.info(`TransmittalItemController.apiUpdate`);
        const { id } = req.params;
        const { body: transmittalItem } = req;
        try {
            const newTransmittalItem = await transmittalItem_model_1.default.findOneAndUpdate({ _id: id }, { $set: transmittalItem }, { new: true });
            res.json({
                transmittalItem,
                newTransmittalItem,
                api: 'TransmittalItemController:apiUpdate'
            });
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            /* istanbul ignore next */
            logger_service_1.default.error(`TransmittalItemController.apiUpdate: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            res.status(500).json(e);
        }
    }
    async apiCreate(req, res) {
        res.json({
            api: 'TransmittalItemController:apiCreate'
        });
    }
    async apiDelete(req, res) {
        res.json({
            api: 'TransmittalItemController:apiDelete'
        });
    }
}
exports.default = new TransmittalItemController();
//# sourceMappingURL=transmittalItem.controller.js.map