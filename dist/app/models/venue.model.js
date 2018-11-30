"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
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
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    type: {
        type: String,
        enum: exports.choicesStatusCarInventory,
        default: ChoicesTypeVenue.receiver
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