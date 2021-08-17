"use strict";
exports.__esModule = true;
exports.choicesTypeActivity = exports.ChoicesTypeActivity = void 0;
var bson_1 = require("bson");
var mongoose = require("mongoose");
var detailInventorySchema = new mongoose.Schema({
    name: {
        type: String
    }
});
var detailFormSchema = new mongoose.Schema({
    name: {
        type: String
    }
});
var detailCarSchema = new mongoose.Schema({
    vin: {
        type: String
    }
});
var responseCarSchema = new mongoose.Schema({
    item: {
        type: bson_1.ObjectId
    },
    number: {
        type: Number
    }
});
var ChoicesTypeActivity;
(function (ChoicesTypeActivity) {
    ChoicesTypeActivity["inventory"] = "inventory";
    ChoicesTypeActivity["checklist"] = "checklist";
    ChoicesTypeActivity["request"] = "request";
})(ChoicesTypeActivity = exports.ChoicesTypeActivity || (exports.ChoicesTypeActivity = {}));
exports.choicesTypeActivity = [
    ChoicesTypeActivity.inventory,
    ChoicesTypeActivity.checklist,
    ChoicesTypeActivity.request
];
var activityHistorySchema = new mongoose.Schema({
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        "enum": exports.choicesTypeActivity
    },
    inventory: {
        type: detailInventorySchema,
        "default": {}
    },
    form: {
        type: detailFormSchema,
        "default": {}
    },
    car: {
        type: detailCarSchema,
        "default": {}
    },
    request: {
        type: responseCarSchema,
        "default": {}
    }
}, {
    timestamps: true
});
var ActivityHistory = mongoose.model('ActivityHistory', activityHistorySchema);
exports["default"] = ActivityHistory;
//# sourceMappingURL=activityHistory.model.js.map