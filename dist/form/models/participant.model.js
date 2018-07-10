"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const participantChoiceSchema = new mongoose.Schema({
    choice: {
        type: String,
        required: true,
        trim: true
    },
    value: {
        type: Number,
        required: true
    },
    backgroundColor: {
        type: String,
        default: 'blue'
    },
    requireImage: {
        type: Boolean,
        default: false
    },
    requireComment: {
        type: Boolean,
        default: false
    },
    requireAccesories: {
        type: Boolean,
        default: false
    },
    requireConciliation: {
        type: Boolean,
        default: false
    },
    na: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        required: true
    }
});
exports.scaleSchema = new mongoose.Schema({
    name: String,
    minValue: {
        type: Number,
        required: true
    },
    maxValue: {
        type: Number,
        required: true
    },
    choices: [participantChoiceSchema],
    active: {
        type: Boolean,
        default: true
    }
});
const itemSchema = new mongoose.Schema({
    item: {
        type: String,
        required: true,
        trim: true
    },
});
const accessorySchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    items: [itemSchema]
});
const participantAnswersSchema = new mongoose.Schema({
    question: { type: String, required: true, trim: true },
    shortName: { type: String, trim: true },
    scale: exports.scaleSchema,
    accessories: {
        type: accessorySchema,
        default: null
    },
    accesoriesSelected: [mongoose.Schema.Types.ObjectId],
    risk: {
        type: String,
        trim: true
    },
    observe: {
        type: String,
        trim: true
    },
    answer: {
        type: mongoose.Schema.Types.ObjectId
    },
    images: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ParticipantFile',
        }],
    comment: {
        type: String
    },
    qualification: {
        type: Number
    },
    weight: {
        type: Number,
        required: true
    },
    order: {
        type: Number,
        required: true
    }
});
const participantSectionsSchema = new mongoose.Schema({
    section_id: {
        type: mongoose.Schema.Types.ObjectId
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    shortName: {
        type: String,
        trim: true
    },
    answers: [participantAnswersSchema],
    qualification: {
        type: Number
    },
    weight: {
        type: Number,
        required: true
    },
    order: {
        type: Number,
        required: true
    }
});
const participantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    form: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form',
        index: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    car: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car',
        index: true
    },
    description: {
        type: String,
        trim: true
    },
    sections: [participantSectionsSchema],
    qualification: {
        type: Number,
        default: 0
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
participantSchema.index({ form: 1, user: 1 });
const Participant = mongoose.model('Participant', participantSchema);
exports.default = Participant;
//# sourceMappingURL=participant.model.js.map