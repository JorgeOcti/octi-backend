"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'La empresa es requerida'],
        index: true
    },
    permissions: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Permission'
        }],
    forms: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Form'
        }]
}, {
    timestamps: true
});
const Group = mongoose.model('Group', groupSchema);
exports.default = Group;
//# sourceMappingURL=group.model.js.map