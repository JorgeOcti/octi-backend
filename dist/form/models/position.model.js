"use strict";
exports.__esModule = true;
exports.positionSchema = void 0;
var mongoose = require("mongoose");
exports.positionSchema = new mongoose.Schema({
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    name: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});
var Position = mongoose.model('Position', exports.positionSchema);
exports["default"] = Position;
//# sourceMappingURL=position.model.js.map