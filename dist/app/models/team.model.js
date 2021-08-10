"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var teamSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    formsNumber: {
        type: Number,
        "default": 0
    },
    requestNumber: {
        type: Number,
        "default": 0
    },
    transmittalNumber: {
        type: Number,
        "default": 0
    },
    active: {
        type: Boolean,
        "default": true
    }
}, {
    timestamps: true
});
teamSchema.virtual('companies', {
    ref: 'Company',
    localField: '_id',
    foreignField: 'team',
    justOne: false
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
var Team = mongoose.model('Team', teamSchema);
exports["default"] = Team;
//# sourceMappingURL=team.model.js.map