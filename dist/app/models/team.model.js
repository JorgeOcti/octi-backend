"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const teamSchema = new mongoose.Schema({
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
teamSchema.virtual('users', {
    ref: 'User',
    localField: '_id',
    foreignField: 'team',
    justOne: false
});
const Team = mongoose.model('Team', teamSchema);
exports.default = Team;
//# sourceMappingURL=team.model.js.map