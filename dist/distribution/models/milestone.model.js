"use strict";
exports.__esModule = true;
exports.choicesStepMilestone = exports.ChoicesStepMilestone = exports.choicesKindMilestone = exports.ChoicesKindMilestone = void 0;
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");
var ChoicesKindMilestone;
(function (ChoicesKindMilestone) {
    ChoicesKindMilestone["form"] = "form";
    ChoicesKindMilestone["file"] = "file";
})(ChoicesKindMilestone = exports.ChoicesKindMilestone || (exports.ChoicesKindMilestone = {}));
exports.choicesKindMilestone = [
    ChoicesKindMilestone.form,
    ChoicesKindMilestone.file
];
var ChoicesStepMilestone;
(function (ChoicesStepMilestone) {
    ChoicesStepMilestone["checkItem"] = "checkItem";
    ChoicesStepMilestone["loadEvidence"] = "loadEvidence";
    ChoicesStepMilestone["finishTransmittal"] = "finishTransmittal";
})(ChoicesStepMilestone = exports.ChoicesStepMilestone || (exports.ChoicesStepMilestone = {}));
exports.choicesStepMilestone = [
    ChoicesStepMilestone.checkItem,
    ChoicesStepMilestone.loadEvidence,
    ChoicesStepMilestone.finishTransmittal
];
var milestoneSchema = new mongoose.Schema({
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    name: {
        type: String
    },
    kind: {
        type: String,
        "enum": exports.choicesKindMilestone,
        "default": ""
    },
    step: {
        type: String,
        "enum": exports.choicesStepMilestone,
        "default": ""
    },
    form: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form'
    },
    order: {
        type: Number
    }
}, {
    timestamps: true
});
milestoneSchema.plugin(mongoosePaginate);
milestoneSchema.plugin(mongooseAggregatePaginate);
var Milestone = mongoose.model('Milestone', milestoneSchema);
exports["default"] = Milestone;
//# sourceMappingURL=milestone.model.js.map