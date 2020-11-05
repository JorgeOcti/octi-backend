"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.venueDaySchema = void 0;
const mongoose = require("mongoose");
exports.venueDaySchema = new mongoose.Schema({
    venue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue'
    },
    shippingMaxDays: {
        type: Number,
        default: 5
    }
}, {
    timestamps: true
});
const VenueDay = mongoose.model('VenueDay', exports.venueDaySchema);
exports.default = VenueDay;
//# sourceMappingURL=venueDay.model.js.map