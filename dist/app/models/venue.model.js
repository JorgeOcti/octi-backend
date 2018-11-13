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
// venueSchema.virtual('inventories', {
//   ref: 'Inventory', // The model to use
//   localField: '_id', // Find field in this model
//   foreignField: 'cars.venue', // is equal to field in another model
//   justOne: false
// });
const Venue = mongoose.model('Venue', venueSchema);
exports.default = Venue;
//# sourceMappingURL=venue.model.js.map