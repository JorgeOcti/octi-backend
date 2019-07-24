"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const versionSchema = new mongoose.Schema({
    name: {
        type: String
    },
    description: {
        type: String
    },
    android: {
        type: String
    },
    ios: {
        type: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
}, {
    timestamps: true
});
const Version = mongoose.model('Version', versionSchema);
exports.default = Version;
//# sourceMappingURL=version.model.js.map