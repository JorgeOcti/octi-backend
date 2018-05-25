"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const participantChoiceSchema = new mongoose.Schema({
    choice: { type: String, required: true, trim: true },
    value: { type: Number, required: true },
    backgroundColor: { type: String, default: '#ffffff' },
    requireImage: { type: Boolean, default: false },
    requireComment: { type: Boolean, default: false },
    na: { type: Boolean, default: false },
    order: { type: Number, required: true }
});
exports.scaleSchema = new mongoose.Schema({
    name: String,
    minValue: { type: Number, required: true },
    maxValue: { type: Number, required: true },
    choices: [participantChoiceSchema],
    active: { type: Boolean, default: true }
});
const participantAnswersSchema = new mongoose.Schema({
    question: { type: String, required: true, trim: true },
    shortName: { type: String, trim: true },
    scale: exports.scaleSchema,
    risk: { type: String, trim: true },
    observe: { type: String, trim: true },
    answer: { type: mongoose.Schema.Types.ObjectId },
    comment: { type: String },
    qualification: { type: Number },
    weight: { type: Number, required: true },
    order: { type: Number, required: true }
});
const participantSectionsSchema = new mongoose.Schema({
    section_id: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String, required: true, trim: true },
    shortName: { type: String, trim: true },
    answers: [participantAnswersSchema],
    qualification: { type: Number },
    weight: { type: Number, required: true },
    order: { type: Number, required: true }
});
const participantSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    description: { type: String, trim: true },
    sections: [participantSectionsSchema],
    active: { type: Boolean, default: true }
}, {
    timestamps: true
});
const Participant = mongoose.model('Participant', participantSchema);
exports.default = Participant;
//# sourceMappingURL=participant.model.js.map