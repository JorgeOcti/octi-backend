"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var carSchema = new mongoose.Schema({
    vin: {
        type: String,
        trim: true,
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    lastForm: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Participant',
        default: null
    }
}, {
    timestamps: true
});
carSchema.statics.findOneOrCreate = function (condition, create) {
    var model = this;
    return new Promise(function (resolve, reject) {
        model.findOne(condition, function (err, result) {
            if (err)
                return reject(err);
            if (result)
                return resolve(result);
            model.create(create, function (err, result) {
                if (err)
                    return reject(err);
                return resolve(result);
            });
        });
    });
};
carSchema.plugin(mongoosePaginate);
var Car = mongoose.model('Car', carSchema);
exports.default = Car;
//# sourceMappingURL=car.model.js.map