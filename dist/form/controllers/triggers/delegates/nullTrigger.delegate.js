"use strict";
exports.__esModule = true;
var logger_service_1 = require("../../../../services/logger.service");
var NullTriggerDelegate = /** @class */ (function () {
    function NullTriggerDelegate() {
    }
    NullTriggerDelegate.prototype.processTrigerConfig = function (trigger, answers) {
        var data = {};
        Object.keys(trigger.config.toJSON()).map(function (k) {
            data[k] = answers.hasOwnProperty(trigger.config[k].toString()) ?
                answers[trigger.config[k].toString()] : trigger.config[k].toString();
        });
        return data;
    };
    NullTriggerDelegate.prototype.trigger = function (trigger, answers, payload) {
        logger_service_1["default"].error("Kind Trigger: " + trigger.kind + " not implemented ");
    };
    return NullTriggerDelegate;
}());
exports["default"] = NullTriggerDelegate;
//# sourceMappingURL=nullTrigger.delegate.js.map