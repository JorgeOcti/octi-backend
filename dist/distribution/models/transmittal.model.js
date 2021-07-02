"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const transmittalSchema = new mongoose.Schema({
    name: {
        type: String
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    carrier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Carrier'
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
}, {
    timestamps: true
});
transmittalSchema.plugin(mongoosePaginate);
const Transmittal = mongoose.model('Transmittal', transmittalSchema);
exports.default = Transmittal;
//# sourceMappingURL=transmittal.model.js.map