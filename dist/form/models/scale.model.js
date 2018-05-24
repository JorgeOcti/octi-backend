"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const choiceSchema = new mongoose.Schema({
    choice: { type: String, required: true, trim: true },
    value: { type: Number, required: true },
    backgroundColor: { type: String, default: '#ffffff' },
    requireImage: { type: Boolean, default: false },
    requireComment: { type: Boolean, default: false },
    na: { type: Boolean, default: false },
    order: { type: Number, required: true }
});
exports.scaleSchema = new mongoose.Schema({
    name: String,
    minValue: { type: Number, required: true },
    maxValue: { type: Number, required: true },
    choices: [choiceSchema],
    active: { type: Boolean, default: true }
}, {
    timestamps: true
});
const Scale = mongoose.model('Scale', exports.scaleSchema);
exports.default = Scale;
//# sourceMappingURL=scale.model.js.map