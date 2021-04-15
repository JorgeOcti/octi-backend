"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const salesChannelSchema = new mongoose.Schema({
    name: {
        type: String
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    fleet: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
const SalesChannel = mongoose.model('SalesChannel', salesChannelSchema);
exports.default = SalesChannel;
//# sourceMappingURL=salesChannel.model.js.map