"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");
var milestoneTypeSchema = new mongoose.Schema({
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    name: {
        type: String
    }
}, {
    timestamps: true
});
milestoneTypeSchema.statics.findOneOrCreate = function (condition, create) {
    var model = this;
    return new Promise(function (resolve, reject) {
        model.findOne(condition, function (err, result) {
            if (err) {
                return reject(err);
            }
            if (result) {
                return resolve(result);
            }
            model.create(create, function (err, result) {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    });
};
milestoneTypeSchema.plugin(mongoosePaginate);
milestoneTypeSchema.plugin(mongooseAggregatePaginate);
var MilestoneType = mongoose.model('MilestoneType', milestoneTypeSchema);
exports["default"] = MilestoneType;
//# sourceMappingURL=mIlestoneType.model.js.map