"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.choicesTypeQuestuion = exports.ChoicesTypeQuestuion = void 0;
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const fileSchema = new mongoose.Schema({
    active: {
        type: Boolean
    },
    required: {
        type: Boolean
    }
});
var ChoicesTypeQuestuion;
(function (ChoicesTypeQuestuion) {
    ChoicesTypeQuestuion["text"] = "text";
    ChoicesTypeQuestuion["number"] = "number";
    ChoicesTypeQuestuion["paymentMethod"] = "paymentMethod";
})(ChoicesTypeQuestuion = exports.ChoicesTypeQuestuion || (exports.ChoicesTypeQuestuion = {}));
exports.choicesTypeQuestuion = [
    ChoicesTypeQuestuion.text,
    ChoicesTypeQuestuion.number,
    ChoicesTypeQuestuion.paymentMethod
];
const questionSchema = new mongoose.Schema({
    name: {
        type: String
    },
    type: {
        type: String,
        enum: exports.choicesTypeQuestuion,
        default: ChoicesTypeQuestuion.text
    },
    required: {
        type: Boolean,
        default: false
    }
});
const reasonSchema = new mongoose.Schema({
    name: {
        type: String
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    file: {
        type: fileSchema,
        default: {
            active: false,
            required: false
        }
    },
    questions: {
        type: [questionSchema],
        default: []
    }
});
reasonSchema.plugin(mongoosePaginate);
const Reason = mongoose.model('Reason', reasonSchema);
exports.default = Reason;
//# sourceMappingURL=reason.model.js.map