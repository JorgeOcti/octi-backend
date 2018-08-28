"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const itemSchema = new mongoose.Schema({
    item: {
        type: String,
        required: true,
        trim: true
    }
});
const accessorySchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    items: [itemSchema]
});
const formQuestionsSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    shortName: {
        type: String,
        trim: true
    },
    scale: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scale',
        required: true
    },
    accessories: {
        type: accessorySchema,
        default: null
    },
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
    weight: {
        type: Number,
        required: true
    },
    order: {
        type: Number,
        required: true
    }
});
const formSectionsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    shortName: {
        type: String,
        trim: true
    },
    questions: [formQuestionsSchema],
    weight: {
        type: Number,
        required: true
    },
    order: {
        type: Number,
        required: true
    }
});
const formSchema = new mongoose.Schema({
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
    shipping: {
        type: Boolean,
        default: false
    },
    shippingText: {
        type: String,
        default: ''
    },
    shippingImage: {
        type: Boolean,
        default: false
    },
    reception: {
        type: Boolean,
        default: false
    },
    receptionText: {
        type: String,
        default: ''
    },
    receptionImage: {
        type: Boolean,
        default: false
    },
    conciliation: {
        type: Boolean,
        default: false
    },
    conciliationText: {
        type: String,
        default: ''
    },
    sections: [formSectionsSchema],
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
formSchema.plugin(mongoosePaginate);
formSchema.virtual('participants', {
    ref: 'Participant',
    localField: '_id',
    foreignField: 'form',
    justOne: false
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