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
        const options = {
            sort: {
                _id: -1
            },
            page: parseInt(page ? page : '1', 10),
            limit: parseInt(pageSize ? pageSize : '20', 10)
        };
        try {
            const requestItemStatus = await this.getRequetsItemStatus(options);
            /* istanbul ignore if  */
            if (options.page && requestItemStatus.pages && requestItemStatus.pages < options.page) {
                res.status(400).json({
                    message: 'La página solicitada no existe.',
                    status: 400
                });
            }
            else {
                res.json({
                    count: requestItemStatus.total,
                    pages: requestItemStatus.pages,
                    hasPrevious: options.page && options.page > 1 && requestItemStatus.pages && requestItemStatus.pages >= options.page,
                    hasNext: options.page && requestItemStatus.pages && requestItemStatus.pages > options.page,
                    results: requestItemStatus.docs,
                    status: 200
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`RequestItemStatusController.apiList: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            res.status(500).json(e);
        }
    }
    getRequetsItemStatus(options) {
        return new Promise((resolve, reject) => {
            requestItemStatus_model_1.default.paginate({}, options, (err, result) => {
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