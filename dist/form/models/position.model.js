"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
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
const Position = mongoose.model('Position', exports.positionSchema);
exports.default = Position;
//# sourceMappingURL=position.model.js.map