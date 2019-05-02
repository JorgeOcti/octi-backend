"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const regionSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }
}, {
    timestamps: true
});
regionSchema.plugin(mongoosePaginate);
const Region = mongoose.model('Region', regionSchema);
exports.default = Region;
//# sourceMappingURL=region.model.js.map