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
    fullname: mongoose.Schema.Types.ObjectId,
    email: mongoose.Schema.Types.ObjectId,
    signature: mongoose.Schema.Types.ObjectId,
    subject: {
        type: String,
        required: false
    },
    filename: {
        type: String,
        required: false
    },
    template: {
        type: String,
        required: false
    },
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
        enum: exports.kindTrigger,
    },
    config: exports.triggerConfigSchema
});
//# sourceMappingURL=trigger.model.js.map