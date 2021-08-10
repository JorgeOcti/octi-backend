"use strict";
exports.__esModule = true;
exports.venueDaySchema = void 0;
var mongoose = require("mongoose");
exports.venueDaySchema = new mongoose.Schema({
    venue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue'
    },
    shippingMaxDays: {
        type: Number,
        "default": 5
    }
}, {
    timestamps: true
});
var VenueDay = mongoose.model('VenueDay', exports.venueDaySchema);
exports["default"] = VenueDay;
//# sourceMappingURL=venueDay.model.js.map