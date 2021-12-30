"use strict";
exports.__esModule = true;
exports.formTriggerSchema = exports.triggerConfigSchema = exports.integrationTypes = exports.IntegrationType = exports.kindsTrigger = exports.KindTrigger = void 0;
var mongoose = require("mongoose");
var KindTrigger;
(function (KindTrigger) {
    KindTrigger["file"] = "file";
    KindTrigger["email"] = "email";
    KindTrigger["request"] = "request";
    KindTrigger["integration"] = "integration";
})(KindTrigger = exports.KindTrigger || (exports.KindTrigger = {}));
exports.kindsTrigger = [
    KindTrigger.file,
    KindTrigger.email,
    KindTrigger.request,
    KindTrigger.integration
];
var IntegrationType;
(function (IntegrationType) {
    IntegrationType["http"] = "http";
    IntegrationType["sap"] = "sap";
    IntegrationType["conecta"] = "conecta";
    IntegrationType["integration"] = "integration";
})(IntegrationType = exports.IntegrationType || (exports.IntegrationType = {}));
exports.integrationTypes = [
    IntegrationType.http,
    IntegrationType.sap,
    IntegrationType.conecta
];
exports.triggerConfigSchema = new mongoose.Schema({
    fullname: {
        type: mongoose.Schema.Types.Mixed
    },
    email: {
        type: mongoose.Schema.Types.Mixed
    },
    signature: {
        type: mongoose.Schema.Types.ObjectId
    },
    subject: {
        type: String
    },
    responsible: {
        type: Boolean,
        "default": false
    },
    filename: {
        type: String
    },
    template: {
        type: String
    },
    integrationType: {
        type: String,
        "enum": exports.integrationTypes
    },
    header: {
        type: String
    },
    url: {
        type: String
    },
    method: {
        type: String
    },
    body: {
        type: String
    },
    requestItemStatus: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RequestItemStatus'
    }
});
exports.formTriggerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    kind: {
        type: String,
        "enum": exports.kindsTrigger
    },
    enabled: {
        type: Boolean,
        "default": true
    },
    config: exports.triggerConfigSchema
});
var FormTrigger = mongoose.model('FormTrigger', exports.formTriggerSchema);
exports["default"] = FormTrigger;
//# sourceMappingURL=trigger.model.js.map