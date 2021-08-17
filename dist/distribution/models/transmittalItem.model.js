"use strict";
exports.__esModule = true;
exports.choicesStatusTransmittalItem = exports.ChoicesStatusTransmittalItem = void 0;
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");
var ChoicesStatusTransmittalItem;
(function (ChoicesStatusTransmittalItem) {
    ChoicesStatusTransmittalItem["pending"] = "pending";
    ChoicesStatusTransmittalItem["completed"] = "completed";
})(ChoicesStatusTransmittalItem = exports.ChoicesStatusTransmittalItem || (exports.ChoicesStatusTransmittalItem = {}));
exports.choicesStatusTransmittalItem = [
    ChoicesStatusTransmittalItem.pending,
    ChoicesStatusTransmittalItem.completed,
];
var transmittalItemSchema = new mongoose.Schema({
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
    revisions: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Participant'
        }],
    loadingDate: {
        type: Date
    },
    arrivalDate: {
        type: Date
    },
    observation: {
        type: String
    },
    status: {
        type: String,
        "enum": exports.choicesStatusTransmittalItem,
        "default": ChoicesStatusTransmittalItem.pending
    }
}, {
    timestamps: true
});
transmittalItemSchema.plugin(mongoosePaginate);
transmittalItemSchema.plugin(mongooseAggregatePaginate);
var TransmittalItem = mongoose.model('TransmittalItem', transmittalItemSchema);
exports["default"] = TransmittalItem;
//# sourceMappingURL=transmittalItem.model.js.map