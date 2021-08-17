"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var alertSchema = new mongoose.Schema({
    name: {
        type: String
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    gte: {
        type: Number,
        "default": 0
    },
    lte: {
        type: Number,
        "default": 0
    },
    users: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
}, {
    timestamps: true
});
var Alert = mongoose.model('Alert', alertSchema);
exports["default"] = Alert;
//# sourceMappingURL=alert.model.js.map