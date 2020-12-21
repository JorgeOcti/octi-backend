"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const requestSchema = new mongoose.Schema({
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
    fleet: {
        type: Boolean,
        default: false
    },
    // status: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'RequestStatus'
    // },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
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
const Request = mongoose.model('Request', requestSchema);
exports.default = Request;
//# sourceMappingURL=request.model.js.map