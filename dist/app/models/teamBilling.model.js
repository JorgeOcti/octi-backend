"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const teamBillingSchema = new mongoose.Schema({
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    checklistPrice: {
        type: Number,
        default: 0
    },
    inventoryPrice: {
        type: Number,
        default: 0
    },
    active: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
const TeamBilling = mongoose.model('TeamBilling', teamBillingSchema);
exports.default = TeamBilling;
//# sourceMappingURL=teamBilling.model.js.map