"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const requestItemStatus_model_1 = require("../models/requestItemStatus.model");
const logger_service_1 = require("../../services/logger.service");
class RequestItemStatusController {
    constructor() {
        this.apiList = this.apiList.bind(this);
    }
    async apiList(req, res) {
        const { page, pageSize } = req.query;
        const team = req.user.team._id;
        const options = {
            sort: {
                weigth: 1
            },
            page: parseInt(page ? page : '1', 10),
            limit: parseInt(pageSize ? pageSize : '200', 10)
        };
        try {
            const filter = { team };
            const requestItemStatus = await this.getRequetsItemStatus(filter, options);
            /* istanbul ignore if  */
            if (options.page && requestItemStatus.pages && requestItemStatus.pages < options.page) {
                res.status(400).json({
                    message: 'La página solicitada no existe.',
                    status: 400
                });
            }
            else {
                const min = await requestItemStatus_model_1.default.findOne({ team }).sort('weigth');
                const max = await requestItemStatus_model_1.default.findOne({ team }).sort('-weigth');
                res.json({
                    count: requestItemStatus.total,
                    pages: requestItemStatus.pages,
                    min: min ? min.weigth : 0,
                    max: max ? max.weigth : 1,
                    hasPrevious: options.page && options.page > 1 && requestItemStatus.pages && requestItemStatus.pages >= options.page,
                    hasNext: options.page && requestItemStatus.pages && requestItemStatus.pages > options.page,
                    results: requestItemStatus.docs,
                    status: 200
                });
            }
        }
        catch (e) {
            logger_service_1.default.error(e);
            /* istanbul ignore next */
            logger_service_1.default.error(`RequestItemStatusController.apiList: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            res.status(500).json(e);
        }
    }
    getRequetsItemStatus(filter, options) {
        return new Promise((resolve, reject) => {
            requestItemStatus_model_1.default.paginate(filter, options, (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
}
exports.default = new RequestItemStatusController();
//# sourceMappingURL=requestItemStatus.controller.js.map