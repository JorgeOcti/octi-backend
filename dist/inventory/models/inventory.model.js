"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
var ChoicesStatusInventory;
(function (ChoicesStatusInventory) {
    ChoicesStatusInventory["pending"] = "pending";
    ChoicesStatusInventory["inProcess"] = "inProcess";
    ChoicesStatusInventory["finalized"] = "finalized";
})(ChoicesStatusInventory = exports.ChoicesStatusInventory || (exports.ChoicesStatusInventory = {}));
exports.choicesStatusInventory = [
    ChoicesStatusInventory.pending,
    ChoicesStatusInventory.inProcess,
    ChoicesStatusInventory.finalized
];
const inventorySchema = new mongoose.Schema({
    name: {
        type: String
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    venues: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Venue'
        }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    finalizedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    finalizedAt: {
        type: Date
    },
    status: {
        type: String,
        enum: exports.choicesStatusInventory,
        default: ChoicesStatusInventory.pending
    }
}, {
    timestamps: true
});
inventorySchema.virtual('cars', {
    ref: 'InventoryCar',
    localField: '_id',
    foreignField: 'inventory',
    justOne: false
});
inventorySchema.index({ team: 1 });
inventorySchema.index({ team: 1, status: 1, venues: 1 });
const Inventory = mongoose.model('Inventory', inventorySchema);
exports.default = Inventory;
//# sourceMappingURL=inventory.model.js.map