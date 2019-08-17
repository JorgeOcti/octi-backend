"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const form_model_1 = require("./form.model");
const scale_model_1 = require("./scale.model");
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
        enum: scale_model_1.choiceBackgroundColors,
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
    amount: {
        type: Boolean,
        default: false
    }
});
const accesorySchema = new mongoose.Schema({
    item: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        default: 1
    }
}, {
    _id: false
});
const accessorySchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    items: [{ type: itemSchema }]
});
const positionSchema = new mongoose.Schema({
    name: {
        type: String
    }
});
const kindSchema = new mongoose.Schema({
    name: {
        type: String
    }
});
const partSchema = new mongoose.Schema({
    name: {
        type: String
    }
});
const damagesSchema = new mongoose.Schema({
    name: {
        type: String
    },
    positions: [positionSchema],
    kinds: [kindSchema],
    parts: [partSchema]
});
const damagesSelectedSchema = new mongoose.Schema({
    position: {
        type: mongoose.Schema.Types.ObjectId
    },
    kind: {
        type: mongoose.Schema.Types.ObjectId
    },
    part: {
        type: mongoose.Schema.Types.ObjectId
    },
    images: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ParticipantFile'
        }]
});
const participantAnswersSchema = new mongoose.Schema({
    question: { type: String, required: true, trim: true },
    shortName: { type: String, trim: true },
    scale: exports.scaleSchema,
    damages: damagesSchema,
    damagesSelected: [damagesSelectedSchema],
    accessories: {
        type: accessorySchema,
        default: null
    },
    accesoriesSelected: [mongoose.Schema.Types.ObjectId],
    accesoriesAnswered: [{
            type: accesorySchema
        }],
    conciliation: {
        type: Boolean,
        default: false
    },
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
            ref: 'ParticipantFile'
        }],
    comment: {
        type: String
    },
    na: {
        type: Boolean,
        default: false
    },
    qualification: {
        type: Number
    },
    weight: {
        type: Number,
        required: true
    },
    kind: {
        type: String,
        enum: form_model_1.kindQuestion,
        default: form_model_1.KindQuestion.scale
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
    number: {
        type: Number
    },
    form: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form',
        index: true
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
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
    venue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue'
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
    shipping: {
        type: Boolean,
        default: false
    },
    shippingText: {
        type: String,
        default: ''
    },
    shippingImages: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ParticipantFile'
        }],
    shippingConfirmation: {
        type: Boolean
    },
    shippingVenue: {
        type: Boolean
    },
    shippingVenueText: {
        type: String
    },
    sendTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue'
    },
    reception: {
        type: Boolean,
        default: false
    },
    receptionText: {
        type: String,
        default: ''
    },
    receptionImages: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ParticipantFile'
        }],
    receptionConfirmation: {
        type: Boolean
    },
    receptionVenue: {
        type: Boolean
    },
    receptionVenueText: {
        type: String
    },
    receiveFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue'
    },
    carrier: {
        type: Boolean,
        default: false
    },
    carrierText: {
        type: String,
        default: false
    },
    carrierBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Carrier'
    },
    conciliation: {
        type: Boolean,
        default: false
    },
    conciliationText: {
        type: String,
        default: ''
    },
    conciliationImages: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ParticipantFile'
        }],
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
participantSchema.index({ _id: 1 });
participantSchema.index({ createdAt: 1 });
participantSchema.index({ createdAt: -1 });
participantSchema.index({ team: 1, createdAt: 1 });
participantSchema.index({ venue: 1 });
participantSchema.index({ survey: 1, completed: 1 });
participantSchema.index({ form: 1, user: 1 });
participantSchema.index({ company: 1, venue: 1, createdAt: 1 });
participantSchema.index({ _id: 1, company: 1, venue: 1, createdAt: 1 });
const Participant = mongoose.model('Participant', participantSchema);
exports.default = Participant;
//# sourceMappingURL=participant.model.js.map