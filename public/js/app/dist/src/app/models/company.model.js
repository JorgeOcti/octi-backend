"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose = require("mongoose");
var companySchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
var Company = mongoose.model('Company', companySchema);
exports.default = Company;
//# sourceMappingURL=company.model.js.map