"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
exports.damagesSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    parts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Part'
        }],
    kinds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Kind'
        }],
    positions: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Position'
        }]
}, {
    timestamps: true
});
exports.damagesSchema.plugin(mongoosePaginate);
const Damages = mongoose.model('Damages', exports.damagesSchema);
exports.default = Damages;
//# sourceMappingURL=damages.model.js.map