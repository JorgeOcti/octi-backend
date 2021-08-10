"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var carrierSchema = new mongoose.Schema({
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
var Carrier = mongoose.model('Carrier', carrierSchema);
exports["default"] = Carrier;
//# sourceMappingURL=carrier.model.js.map