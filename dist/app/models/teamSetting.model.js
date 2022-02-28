"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var helpPhonesSettingSchema = new mongoose.Schema({
    transmittal: {
        type: String
    }
});
var UnitVocabReferenceSchema = new mongoose.Schema({
    singular: {
        type: String,
        "default": "Unidad"
    },
    plural: {
        type: String,
        "default": "Unidades"
    }
});
var vocabularySettingsSchema = new mongoose.Schema({
    primary: {
        type: String,
        "default": "VIN"
    },
    secondary: {
        type: String,
        "default": "Patente"
    },
    unitReference: {
        type: UnitVocabReferenceSchema
    }
});
var reportSettingSchema = new mongoose.Schema({
    atLeastOne: {
        type: Boolean,
        "default": true
    },
    primaryRequired: {
        type: Boolean,
        "default": true
    },
    secondaryRequired: {
        type: Boolean,
        "default": true
    }
});
var formSettingSchema = new mongoose.Schema({
    vinMinCharacters: {
        type: Number,
        "default": 17
    },
    vinMaxCharacters: {
        type: Number,
        "default": 17
    },
    report: {
        type: reportSettingSchema
    }
});
var inventorySettingSchema = new mongoose.Schema({
    report: {
        type: reportSettingSchema
    },
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
    brand: {
        type: Boolean,
        "default": true
    },
    brandReadOnly: {
        type: Boolean,
        "default": true
    },
    denomination: {
        type: Boolean,
        "default": true
    },
    denominationReadOnly: {
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
    materialReadOnly: {
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
    colorReadOnly: {
        type: Boolean,
        "default": true
    },
    colorRequired: {
        type: Boolean,
        "default": true
    },
    entry: {
        type: Boolean,
        "default": true
    },
    sellerText: {
        type: Boolean,
        "default": true
    },
    ticket: {
        type: Boolean,
        "default": true
    },
    priority: {
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
    },
    conectaID: {
        type: Boolean,
        "default": true
    },
    reason: {
        type: Boolean,
        "default": true
    }
});
var teamSettingSchema = new mongoose.Schema({
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    inventory: inventorySettingSchema,
    request: requestSettingSchema,
    helpPhones: helpPhonesSettingSchema,
    form: formSettingSchema,
    vocabulary: vocabularySettingsSchema
}, {
    timestamps: true
});
// db.teamsettings.updateMany({}, {$set:{request:{denomination: true, denominationRequired: true, material: true, materialRequired: true, internalNumber: true, internalNumberRequired: false, internalNumberText:  "Número interno", color: true, colorRequired: true}}},{many: true});
// db.teamsettings.updateMany({}, { $set: { form: { vinMinCharacters: 17, vinMaxCharacters: 17 } } }, { many: true });
/*
db.teamsettings.updateMany({}, {
    $set: {vocabulary: {
            primary: "VIN",
            secondary: "Patente",
            unitReference: {
                singular: "Unidad",
                plural: "Unidades"
            }
        }
    }
})


db.teamsettings.updateMany({}, {
    $set: {"form.report": {
            atLeastOne: true,
            primaryRequired: false,
            secondaryRequired: false
        }
    }
})

db.teamsettings.updateMany({}, {
    $set: {"inventory.report": {
            atLeastOne: true,
            primaryRequired: false,
            secondaryRequired: false
        }
    }
})
 */
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