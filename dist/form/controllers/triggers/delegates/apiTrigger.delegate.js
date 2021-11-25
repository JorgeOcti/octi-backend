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
var nullTrigger_delegate_1 = require("./nullTrigger.delegate");
var logger_service_1 = require("../../../../services/logger.service");
var RequestDelegate = /** @class */ (function (_super) {
    __extends(RequestDelegate, _super);
    function RequestDelegate() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RequestDelegate.prototype.trigger = function (trigger, answers, payload) {
        logger_service_1["default"].info("Kind Trigger: " + trigger.kind + " performing");
        return payload;
    };
    return RequestDelegate;
}(nullTrigger_delegate_1["default"]));
exports["default"] = RequestDelegate;
//# sourceMappingURL=apiTrigger.delegate.js.map