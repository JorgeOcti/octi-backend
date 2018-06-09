"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose = require("mongoose");
var formQuestionsSchema = new mongoose.Schema({
    question: { type: String, required: true, trim: true },
    shortName: { type: String, trim: true },
    scale: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scale',
        required: true
    },
    risk: { type: String, trim: true },
    observe: { type: String, trim: true },
    weight: { type: Number, required: true },
    order: { type: Number, required: true }
});
var formSectionsSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    shortName: { type: String, trim: true },
    questions: [formQuestionsSchema],
    weight: { type: Number, required: true },
    order: { type: Number, required: true }
});
var formSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    sections: [formSectionsSchema],
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
var Form = mongoose.model('Form', formSchema);
exports.default = Form;
//# sourceMappingURL=form.model.js.map