"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.partSchema = void 0;
const mongoose = require("mongoose");
exports.partSchema = new mongoose.Schema({
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
const Part = mongoose.model('Part', exports.partSchema);
exports.default = Part;
//# sourceMappingURL=part.model.js.map