"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const requestItemStatusSchema = new mongoose.Schema({
    name: {
        type: String
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    default: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
requestItemStatusSchema.statics.findOneOrCreate = function (condition, create) {
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
const RequestItemStatus = mongoose.model('RequestItemStatus', requestItemStatusSchema);
exports.default = RequestStatus;
//# sourceMappingURL=requestItemStatus.js.map