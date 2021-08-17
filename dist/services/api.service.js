"use strict";
exports.__esModule = true;
var axios_1 = require("axios");
var logger_service_1 = require("./logger.service");
var ApiService = /** @class */ (function () {
    function ApiService() {
        var headers = {};
        headers['Content-Type'] = 'application/json';
        this.instance = axios_1["default"].create({
            headers: headers
        });
    }
    /* istanbul ignore next */
    ApiService.prototype.errorHandler = function (err) {
        var ingnoreStatus = [404];
        if (err.response) {
            if (!ingnoreStatus.includes(err.response.status)) {
                logger_service_1["default"].error(JSON.stringify(err.response));
            }
        }
        else if (err.request) {
            logger_service_1["default"].error(JSON.stringify(err.request));
        }
        else {
            logger_service_1["default"].error(JSON.stringify(err));
        }
    };
    return ApiService;
}());
exports["default"] = new ApiService();
//# sourceMappingURL=api.service.js.map