"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var formSettingSchema = new mongoose.Schema({
    vinMinCharacters: {
        type: Number,
        "default": 17
    },
    vinMaxCharacters: {
        type: Number,
        "default": 17
    }
});
var inventorySettingSchema = new mongoose.Schema({
    pending: {
        type: String
    },
    pendingClass: {
        type: String
    },
    pendingColor: {
        type: String
    },
    found: {
        type: String
    },
    foundClass: {
        type: String
    },
    foundColor: {
        type: String
    },
    missing: {
        type: String
    },
    missingClass: {
        type: String
    },
    missingColor: {
        type: String
    },
    leftover: {
        type: String
    },
    leftoverClass: {
        type: String
    },
    leftoverColor: {
        type: String
    },
    leftoverDifferentVenue: {
        type: Boolean,
        "default": false
    },
    reported: {
        type: String
    },
    reportedClass: {
        type: String
    },
    reportedColor: {
        type: String
    }
});
var requestSettingSchema = new mongoose.Schema({
    denomination: {
        type: Boolean,
        "default": true
    },
    denominationRequired: {
        type: Boolean,
        "default": true
    },
    material: {
        type: Boolean,
        "default": true
    },
    materialRequired: {
        type: Boolean,
        "default": true
    },
    color: {
        type: Boolean,
        "default": true
    },
    colorRequired: {
        type: Boolean,
        "default": true
    },
    internalNumber: {
        type: Boolean,
        "default": true
    },
    internalNumberRequired: {
        type: Boolean,
        "default": true
    },
    internalNumberText: {
        type: String,
        "default": 'Número interno'
    }
});
var teamSettingSchema = new mongoose.Schema({
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    inventory: inventorySettingSchema,
    request: requestSettingSchema,
    form: formSettingSchema
}, {
    timestamps: true
});
// db.teamsettings.updateMany({}, {$set:{request:{denomination: true, denominationRequired: true, material: true, materialRequired: true, internalNumber: true, internalNumberRequired: false, internalNumberText:  "Número interno", color: true, colorRequired: true}}},{many: true});
// db.teamsettings.updateMany({}, { $set: { form: { vinMinCharacters: 17, vinMaxCharacters: 17 } } }, { many: true });
teamSettingSchema.statics.findOneOrCreate = function (condition, create) {
    var model = this;
    return new Promise(function (resolve, reject) {
        model.findOne(condition, function (err, result) {
            if (err) {
                return reject(err);
            }
            if (result) {
                return resolve(result);
            }
            model.create(create, function (err, result) {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    });
};
var TeamSetting = mongoose.model('TeamSetting', teamSettingSchema);
exports["default"] = TeamSetting;
//# sourceMappingURL=teamSetting.model.js.map