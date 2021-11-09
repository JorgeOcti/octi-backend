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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var nullTrigger_delegate_1 = require("./nullTrigger.delegate");
var logger_service_1 = require("../../../../services/logger.service");
var app_1 = require("../../../../app");
var EmailTriggerDelegate = /** @class */ (function (_super) {
    __extends(EmailTriggerDelegate, _super);
    function EmailTriggerDelegate() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EmailTriggerDelegate.prototype.validateEmail = function (email) {
        var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    };
    EmailTriggerDelegate.prototype.trigger = function (trigger, answers, payload) {
        logger_service_1["default"].info("Kind Trigger: " + trigger.kind + " performing");
        var data = this.processTrigerConfig(trigger, __assign(__assign({}, answers), payload.user));
        if (!this.validateEmail(data.email)) {
            return payload;
        }
        logger_service_1["default"].info("Kind Trigger: data =>" + JSON.stringify(data));
        app_1.queue.create('email', {
            from: '',
            title: "\"" + data.subject + " | " + data.fullname,
            to: "\"" + data.fullname + "\"<" + data.email + ">",
            subject: "" + data.subject,
            text: "",
            attachments: payload.files || [],
            view: trigger.config.template,
            context: __assign(__assign(__assign({}, payload), data), answers)
        }).priority('high').attempts(5).save();
        return payload;
    };
    return EmailTriggerDelegate;
}(nullTrigger_delegate_1["default"]));
exports["default"] = EmailTriggerDelegate;
//# sourceMappingURL=emailTrigger.delegate.js.map