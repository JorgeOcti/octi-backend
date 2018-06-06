"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const branshOfficeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        index: true
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
const BranshOffice = mongoose.model('BranshOffice', branshOfficeSchema);
exports.default = BranshOffice;
//# sourceMappingURL=branchOffice.model.js.map