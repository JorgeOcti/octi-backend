"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formTriggerSchema = exports.triggerConfigSchema = exports.kindTrigger = exports.KindTrigger = void 0;
const mongoose = require("mongoose");
var KindTrigger;
(function (KindTrigger) {
    KindTrigger["file"] = "file";
    KindTrigger["email"] = "email";
})(KindTrigger = exports.KindTrigger || (exports.KindTrigger = {}));
exports.kindTrigger = [
    KindTrigger.file,
    KindTrigger.email,
];
exports.triggerConfigSchema = new mongoose.Schema({
    fullname: [mongoose.Schema.Types.Mixed],
    email: [mongoose.Schema.Types.Mixed],
    signature: mongoose.Schema.Types.ObjectId,
    subject: String,
    filename: String,
    template: String
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
        enum: exports.kindTrigger
    },
    enabled: {
        type: Boolean,
        default: true
    },
    config: exports.triggerConfigSchema
});
const FormTrigger = mongoose.model('FormTrigger', exports.formTriggerSchema);
exports.default = FormTrigger;
//# sourceMappingURL=trigger.model.js.map