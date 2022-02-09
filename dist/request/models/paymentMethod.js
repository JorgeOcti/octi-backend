"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var paymentMethodSchema = new mongoose.Schema({
    name: {
        type: String
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }
}, {
    timestamps: true
});
var PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);
exports["default"] = PaymentMethod;
//# sourceMappingURL=paymentMethod.js.map