"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const companySchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    deleted: {
        type: Boolean,
        default: false
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
companySchema.plugin(mongoosePaginate);
companySchema.virtual('users', {
    ref: 'User',
    localField: '_id',
    foreignField: 'company',
    justOne: false
});
const Company = mongoose.model('Company', companySchema);
exports.default = Company;
//# sourceMappingURL=company.model.js.map