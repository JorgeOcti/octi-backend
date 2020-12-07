"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
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
    }
}, {
    timestamps: true
});
versionSchema.plugin(mongoosePaginate);
const Version = mongoose.model('Version', versionSchema);
exports.default = Version;
//# sourceMappingURL=version.model.js.map