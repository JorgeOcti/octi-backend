"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var versionSchema = new mongoose.Schema({
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
var Version = mongoose.model('Version', versionSchema);
exports["default"] = Version;
//# sourceMappingURL=version.model.js.map