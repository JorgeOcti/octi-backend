"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const invetoryCommentCars = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    comment: {
        type: String
    },
    createdAt: {
        type: Date,
        default: new Date()
    }
});
var ChoicesStatusCarInventory;
(function (ChoicesStatusCarInventory) {
    ChoicesStatusCarInventory["pending"] = "pending";
    ChoicesStatusCarInventory["found"] = "found";
    ChoicesStatusCarInventory["missing"] = "missing";
    ChoicesStatusCarInventory["leftover"] = "leftover";
    ChoicesStatusCarInventory["reported"] = "reported";
})(ChoicesStatusCarInventory = exports.ChoicesStatusCarInventory || (exports.ChoicesStatusCarInventory = {}));
exports.choicesStatusCarInventory = [
    ChoicesStatusCarInventory.pending,
    ChoicesStatusCarInventory.found,
    ChoicesStatusCarInventory.leftover,
    ChoicesStatusCarInventory.missing,
    ChoicesStatusCarInventory.reported
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
    images: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'InventoryFile'
        }],
    comments: [invetoryCommentCars],
    label: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryLabel'
    },
    customizedStatusText: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: exports.choicesStatusCarInventory,
        default: ChoicesStatusCarInventory.pending
    }
}, {
    timestamps: true
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