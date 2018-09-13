"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
var ChoicesStatusCarInventory;
(function (ChoicesStatusCarInventory) {
    ChoicesStatusCarInventory["pending"] = "pending";
    ChoicesStatusCarInventory["found"] = "found";
    ChoicesStatusCarInventory["leftover"] = "leftover";
})(ChoicesStatusCarInventory = exports.ChoicesStatusCarInventory || (exports.ChoicesStatusCarInventory = {}));
exports.choicesStatusCarInventory = [
    ChoicesStatusCarInventory.pending,
    ChoicesStatusCarInventory.found,
    ChoicesStatusCarInventory.leftover
];
const inventoryCarSchema = new mongoose.Schema({
    car: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car'
    },
    venue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue'
    },
    venueFound: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue'
    },
    inventoriedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: exports.choicesStatusCarInventory,
        default: ChoicesStatusCarInventory.pending
    }
});
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
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    cars: [inventoryCarSchema],
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
const Inventory = mongoose.model('Inventory', inventorySchema);
exports.default = Inventory;
//# sourceMappingURL=inventory.model.js.map