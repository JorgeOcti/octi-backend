"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var stockSchema = new mongoose.Schema({
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
    }
}, {
    timestamps: true
});
stockSchema.virtual('cars', {
    ref: 'StockCar',
    localField: '_id',
    foreignField: 'stock',
    justOne: false
});
var Stock = mongoose.model('Stock', stockSchema);
exports["default"] = Stock;
//# sourceMappingURL=stock.model.js.map