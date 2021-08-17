"use strict";
exports.__esModule = true;
exports.kindSchema = void 0;
var mongoose = require("mongoose");
exports.kindSchema = new mongoose.Schema({
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    name: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});
var Kind = mongoose.model('Kind', exports.kindSchema);
exports["default"] = Kind;
//# sourceMappingURL=kind.model.js.map