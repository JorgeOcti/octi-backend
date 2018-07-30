"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const alertSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    gte: {
        type: Number,
        default: 0
    },
    lte: {
        type: Number,
        default: 0
    },
    users: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
}, {
    timestamps: true
});
const Alert = mongoose.model('Alert', alertSchema);
exports.default = Alert;
//# sourceMappingURL=alert.model.js.map