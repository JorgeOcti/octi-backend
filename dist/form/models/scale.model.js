"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const choiceSchema = new mongoose.Schema({
    choice: String,
    value: Number,
    requireImage: Boolean,
    requireText: Boolean,
    order: Number
});
// }, {_id: false});
exports.scaleSchema = new mongoose.Schema({
    name: String,
    minValue: Number,
    maxValue: Number,
    choices: [choiceSchema],
    active: Boolean
}, {
    timestamps: true
});
const Scale = mongoose.model('Scale', exports.scaleSchema);
exports.default = Scale;
//# sourceMappingURL=scale.model.js.map