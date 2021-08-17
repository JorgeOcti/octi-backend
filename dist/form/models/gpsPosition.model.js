"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var gpsPositionSchema = new mongoose.Schema({
    lat: {
        type: Number
    },
    lng: {
        type: Number
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    venue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue'
    },
    os: {
        type: String
    },
    accuracy: {
        type: Number
    },
    provider: {
        type: String
    }
}, {
    timestamps: true
});
gpsPositionSchema.plugin(mongoosePaginate);
var GPSPosition = mongoose.model('GPSPosition', gpsPositionSchema);
exports["default"] = GPSPosition;
//# sourceMappingURL=gpsPosition.model.js.map