"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const inventory_model_1 = require("./inventory.model");
exports.inventoryLabelSchema = new mongoose.Schema({
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    name: {
        type: String,
        required: true
    },
    color: {
        type: String,
        default: '#C4C4C4'
    },
    affected: [{
            type: String,
            enum: inventory_model_1.choicesStatusCarInventory
        }],
    sendTo: {
        type: String,
        enum: inventory_model_1.choicesStatusCarInventory,
        required: true
    },
    isExhibition: {
        type: Boolean,
        default: false
    },
    requireCustomText: {
        type: Boolean,
        default: false
    },
    active: {
        type: Boolean,
        default: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});
mongoose.plugin(mongoosePaginate);
const InventoryLabel = mongoose.model('InventoryLabel', exports.inventoryLabelSchema);
exports.default = InventoryLabel;
//# sourceMappingURL=inventoryLabel.model.js.map