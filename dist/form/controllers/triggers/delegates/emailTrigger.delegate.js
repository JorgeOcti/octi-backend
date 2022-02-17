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
        var re = /^\w+([\\.-]?\w+)*@\w+([\\.-]?\w+)*(\.\w{2,3})+$/;
        return re.test(email.toLowerCase());
    };
    EmailTriggerDelegate.prototype.trigger = function (trigger, answers, payload) {
        var _a;
        logger_service_1["default"].info("Kind Trigger: ".concat(trigger.kind, " performing"));
        var context = this.processTrigerConfig(trigger, __assign(__assign({}, answers), payload.user));
        logger_service_1["default"].info("Kind Trigger: context =>".concat(JSON.stringify(context)));
        if ((trigger.config.responsible && !((_a = payload.responsible) === null || _a === void 0 ? void 0 : _a.length)) || (!trigger.config.responsible && !this.validateEmail(context.email))) {
            return payload;
        }
        var recipients;
        if (trigger.config.responsible) {
            recipients = payload.responsible.map(function (obj) { return "\"".concat(obj.firstName, " ").concat(obj.lastName, "\"<").concat(obj.email, ">"); });
        }
        else {
            recipients = "\"".concat(context.fullname, "\"<").concat(context.email, ">");
        }
        app_1.queue.create('email', {
            from: '',
            title: "\"".concat(context.subject, " | ").concat(context.fullname),
            to: recipients,
            subject: "".concat(trigger.config.subject),
            text: "",
            attachments: payload.files || [],
            view: trigger.config.template,
            context: __assign(__assign(__assign({}, payload), context), answers)
        }).priority('high').attempts(5).save();
        logger_service_1["default"].info("Kind Trigger: ".concat(trigger.kind, " executed"));
        return payload;
    };
    return EmailTriggerDelegate;
}(nullTrigger_delegate_1["default"]));
exports["default"] = EmailTriggerDelegate;
//# sourceMappingURL=emailTrigger.delegate.js.map