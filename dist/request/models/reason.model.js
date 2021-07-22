"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.choicesTypeQuestuion = exports.ChoicesTypeQuestion = void 0;
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
var ChoicesTypeQuestion;
(function (ChoicesTypeQuestion) {
    ChoicesTypeQuestion["text"] = "text";
    ChoicesTypeQuestion["number"] = "number";
    ChoicesTypeQuestion["paymentMethod"] = "paymentMethod";
})(ChoicesTypeQuestion = exports.ChoicesTypeQuestion || (exports.ChoicesTypeQuestion = {}));
exports.choicesTypeQuestuion = [
    ChoicesTypeQuestion.text,
    ChoicesTypeQuestion.number,
    ChoicesTypeQuestion.paymentMethod
];
const questionSchema = new mongoose.Schema({
    name: {
        type: String
    },
    type: {
        type: String,
        enum: exports.choicesTypeQuestuion,
        default: ChoicesTypeQuestion.text
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