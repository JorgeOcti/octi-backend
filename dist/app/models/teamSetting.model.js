"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var inventorySettingSchema = new mongoose.Schema({
    pending: {
        type: String
    },
    pendingClass: {
        type: String
    },
    pendingColor: {
        type: String
    },
    found: {
        type: String
    },
    foundClass: {
        type: String
    },
    foundColor: {
        type: String
    },
    missing: {
        type: String
    },
    missingClass: {
        type: String
    },
    missingColor: {
        type: String
    },
    leftover: {
        type: String
    },
    leftoverClass: {
        type: String
    },
    leftoverColor: {
        type: String
    },
    leftoverDifferentVenue: {
        type: Boolean,
        "default": false
    },
    reported: {
        type: String
    },
    reportedClass: {
        type: String
    },
    reportedColor: {
        type: String
    }
});
var teamSettingSchema = new mongoose.Schema({
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    inventory: inventorySettingSchema
}, {
    timestamps: true
});
var TeamSetting = mongoose.model('TeamSetting', teamSettingSchema);
exports["default"] = TeamSetting;
//# sourceMappingURL=teamSetting.model.js.map