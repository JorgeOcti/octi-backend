"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kindSchema = void 0;
const mongoose = require("mongoose");
exports.kindSchema = new mongoose.Schema({
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
const Kind = mongoose.model('Kind', exports.kindSchema);
exports.default = Kind;
//# sourceMappingURL=kind.model.js.map