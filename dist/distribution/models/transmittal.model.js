"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");
const transmittalSchema = new mongoose.Schema({
    name: {
        type: String
    },
    number: {
        type: Number
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    files: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TransmittalFile'
        }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
}, {
    timestamps: true
});
transmittalSchema.virtual('transporter', {
    ref: 'TransmittalTransporter',
    localField: '_id',
    foreignField: 'transmittal',
    justOne: true
});
transmittalSchema.virtual('items', {
    ref: 'TransmittalItem',
    localField: '_id',
    foreignField: 'transmittal',
    justOne: false
});
transmittalSchema.set('toObject', { virtuals: true });
transmittalSchema.set('toJSON', { virtuals: true });
transmittalSchema.plugin(mongoosePaginate);
transmittalSchema.plugin(mongooseAggregatePaginate);
const Transmittal = mongoose.model('Transmittal', transmittalSchema);
exports.default = Transmittal;
//# sourceMappingURL=transmittal.model.js.map