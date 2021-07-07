"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const transmittalTransporterSchema = new mongoose.Schema({
    transmittal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transmittal'
    },
    carrier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Carrier'
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    patent: {
        type: String,
    },
}, {
    timestamps: true
});
transmittalTransporterSchema.plugin(mongoosePaginate);
const TransmittalTransporter = mongoose.model('TransmittalTransporter', transmittalTransporterSchema);
exports.default = TransmittalTransporter;
//# sourceMappingURL=transmittalTransporter.model.js.map