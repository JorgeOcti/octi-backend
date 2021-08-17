"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.WebError = exports.APIError = void 0;
// import * as Raven from 'raven';
/**
 * @extends Error
 */
var ExtendableError = /** @class */ (function (_super) {
    __extends(ExtendableError, _super);
    function ExtendableError(message, status) {
        var _this = _super.call(this, message) || this;
        _this.name = _this.constructor.name;
        _this.message = message;
        _this.status = status;
        Error.captureStackTrace(_this);
        return _this;
    }
    return ExtendableError;
}(Error));
/**
 * Class representing an API error.
 * @extends ExtendableError
 */
var APIError = /** @class */ (function (_super) {
    __extends(APIError, _super);
    /**
     * Creates an API error.
     * @param {string} message - Error message.
     * @param {number} status - HTTP status code of error.
     */
    function APIError(message, status) {
        if (status === void 0) { status = 500; }
        var _this = _super.call(this, message, status) || this;
        _this.name = _this.constructor.name;
        return _this;
    }
    return APIError;
}(ExtendableError));
exports.APIError = APIError;
/**
 * Class representing an Web error.
 * @extends ExtendableError
 */
var WebError = /** @class */ (function (_super) {
    __extends(WebError, _super);
    /**
     * Creates an API error.
     * @param {string} message - Error message.
     * @param {number} status - HTTP status code of error.
     */
    function WebError(message, status) {
        if (status === void 0) { status = 500; }
        var _this = _super.call(this, message, status) || this;
        _this.name = _this.constructor.name;
        return _this;
    }
    return WebError;
}(ExtendableError));
exports.WebError = WebError;
//# sourceMappingURL=errors.helper.js.map