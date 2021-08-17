"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var stockCarSchema = new mongoose.Schema({
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
var StockCar = mongoose.model('StockCar', stockCarSchema);
exports["default"] = StockCar;
//# sourceMappingURL=stockCar.model.js.map