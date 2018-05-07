"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const containSchema = new mongoose.Schema({
    text: String,
    domain: String
});
const equalSchema = new mongoose.Schema({
    text: String,
    domain: String
});
const settingSchema = new mongoose.Schema({
    name: String,
    contain: [containSchema],
    equal: [equalSchema],
    active: Boolean
}, {
    timestamps: true
});
const Setting = mongoose.model('Setting', settingSchema);
exports.default = Setting;
//# sourceMappingURL=setting.model.js.map