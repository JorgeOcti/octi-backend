"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var moduleSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true
    }
}, {
    timestamps: true
});
moduleSchema.virtual('submodules', {
    ref: 'Submodule',
    localField: '_id',
    foreignField: 'module',
    justOne: false
});
moduleSchema.plugin(mongoosePaginate);
var Module = mongoose.model('Module', moduleSchema);
exports["default"] = Module;
//# sourceMappingURL=module.model.js.map