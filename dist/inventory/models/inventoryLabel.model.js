"use strict";
exports.__esModule = true;
exports.inventoryLabelSchema = void 0;
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var inventoryCar_model_1 = require("./inventoryCar.model");
exports.inventoryLabelSchema = new mongoose.Schema({
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        "default": ""
    },
    color: {
        type: String,
        "default": '#C4C4C4'
    },
    affected: [{
            type: String,
            "enum": inventoryCar_model_1.choicesStatusCarInventory
        }],
    sendTo: {
        type: String,
        "enum": inventoryCar_model_1.choicesStatusCarInventory,
        required: true
    },
    isExhibition: {
        type: Boolean,
        "default": false
    },
    requireCustomText: {
        type: Boolean,
        "default": false
    },
    active: {
        type: Boolean,
        "default": true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});
mongoose.plugin(mongoosePaginate);
exports.inventoryLabelSchema.index({ active: 1, team: 1 });
var InventoryLabel = mongoose.model('InventoryLabel', exports.inventoryLabelSchema);
exports["default"] = InventoryLabel;
//# sourceMappingURL=inventoryLabel.model.js.map