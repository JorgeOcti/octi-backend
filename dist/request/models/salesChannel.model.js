"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var salesChannelSchema = new mongoose.Schema({
    name: {
        type: String
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    fleet: {
        type: Boolean,
        "default": false
    }
}, {
    timestamps: true
});
var SalesChannel = mongoose.model('SalesChannel', salesChannelSchema);
exports["default"] = SalesChannel;
//# sourceMappingURL=salesChannel.model.js.map