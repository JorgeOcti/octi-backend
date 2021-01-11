"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const fileSchema = new mongoose.Schema({
    active: {
        type: Boolean
    },
    required: {
        type: Boolean
    }
});
const reasonSchema = new mongoose.Schema({
    name: {
        type: String
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    file: fileSchema
});
reasonSchema.plugin(mongoosePaginate);
const Reason = mongoose.model('Reason', reasonSchema);
exports.default = Reason;
//# sourceMappingURL=reason.model.js.map