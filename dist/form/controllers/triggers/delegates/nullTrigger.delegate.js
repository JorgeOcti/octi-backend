"use strict";
exports.__esModule = true;
var logger_service_1 = require("../../../../services/logger.service");
var NullTriggerDelegate = /** @class */ (function () {
    function NullTriggerDelegate() {
    }
    NullTriggerDelegate.prototype.processTrigerConfig = function (trigger, payload) {
        var _a, _b;
        logger_service_1["default"].info("Kind Trigger: processTrigerConfig");
        var context = {};
        Object.keys((_b = (_a = trigger.config) === null || _a === void 0 ? void 0 : _a.toObject()) !== null && _b !== void 0 ? _b : {}).map(function (configKey) {
            logger_service_1["default"].debug("Kind Trigger: configKey " + configKey + " => " + trigger.config[configKey]);
            context[configKey] = payload.hasOwnProperty(trigger.config[configKey])
                ? (payload[trigger.config[configKey]])
                : (trigger.config[configKey]);
        });
        logger_service_1["default"].info("Kind Trigger: context " + JSON.stringify(context));
        return context;
    };
    NullTriggerDelegate.prototype.trigger = function (trigger, answers, payload) {
        logger_service_1["default"].error("Kind Trigger: " + trigger.kind + " not implemented ");
    };
    return NullTriggerDelegate;
}());
exports["default"] = NullTriggerDelegate;
//# sourceMappingURL=nullTrigger.delegate.js.map