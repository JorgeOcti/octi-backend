"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transmittalItem_model_1 = require("../models/transmittalItem.model");
const transmittal_controller_1 = require("./transmittal.controller");
const logger_service_1 = require("../../services/logger.service");
const server_1 = require("../../server");
const transmittal_model_1 = require("../models/transmittal.model");
const requestItem_model_1 = require("../../request/models/requestItem.model");
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
        const { team } = req.user;
        try {
            const newTransmittalItem = await transmittalItem_model_1.default
                .findOneAndUpdate({ _id: id }, { $set: transmittalItem }, { new: true })
                .populate(transmittal_controller_1.default.itemPopulate);
            server_1.io.to(`transmittal-list-${team._id}`).emit('UPDATE_TRANSMITTAL_ITEM', {
                transmittalItem: newTransmittalItem
            });
            res.json({
                data: newTransmittalItem,
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
        const { body: item, user } = req;
        const { team } = user;
        try {
            const transmittalItem = await new transmittalItem_model_1.default({
                team,
                ...item
            }).save();
            const transmittalItemData = await transmittalItem_model_1.default
                .findById(transmittalItem._id)
                .populate(transmittal_controller_1.default.itemPopulate);
            // associate request item with transmittal and transmittal item
            await requestItem_model_1.default.findOneAndUpdate({
                _id: item.requestItem
            }, {
                assigned: true,
                transmittal: item.transmittal,
                transmittalItem: transmittalItem._id
            });
            server_1.io.to(`transmittal-list-${team._id}`)
                .emit('CREATE_TRANSMITTAL_ITEM', {
                transmittalItem: transmittalItemData
            });
            res.json({
                data: transmittalItemData
            });
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            /* istanbul ignore next */
            logger_service_1.default.error(`TransmittalItemController.apiCreate: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            res.status(500).json(e);
        }
    }
    async apiDelete(req, res) {
        logger_service_1.default.info(`TransmittalItemController.apiDelete`);
        const { id } = req.params;
        const { team } = req.user;
        try {
            const transmittalItem = await transmittalItem_model_1.default.findOne({ _id: id });
            if (transmittalItem) {
                await transmittalItem.remove();
                const transmittalItems = await transmittalItem_model_1.default.find({ transmittal: transmittalItem.transmittal }).count();
                server_1.io.to(`transmittal-list-${team._id}`).emit('DELETE_TRANSMITTAL_ITEM', {
                    transmittalItem
                });
                // clear assigned request item
                await requestItem_model_1.default.findOneAndUpdate({
                    _id: transmittalItem.requestItem
                }, {
                    assigned: false,
                    transmittal: null,
                    transmittalItem: null
                });
                // clean transmittal
                if (transmittalItems === 0) {
                    const transmittal = await transmittal_model_1.default.findOne({ _id: transmittalItem.transmittal });
                    await transmittal.remove();
                    server_1.io.to(`transmittal-list-${team._id}`).emit('DELETE_TRANSMITTAL', {
                        transmittal
                    });
                }
            }
            res.json({
                transmittalItem
            });
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            /* istanbul ignore next */
            logger_service_1.default.error(`TransmittalItemController.apiDelete: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            res.status(500).json(e);
        }
    }
}
exports.default = new TransmittalItemController();
//# sourceMappingURL=transmittalItem.controller.js.map