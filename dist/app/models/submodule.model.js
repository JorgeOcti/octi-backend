"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var submoduleSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true
    },
    module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module'
    }
}, {
    timestamps: true
});
submoduleSchema.virtual('permissions', {
    ref: 'Permission',
    localField: '_id',
    foreignField: 'submodule',
    justOne: false
});
submoduleSchema.plugin(mongoosePaginate);
var Submodule = mongoose.model('Submodule', submoduleSchema);
exports["default"] = Submodule;
//# sourceMappingURL=submodule.model.js.map