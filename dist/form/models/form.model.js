"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const formQuestionsSchema = new mongoose.Schema({
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
const formSectionsSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    shortName: { type: String, trim: true },
    questions: [formQuestionsSchema],
    weight: { type: Number, required: true },
    order: { type: Number, required: true }
});
const formSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    sections: [formSectionsSchema],
    active: { type: Boolean, default: true }
}, {
    timestamps: true
});
// formSchema.set('toJSON', {
//   transform: (doc: any, ret: any, options: any) => {
//     ret.id = ret._id;
//     delete ret._id;
//     delete ret.__v;
//   }
// });
const Form = mongoose.model('Form', formSchema);
exports.default = Form;
//# sourceMappingURL=form.model.js.map