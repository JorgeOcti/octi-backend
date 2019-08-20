"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const gpsPositionSchema = new mongoose.Schema({
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
    },
}, {
    timestamps: true
});
gpsPositionSchema.plugin(mongoosePaginate);
const GPSPosition = mongoose.model('GPSPosition', gpsPositionSchema);
exports.default = GPSPosition;
//# sourceMappingURL=gpsPosition.model.js.map