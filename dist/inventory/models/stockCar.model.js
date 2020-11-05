"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const stockCarSchema = new mongoose.Schema({
    car: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car'
    },
    stock: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stock'
    },
    venue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue'
    }
}, {
    timestamps: true
});
const StockCar = mongoose.model('StockCar', stockCarSchema);
exports.default = StockCar;
//# sourceMappingURL=stockCar.model.js.map