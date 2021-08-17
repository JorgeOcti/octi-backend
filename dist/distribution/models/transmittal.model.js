"use strict";
exports.__esModule = true;
exports.choicesStatusTransmittal = exports.ChoicesStatusTransmittal = void 0;
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");
var ChoicesStatusTransmittal;
(function (ChoicesStatusTransmittal) {
    ChoicesStatusTransmittal["pending"] = "pending";
    ChoicesStatusTransmittal["inTransit"] = "inTransit";
    ChoicesStatusTransmittal["damaged"] = "damaged";
    ChoicesStatusTransmittal["completed"] = "completed";
})(ChoicesStatusTransmittal = exports.ChoicesStatusTransmittal || (exports.ChoicesStatusTransmittal = {}));
exports.choicesStatusTransmittal = [
    ChoicesStatusTransmittal.pending,
    ChoicesStatusTransmittal.inTransit,
    ChoicesStatusTransmittal.damaged,
    ChoicesStatusTransmittal.completed,
];
var transmittalTransporterSchema = new mongoose.Schema({
    carrier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Carrier'
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    patent: {
        type: String
    }
}, {
    timestamps: true
});
var transmittalSchema = new mongoose.Schema({
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
    evidenceFullLoad: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TransmittalFile'
        }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    transporter: {
        type: transmittalTransporterSchema
    },
    observation: {
        type: String
    },
    status: {
        type: String,
        "enum": exports.choicesStatusTransmittal,
        "default": ChoicesStatusTransmittal.pending
    }
}, {
    timestamps: true
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
var Transmittal = mongoose.model('Transmittal', transmittalSchema);
exports["default"] = Transmittal;
//# sourceMappingURL=transmittal.model.js.map