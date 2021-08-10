"use strict";
exports.__esModule = true;
exports.damagesSchema = void 0;
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
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
        }],
    partFallback: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Part'
    },
    kindFallback: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Kind'
    }
}, {
    timestamps: true
});
exports.damagesSchema.plugin(mongoosePaginate);
var Damages = mongoose.model('Damages', exports.damagesSchema);
exports["default"] = Damages;
//# sourceMappingURL=damages.model.js.map