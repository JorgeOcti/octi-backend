"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const transmittalItemSchema = new mongoose.Schema({
    name: {
        type: String
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    transmittal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transmittal'
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
    invoice: {
        type: String
    },
    entry: {
        type: String
    },
}, {
    timestamps: true
});
transmittalItemSchema.plugin(mongoosePaginate);
const TransmittalItem = mongoose.model('TransmittalItem', transmittalItemSchema);
exports.default = TransmittalItem;
//# sourceMappingURL=transmittalItem.model.js.map