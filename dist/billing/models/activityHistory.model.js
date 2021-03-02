"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.choicesTypeActivity = exports.ChoicesTypeActivity = void 0;
const bson_1 = require("bson");
const mongoose = require("mongoose");
const detailInventorySchema = new mongoose.Schema({
    name: {
        type: String
    }
});
const detailFormSchema = new mongoose.Schema({
    name: {
        type: String
    }
});
const detailCarSchema = new mongoose.Schema({
    vin: {
        type: String
    }
});
const responseCarSchema = new mongoose.Schema({
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
const activityHistorySchema = new mongoose.Schema({
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
        enum: exports.choicesTypeActivity
    },
    inventory: {
        type: detailInventorySchema,
        default: {}
    },
    form: {
        type: detailFormSchema,
        default: {}
    },
    car: {
        type: detailCarSchema,
        default: {}
    },
    request: {
        type: responseCarSchema,
        default: {}
    }
}, {
    timestamps: true
});
const ActivityHistory = mongoose.model('ActivityHistory', activityHistorySchema);
exports.default = ActivityHistory;
//# sourceMappingURL=activityHistory.model.js.map