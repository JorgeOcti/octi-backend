"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_service_1 = require("../../services/logger.service");
const salesChannel_model_1 = require("../models/salesChannel.model");
class SalesChannelController {
    constructor() {
        this.apiList = this.apiList.bind(this);
        this.getChannels = this.getChannels.bind(this);
        this.createDefault = this.createDefault.bind(this);
    }
    async apiList(req, res) {
        logger_service_1.default.info(`SalesChannelController.apiList`);
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
                updatedAt: true,
                createdAt: true
            },
            page: parseInt(page ? page : '1', 10),
            limit: parseInt(pageSize ? pageSize : '20', 10)
        };
        try {
            const channels = await this.getChannels({ team }, options);
            /* istanbul ignore if  */
            if (options.page && channels.pages && channels.pages < options.page) {
                res.status(400).json({
                    message: 'La página solicitada no existe.',
                    status: 400
                });
            }
            else {
                res.json({
                    count: channels.total,
                    pages: channels.pages,
                    hasPrevious: options.page && options.page > 1 && channels.pages && channels.pages >= options.page,
                    hasNext: options.page && channels.pages && channels.pages > options.page,
                    results: channels.docs,
                    status: 200
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`SalesChannelController.apiList: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            res.status(500).json(e);
        }
    }
    async createDefault(req, res) {
        const { team } = req.user;
        salesChannel_model_1.default.insertMany([{
                name: 'Retail',
                team,
                fleet: false
            }, {
                name: 'Digital',
                team,
                fleet: false
            }, {
                name: 'Flota',
                team,
                fleet: true
            }]);
        res.json({ created: 'ok' });
    }
    getChannels(filter, options) {
        return new Promise((resolve, reject) => {
            salesChannel_model_1.default.paginate(filter, options, (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
}
exports.default = new SalesChannelController();
//# sourceMappingURL=salesChanne.controller.js.map