"use strict";
var _a;
exports.__esModule = true;
exports.choicesStatsDashboardTypes = exports.DashboardTypesDictionary = exports.StatsDashboardTypes = void 0;
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var StatsDashboardTypes;
(function (StatsDashboardTypes) {
    StatsDashboardTypes["UNIT_CONTROL"] = "UNIT_CONTROL";
    StatsDashboardTypes["INVENTORY"] = "INVENTORY";
    StatsDashboardTypes["DISTRIBUTION"] = "DISTRIBUTION";
    StatsDashboardTypes["PLANIFICATION"] = "PLANIFICATION";
})(StatsDashboardTypes = exports.StatsDashboardTypes || (exports.StatsDashboardTypes = {}));
exports.DashboardTypesDictionary = (_a = {},
    _a[StatsDashboardTypes.UNIT_CONTROL] = "Control de unidades",
    _a[StatsDashboardTypes.INVENTORY] = "Inventarios",
    _a[StatsDashboardTypes.DISTRIBUTION] = "Distribución",
    _a[StatsDashboardTypes.PLANIFICATION] = "Planificación",
    _a);
exports.choicesStatsDashboardTypes = [
    StatsDashboardTypes.UNIT_CONTROL,
    StatsDashboardTypes.INVENTORY,
    StatsDashboardTypes.DISTRIBUTION,
    StatsDashboardTypes.PLANIFICATION,
];
var studioSchema = new mongoose.Schema({
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    users: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
    type: {
        type: String,
        "enum": exports.choicesStatsDashboardTypes,
        "default": StatsDashboardTypes.UNIT_CONTROL
    },
    name: String,
    embedURL: String
}, {
    timestamps: true
});
studioSchema.plugin(mongoosePaginate);
var Studio = mongoose.model('Studio', studioSchema);
exports["default"] = Studio;
//# sourceMappingURL=studio.model.js.map