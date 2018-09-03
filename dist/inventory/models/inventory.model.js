"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
exports.choiceStatusInventory = ['pending', 'in_process', 'finalized'];
const inventorySchema = new mongoose.Schema({
    name: {
        type: String
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    cars: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Car'
        }],
    carsFound: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Car'
        }],
    status: {
        type: String,
        enum: exports.choiceStatusInventory,
        default: 'pending'
    }
}, {
    timestamps: true
});
const Inventory = mongoose.model('Inventory', inventorySchema);
exports.default = Inventory;
//# sourceMappingURL=inventory.model.js.map