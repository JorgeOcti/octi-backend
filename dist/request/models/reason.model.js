"use strict";
exports.__esModule = true;
exports.choicesTypeQuestuion = exports.ChoicesTypeQuestion = void 0;
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var fileSchema = new mongoose.Schema({
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
var questionSchema = new mongoose.Schema({
    name: {
        type: String
    },
    type: {
        type: String,
        "enum": exports.choicesTypeQuestuion,
        "default": ChoicesTypeQuestion.text
    },
    required: {
        type: Boolean,
        "default": false
    }
});
var reasonSchema = new mongoose.Schema({
    name: {
        type: String
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    file: {
        type: fileSchema,
        "default": {
            active: false,
            required: false
        }
    },
    questions: {
        type: [questionSchema],
        "default": []
    }
});
reasonSchema.plugin(mongoosePaginate);
var Reason = mongoose.model('Reason', reasonSchema);
exports["default"] = Reason;
//# sourceMappingURL=reason.model.js.map