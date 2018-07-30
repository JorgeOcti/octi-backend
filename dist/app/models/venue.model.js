"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const venueSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
mongoose.plugin(mongoosePaginate);
const Venue = mongoose.model('Venue', venueSchema);
exports.default = Venue;
//# sourceMappingURL=venue.model.js.map