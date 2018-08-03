"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const permisionSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true
    },
    codeName: {
        type: String,
        unique: true
    }
}, {
    timestamps: true
});
const Permission = mongoose.model('Permission', permisionSchema);
exports.default = Permission;
//# sourceMappingURL=permision.model.js.map