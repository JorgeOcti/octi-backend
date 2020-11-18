"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const requestItemSchema = new mongoose.Schema({
    request: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Request'
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    origin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue'
    },
    destination: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue'
    },
    position: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue'
    },
    car: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car'
    },
    reason: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reason'
    },
    carrier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Carrier'
    },
    priority: {
        type: Boolean,
        default: false
    },
    observation: {
        type: String,
        default: ''
    },
    equipment: {
        type: Boolean,
        default: false
    },
    washed: {
        type: Boolean,
        default: false
    },
    review: {
        type: Boolean,
        default: false
    },
    body: {
        type: Boolean,
        default: false
    },
    status: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RequestItemStatus'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});
requestItemSchema.plugin(mongoosePaginate);
const RequestItem = mongoose.model('RequestItem', requestItemSchema);
exports.default = RequestItem;
//# sourceMappingURL=requestItem.model.js.map