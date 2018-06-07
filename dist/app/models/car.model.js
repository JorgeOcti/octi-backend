"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const carSchema = new mongoose.Schema({
    vin: {
        type: String,
        trim: true,
        required: true
    }
}, {
    timestamps: true
});
carSchema.statics.findOneOrCreate = function (condition, create) {
    const model = this;
    return new Promise((resolve, reject) => {
        model.findOne(condition, (err, result) => {
            if (err)
                return reject(err);
            if (result)
                return resolve(result);
            model.create(create, (err, result) => {
                if (err)
                    return reject(err);
                return resolve(result);
            });
        });
    });
};
const Car = mongoose.model('Car', carSchema);
exports.default = Car;
//# sourceMappingURL=car.model.js.map