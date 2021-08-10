"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var permisionSchema = new mongoose.Schema({
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
var Permission = mongoose.model('Permission', permisionSchema);
exports["default"] = Permission;
//# sourceMappingURL=permision.model.js.map