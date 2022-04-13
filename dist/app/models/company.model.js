"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var mongooseCrate = require("mongoose-crate");
var MongooseCrateS3 = require("mongoose-crate-s3");
var mongoosePaginate = require("mongoose-paginate");
var uuid = require("uuid");
var s3Config = require("../../../s3-config.json");
var imageSchema = new mongoose.Schema({
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
}, {
    _id: false
});
var billingSchema = new mongoose.Schema({
    checklistPrice: {
        type: Number,
        "default": 0
    },
    inventoryPrice: {
        type: Number,
        "default": 0
    },
    requestPrice: {
        type: Number,
        "default": 0
    },
    active: {
        type: Boolean,
        "default": false
    }
}, {
    _id: true
});
var billingNotificationsSchema = new mongoose.Schema({
    name: {
        type: String,
        "default": ''
    },
    email: {
        type: String,
        "default": ''
    },
    active: {
        type: Boolean,
        "default": true
    }
}, {
    _id: true
});
var companySchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    businessName: {
        type: String,
        trim: true
    },
    rut: {
        type: String,
        trim: true
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    deleted: {
        type: Boolean,
        "default": false
    },
    billing: {
        type: billingSchema,
        "default": {
            active: true,
            checklistPrice: 0.07,
            inventoryPrice: 0.022
        }
    },
    notifications: {
        type: [billingNotificationsSchema],
        "default": []
    },
    image: {
        type: imageSchema,
        "default": {}
    },
    marker: {
        type: imageSchema,
        "default": {}
    },
    active: {
        type: Boolean,
        "default": true
    },
    iFrameURL: {
        type: String
    },
    iFrameURLInventory: {
        type: String
    }
}, {
    timestamps: true
});
// {billing:{ active: true, checklistPrice: 0.07 , inventoryPrice: 0.022}, notifications:[]}
companySchema.plugin(mongoosePaginate);
companySchema.plugin(mongooseCrate, {
    storage: new MongooseCrateS3({
        key: process.env.S3_KEY || s3Config.accessKeyId,
        secret: process.env.S3_SECRET || s3Config.secretAccessKey,
        bucket: process.env.S3_BUCKET || s3Config.bucket,
        acl: 'public-read',
        region: process.env.S3_REGION || s3Config.region,
        // where the file is stored in the bucket - defaults to this function
        path: function (attachment) {
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
            return "/company/files/" + attachment.team + "/" + uuid.v1() + "-" + attachment.originalname;
        }
    }),
    fields: {
        image: {},
        marker: {}
    }
});
companySchema.virtual('users', {
    ref: 'User',
    localField: '_id',
    foreignField: 'company',
    justOne: false
});
var Company = mongoose.model('Company', companySchema);
exports["default"] = Company;
//# sourceMappingURL=company.model.js.map