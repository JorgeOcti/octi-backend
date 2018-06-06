"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
const Company = mongoose.model('Company', companySchema);
exports.default = Company;
//# sourceMappingURL=company.model.js.map