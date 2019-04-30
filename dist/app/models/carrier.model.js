"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const carrierSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }
}, {
    timestamps: true
});
carrierSchema.plugin(mongoosePaginate);
const Carrier = mongoose.model('Carrier', carrierSchema);
exports.default = Carrier;
//# sourceMappingURL=carrier.model.js.map