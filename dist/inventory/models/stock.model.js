"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const stockSchema = new mongoose.Schema({
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
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
}, {
    timestamps: true
});
stockSchema.virtual('cars', {
    ref: 'StockCar',
    localField: '_id',
    foreignField: 'stock',
    justOne: false
});
const Stock = mongoose.model('Stock', stockSchema);
exports.default = Stock;
//# sourceMappingURL=stock.model.js.map