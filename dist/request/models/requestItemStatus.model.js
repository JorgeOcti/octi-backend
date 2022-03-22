"use strict";
exports.__esModule = true;
exports.requestItemStatusSchema = void 0;
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
exports.requestItemStatusSchema = new mongoose.Schema({
    name: {
        type: String
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    weigth: {
        type: Number,
        required: true
    },
    "default": {
        type: Boolean,
        "default": false
    }
}, {
    timestamps: true
});
exports.requestItemStatusSchema.statics.findOneOrCreate = function (condition, create) {
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
exports.requestItemStatusSchema.plugin(mongoosePaginate);
var RequestItemStatus = mongoose.model('RequestItemStatus', exports.requestItemStatusSchema);
exports["default"] = RequestItemStatus;
//# sourceMappingURL=requestItemStatus.model.js.map