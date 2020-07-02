"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.choicesStatusCarInventory = exports.ChoicesTypeVenue = void 0;
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const venueDay_model_1 = require("./venueDay.model");
var ChoicesTypeVenue;
(function (ChoicesTypeVenue) {
    ChoicesTypeVenue["distributor"] = "distributor";
    ChoicesTypeVenue["receiver"] = "receiver";
})(ChoicesTypeVenue = exports.ChoicesTypeVenue || (exports.ChoicesTypeVenue = {}));
exports.choicesStatusCarInventory = [
    ChoicesTypeVenue.distributor,
    ChoicesTypeVenue.receiver
];
const venueSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    abbreviation: {
        type: String,
    },
    lat: {
        type: Number,
        default: 0
    },
    lng: {
        type: Number,
        default: 0
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    region: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Region'
    },
    shippingMaxDays: {
        type: Number,
        default: 5
    },
    type: {
        type: String,
        enum: exports.choicesStatusCarInventory,
        default: ChoicesTypeVenue.receiver
    },
    sendToDays: {
        type: [venueDay_model_1.venueDaySchema]
    },
    sendTo: {
        type: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Venue'
            }],
        default: []
    },
    receiveFrom: {
        type: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Venue'
            }],
        default: []
    },
    receptionCarriers: {
        type: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Carrier'
            }],
        default: []
    },
    shippingCarriers: {
        type: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Carrier'
            }],
        default: []
    },
    deleted: {
        type: Boolean,
        default: false
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
mongoose.plugin(mongoosePaginate);
venueSchema.virtual('users', {
    ref: 'User',
    localField: '_id',
    foreignField: 'venue',
    justOne: false
});
venueSchema.virtual('participants', {
    ref: 'Participant',
    localField: '_id',
    foreignField: 'venue',
    justOne: false
});
const Venue = mongoose.model('Venue', venueSchema);
exports.default = Venue;
//# sourceMappingURL=venue.model.js.map