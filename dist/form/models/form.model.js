"use strict";
exports.__esModule = true;
exports.kindForm = exports.KindForm = exports.kindQuestionImage = exports.KindQuestionImage = exports.kindQuestionKeyboard = exports.KindQuestionKeyboard = exports.kindQuestion = exports.KindQuestion = void 0;
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var trigger_model_1 = require("./trigger.model");
var itemSchema = new mongoose.Schema({
    item: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Boolean,
        "default": false
    }
});
var accessorySchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    items: [itemSchema]
});
var KindQuestion;
(function (KindQuestion) {
    KindQuestion["scale"] = "scale";
    KindQuestion["accessory"] = "accessory";
    KindQuestion["text"] = "text";
    KindQuestion["venue"] = "venue";
    KindQuestion["damage"] = "damage";
    KindQuestion["carrier"] = "carrier";
    KindQuestion["image"] = "image";
})(KindQuestion = exports.KindQuestion || (exports.KindQuestion = {}));
exports.kindQuestion = [
    KindQuestion.scale,
    KindQuestion.text,
    KindQuestion.accessory,
    KindQuestion.damage,
    KindQuestion.venue,
    KindQuestion.carrier,
    KindQuestion.image
];
var KindQuestionKeyboard;
(function (KindQuestionKeyboard) {
    KindQuestionKeyboard["text"] = "text";
    KindQuestionKeyboard["numeric"] = "numeric";
    KindQuestionKeyboard["email"] = "email";
})(KindQuestionKeyboard = exports.KindQuestionKeyboard || (exports.KindQuestionKeyboard = {}));
exports.kindQuestionKeyboard = [
    KindQuestionKeyboard.text,
    KindQuestionKeyboard.numeric,
    KindQuestionKeyboard.email
];
var KindQuestionImage;
(function (KindQuestionImage) {
    KindQuestionImage["photo"] = "photo";
    KindQuestionImage["signature"] = "signature";
    KindQuestionImage["picture"] = "picture";
})(KindQuestionImage = exports.KindQuestionImage || (exports.KindQuestionImage = {}));
exports.kindQuestionImage = [
    KindQuestionImage.photo,
    KindQuestionImage.signature,
    KindQuestionImage.picture
];
var formQuestionsSchema = new mongoose.Schema({
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
        ref: 'Scale'
    },
    damages: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Damages'
    },
    accessories: {
        type: accessorySchema,
        "default": null
    },
    conciliation: {
        type: Boolean,
        "default": false
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
    kind: {
        type: String,
        "enum": exports.kindQuestion,
        "default": KindQuestion.scale
    },
    order: {
        type: Number,
        required: true
    },
    optional: {
        type: Boolean,
        "default": false
    },
    hint: {
        type: String,
        trim: true
    },
    keyboardType: {
        type: String,
        "enum": exports.kindQuestionKeyboard,
        "default": KindQuestionKeyboard.text
    },
    imageType: {
        type: String,
        "enum": exports.kindQuestionImage,
        "default": KindQuestionImage.picture
    }
});
var formSectionsSchema = new mongoose.Schema({
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
var KindForm;
(function (KindForm) {
    KindForm["init"] = "init";
    KindForm["control"] = "control";
    KindForm["final"] = "final";
})(KindForm = exports.KindForm || (exports.KindForm = {}));
exports.kindForm = [
    KindForm.init,
    KindForm.final,
    KindForm.control,
];
var formSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
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
    description: {
        type: String,
        trim: true
    },
    // if shipping form
    shipping: {
        type: Boolean,
        "default": false
    },
    shippingText: {
        type: String,
        "default": ''
    },
    shippingImage: {
        type: Boolean,
        "default": false
    },
    // mark if require venue
    shippingVenue: {
        type: Boolean,
        "default": false
    },
    // text if require venue
    shippingVenueText: {
        type: String,
        "default": ''
    },
    // if reception form
    reception: {
        type: Boolean,
        "default": false
    },
    receptionText: {
        type: String,
        "default": ''
    },
    receptionImage: {
        type: Boolean,
        "default": false
    },
    // mark if require venue
    receptionVenue: {
        type: Boolean,
        "default": false
    },
    // text if require venue
    receptionVenueText: {
        type: String,
        "default": ''
    },
    // if require select carrier
    carrier: {
        type: Boolean,
        "default": false
    },
    carrierText: {
        type: String,
        "default": ''
    },
    conciliation: {
        type: Boolean,
        "default": false
    },
    conciliationText: {
        type: String,
        "default": ''
    },
    conciliationImage: {
        type: Boolean,
        "default": false
    },
    kind: {
        type: String,
        "enum": exports.kindForm,
        "default": KindForm.control
    },
    sections: [formSectionsSchema],
    triggers: [trigger_model_1.formTriggerSchema],
    active: {
        type: Boolean,
        "default": true
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
var Form = mongoose.model('Form', formSchema);
exports["default"] = Form;
//# sourceMappingURL=form.model.js.map