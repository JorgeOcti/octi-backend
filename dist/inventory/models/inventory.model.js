"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.choicesStatusInventory = exports.ChoicesStatusInventory = void 0;
const mongoose = require("mongoose");
const mongooseCrate = require("mongoose-crate");
const MongooseCrateS3 = require("mongoose-crate-s3");
const uuid = require("uuid");
const s3Config = require("../../../s3-config.json");
const mongoosePaginate = require("mongoose-paginate");
const fileSchema = new mongoose.Schema({
    url: {
        type: String
    },
    type: {
        type: String
    },
    name: {
        type: String
    },
    size: {
        type: Number
    }
});
const photoSettingSchema = new mongoose.Schema({
    manual: {
        type: Number,
        default: 1
    },
    report: {
        type: Number,
        default: 1
    }
}, {
    _id: false
});
const settingSchema = new mongoose.Schema({
    photos: {
        type: photoSettingSchema
    }
}, {
    _id: false
});
var ChoicesStatusInventory;
(function (ChoicesStatusInventory) {
    ChoicesStatusInventory["pending"] = "pending";
    ChoicesStatusInventory["inProcess"] = "inProcess";
    ChoicesStatusInventory["finalized"] = "finalized";
})(ChoicesStatusInventory = exports.ChoicesStatusInventory || (exports.ChoicesStatusInventory = {}));
exports.choicesStatusInventory = [
    ChoicesStatusInventory.pending,
    ChoicesStatusInventory.inProcess,
    ChoicesStatusInventory.finalized
];
const inventorySchema = new mongoose.Schema({
    name: {
        type: String
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
    venues: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Venue'
        }],
    file: {
        type: fileSchema,
        default: {}
    },
    settings: {
        type: settingSchema,
        default: {
            photos: {
                manual: 1,
                report: 1
            }
        }
    },
    backup: {
        type: fileSchema,
        default: {}
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    finalizedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    finalizedAt: {
        type: Date
    },
    status: {
        type: String,
        enum: exports.choicesStatusInventory,
        default: ChoicesStatusInventory.pending
    }
}, {
    timestamps: true
});
inventorySchema.plugin(mongooseCrate, {
    storage: new MongooseCrateS3({
        key: process.env.S3_KEY || s3Config.accessKeyId,
        secret: process.env.S3_SECRET || s3Config.secretAccessKey,
        bucket: process.env.S3_BUCKET || s3Config.bucket,
        acl: 'public-read',
        region: process.env.S3_REGION || s3Config.region,
        // where the file is stored in the bucket - defaults to this function
        path: (attachment) => {
            /* attachment params:
            estination:"/tmp/"
            encoding:"7bit"s
            fieldname:"file"
            filename:"158df9426e29a5a057526c2cbf74397d"
            mimetype:"image/svg+xml"
            name:"158df9426e29a5a057526c2cbf74397d"
            originalname:"aws-codedeploy.svg"
            path:"/tmp/158df9426e29a5a057526c2cbf74397d"
            size:966
            type:"image/svg"
            * */
            return `/inventories/setting/${attachment.team}/${uuid.v1()}-${attachment.originalname}`;
        }
    }),
    fields: {
        file: {},
        backup: {}
    }
});
inventorySchema.virtual('cars', {
    ref: 'InventoryCar',
    localField: '_id',
    foreignField: 'inventory',
    justOne: false
});
inventorySchema.index({ team: 1 });
inventorySchema.index({ team: 1, status: 1, venues: 1 });
inventorySchema.plugin(mongoosePaginate);
const Inventory = mongoose.model('Inventory', inventorySchema);
exports.default = Inventory;
//# sourceMappingURL=inventory.model.js.map