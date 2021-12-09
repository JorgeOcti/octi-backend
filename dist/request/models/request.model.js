"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var requestSchema = new mongoose.Schema({
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    number: {
        type: Number
    },
    origin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue'
    },
    destination: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue'
    },
    loadingDate: {
        type: Date
    },
    arrivalDate: {
        type: Date
    },
    sellerText: {
        type: String
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalesChannel'
    },
    operationType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OperationType'
    },
    fleet: {
        type: Boolean,
        "default": false
    },
    // status: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'RequestStatus'
    // },
    deliveryVenue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue'
    },
    deliveryAddress: {
        type: String
    },
    deliveryDate: {
        type: Date
    },
    conectaID: {
        type: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        "default": null
    }
}, {
    timestamps: true
});
requestSchema.virtual('items', {
    ref: 'RequestItem',
    localField: '_id',
    foreignField: 'request',
    justOne: false
});
requestSchema.set('toObject', { virtuals: true });
requestSchema.set('toJSON', { virtuals: true });
requestSchema.plugin(mongoosePaginate);
var Request = mongoose.model('Request', requestSchema);
exports["default"] = Request;
//# sourceMappingURL=request.model.js.map