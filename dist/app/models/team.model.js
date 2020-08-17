"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    formsNumber: {
        type: Number,
        default: 0
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
teamSchema.virtual('settings', {
    ref: 'TeamSetting',
    localField: '_id',
    foreignField: 'team',
    justOne: true
});
teamSchema.virtual('histories', {
    ref: 'ActivityHistory',
    localField: '_id',
    foreignField: 'team',
    justOne: true
});
teamSchema.plugin(mongoosePaginate);
const Team = mongoose.model('Team', teamSchema);
exports.default = Team;
//# sourceMappingURL=team.model.js.map