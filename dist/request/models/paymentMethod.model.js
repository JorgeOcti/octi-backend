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
var PaymentMethodModel = mongoose.model('PaymentMethod', paymentMethodSchema);
exports["default"] = PaymentMethodModel;
//# sourceMappingURL=paymentMethod.model.js.map