"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");
const transmittalItemSchema = new mongoose.Schema({
    transmittal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transmittal'
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    request: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Request'
    },
    requestItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RequestItem'
    },
    origin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue'
    },
    destination: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue'
    },
    car: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car'
    },
    loadingDate: {
        type: Date
    },
    arrivalDate: {
        type: Date
    },
}, {
    timestamps: true
});
transmittalItemSchema.plugin(mongoosePaginate);
transmittalItemSchema.plugin(mongooseAggregatePaginate);
const TransmittalItem = mongoose.model('TransmittalItem', transmittalItemSchema);
exports.default = TransmittalItem;
//# sourceMappingURL=transmittalItem.model.js.map