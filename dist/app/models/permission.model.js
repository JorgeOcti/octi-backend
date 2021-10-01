"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var permissionSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true
    },
    codeName: {
        type: String,
        unique: true
    },
    submodule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Submodule'
    }
}, {
    timestamps: true
});
permissionSchema.plugin(mongoosePaginate);
var Permission = mongoose.model('Permission', permissionSchema);
exports["default"] = Permission;
//# sourceMappingURL=permission.model.js.map