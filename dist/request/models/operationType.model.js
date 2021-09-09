"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var operationTypeSchema = new mongoose.Schema({
    name: {
        type: String
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }
}, {
    timestamps: true
});
operationTypeSchema.set('toObject', { virtuals: true });
operationTypeSchema.set('toJSON', { virtuals: true });
operationTypeSchema.statics.findOneOrCreate = function (condition, create) {
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
operationTypeSchema.plugin(mongoosePaginate);
var OperationType = mongoose.model('OperationType', operationTypeSchema);
exports["default"] = OperationType;
//# sourceMappingURL=operationType.model.js.map