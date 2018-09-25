"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
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
permisionSchema.plugin(mongoosePaginate);
const Permission = mongoose.model('Permission', permisionSchema);
exports.default = Permission;
//# sourceMappingURL=permision.model.js.map