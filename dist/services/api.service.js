"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const logger_service_1 = require("./logger.service");
class ApiService {
    constructor() {
        const headers = {};
        headers['Content-Type'] = 'application/json';
        this.instance = axios_1.default.create({
            headers
        });
    }
    /* istanbul ignore next */
    errorHandler(err) {
        const ingnoreStatus = [404];
        if (err.response) {
            if (!ingnoreStatus.includes(err.response.status)) {
                logger_service_1.default.error(JSON.stringify(err.response));
            }
        }
        else if (err.request) {
            logger_service_1.default.error(JSON.stringify(err.request));
        }
        else {
            logger_service_1.default.error(JSON.stringify(err));
        }
    }
}
exports.default = new ApiService();
//# sourceMappingURL=api.service.js.map