"use strict";
exports.__esModule = true;
exports.choicesStatusCarInventory = exports.ChoicesStatusCarInventory = void 0;
var mongoose = require("mongoose");
var invetoryCommentCars = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    comment: {
        type: String
    },
    createdAt: {
        type: Date,
        "default": new Date()
    }
});
var ChoicesStatusCarInventory;
(function (ChoicesStatusCarInventory) {
    ChoicesStatusCarInventory["pending"] = "pending";
    ChoicesStatusCarInventory["found"] = "found";
    ChoicesStatusCarInventory["missing"] = "missing";
    ChoicesStatusCarInventory["leftover"] = "leftover";
    ChoicesStatusCarInventory["reported"] = "reported";
    ChoicesStatusCarInventory["deleted"] = "deleted";
})(ChoicesStatusCarInventory = exports.ChoicesStatusCarInventory || (exports.ChoicesStatusCarInventory = {}));
exports.choicesStatusCarInventory = [
    ChoicesStatusCarInventory.pending,
    ChoicesStatusCarInventory.found,
    ChoicesStatusCarInventory.leftover,
    ChoicesStatusCarInventory.missing,
    ChoicesStatusCarInventory.reported
];
var inventoryCarSchema = new mongoose.Schema({
    inventory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory'
    },
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
    files: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'InventoryFile'
        }],
    comments: [invetoryCommentCars],
    label: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryLabel'
    },
    labelText: {
        type: String,
        "default": ''
    },
    labelBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    customizedStatusText: {
        type: String,
        "default": ''
    },
    status: {
        type: String,
        "enum": exports.choicesStatusCarInventory,
        "default": ChoicesStatusCarInventory.pending
    }
}, {
    timestamps: true
});
inventoryCarSchema.index({ inventory: 1 });
inventoryCarSchema.index({ inventory: 1, car: 1 });
inventoryCarSchema.index({ venue: 1, venueFound: 1, createdAt: 1 });
var InventoryCar = mongoose.model('InventoryCar', inventoryCarSchema);
exports["default"] = InventoryCar;
//# sourceMappingURL=inventoryCar.model.js.map