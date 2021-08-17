"use strict";
exports.__esModule = true;
exports.scaleSchema = exports.choiceBackgroundColors = void 0;
var mongoose = require("mongoose");
exports.choiceBackgroundColors = ['red', 'green', 'yellow', 'blue'];
var choiceSchema = new mongoose.Schema({
    choice: { type: String, required: true, trim: true },
    value: { type: Number, required: true },
    backgroundColor: {
        type: String,
        "enum": exports.choiceBackgroundColors,
        "default": 'blue'
    },
    requireImage: { type: Boolean, "default": false },
    requireComment: { type: Boolean, "default": false },
    requireAccesories: { type: Boolean, "default": false },
    requireConciliation: { type: Boolean, "default": false },
    na: { type: Boolean, "default": false },
    order: { type: Number, required: true }
});
exports.scaleSchema = new mongoose.Schema({
    name: String,
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        require: true
    },
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
        "default": true
    }
}, {
    timestamps: true
});
var Scale = mongoose.model('Scale', exports.scaleSchema);
exports["default"] = Scale;
//# sourceMappingURL=scale.model.js.map