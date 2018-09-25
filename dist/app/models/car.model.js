"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const carSchema = new mongoose.Schema({
    vin: {
        type: String,
        trim: true
    },
    vin2: {
        type: String,
        trim: true
    },
    internalNumber: {
        type: Number
    },
    patent: {
        type: String
    },
    destination: {
        type: String,
        trim: true
    },
    brand: {
        type: String,
        trim: true
    },
    denomination: {
        type: String,
        trim: true
    },
    color: {
        type: String,
        trim: true
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
carSchema.index({ vin: 1 }, { unique: true });
carSchema.index({ company: 1, vin: 1 }, { unique: true });
// carSchema.index({
//   vin: 'text',
//   brand: 'text',
//   denomination: 'text',
//   color: 'text'
// }, {
//   weights: {
//     vin: 9,
//     brand: 10,
//     denomination: 1,
//     color: 1
//   }
// });
carSchema.virtual('participants', {
    ref: 'Participant',
    localField: '_id',
    foreignField: 'car',
    justOne: false
});
carSchema.statics.findOneOrCreate = function (condition, create) {
    const model = this;
    return new Promise((resolve, reject) => {
        model.findOne(condition, (err, result) => {
            if (err) {
                return reject(err);
            }
            if (result) {
                return resolve(result);
            }
            model.create(create, (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    });
};
carSchema.plugin(mongoosePaginate);
const Car = mongoose.model('Car', carSchema);
exports.default = Car;
//# sourceMappingURL=car.model.js.map