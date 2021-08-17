"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var regionSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    code: {
        type: String,
        trim: true,
        "default": ''
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }
}, {
    timestamps: true
});
regionSchema.plugin(mongoosePaginate);
var Region = mongoose.model('Region', regionSchema);
exports["default"] = Region;
//# sourceMappingURL=region.model.js.map