"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const formQuestionsSchema = new mongoose.Schema({
    question: String,
    shortName: String,
    scale: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scale'
    },
    risk: String,
    observe: String,
    weight: Number,
    order: Boolean
});
const formSectionsSchema = new mongoose.Schema({
    name: String,
    shortName: String,
    questions: [formQuestionsSchema],
    weight: Number,
    order: Boolean
});
const formSchema = new mongoose.Schema({
    name: String,
    description: String,
    sections: [formSectionsSchema],
    active: Boolean
}, {
    timestamps: true
});
const Form = mongoose.model('Form', formSchema);
exports.default = Form;
//# sourceMappingURL=form.model.js.map