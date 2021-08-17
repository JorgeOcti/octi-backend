"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var requestStatusSchema = new mongoose.Schema({
    name: {
        type: String
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    "default": {
        type: Boolean,
        "default": false
    }
}, {
    timestamps: true
});
requestStatusSchema.statics.findOneOrCreate = function (condition, create) {
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
var RequestStatus = mongoose.model('RequestStatus', requestStatusSchema);
exports["default"] = RequestStatus;
//# sourceMappingURL=requestStatus.model.js.map