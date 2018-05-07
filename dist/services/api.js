"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const logger_1 = require("../services/logger");
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
                logger_1.default.error(JSON.stringify(err.response));
            }
        }
        else if (err.request) {
            logger_1.default.error(JSON.stringify(err.request));
        }
        else {
            logger_1.default.error(JSON.stringify(err));
        }
    }
}
exports.default = new ApiService();
//# sourceMappingURL=api.js.map