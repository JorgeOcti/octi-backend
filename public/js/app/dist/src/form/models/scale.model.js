"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose = require("mongoose");
var choiceSchema = new mongoose.Schema({
    choice: { type: String, required: true, trim: true },
    value: { type: Number, required: true },
    backgroundColor: {
        type: String,
        enum: ['red', 'green', 'yellow', 'blue'],
        default: 'blue'
    },
    requireImage: { type: Boolean, default: false },
    requireComment: { type: Boolean, default: false },
    na: { type: Boolean, default: false },
    order: { type: Number, required: true }
});
exports.scaleSchema = new mongoose.Schema({
    name: String,
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        require: true
    },
    minValue: {
        type: Number,
        required: true
    },
    maxValue: {
        type: Number,
        required: true
    },
    choices: [choiceSchema],
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
var Scale = mongoose.model('Scale', exports.scaleSchema);
exports.default = Scale;
//# sourceMappingURL=scale.model.js.map