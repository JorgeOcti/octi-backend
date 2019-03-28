"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const mongooseCrate = require("mongoose-crate");
const MongooseCrateS3 = require("mongoose-crate-s3");
const mongoosePaginate = require("mongoose-paginate");
const uuid = require("uuid");
const s3Config = require("../../../s3-config.json");
const imageSchema = new mongoose.Schema({
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
const companySchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    deleted: {
        type: Boolean,
        default: false
    },
    image: {
        type: imageSchema,
        default: {}
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
companySchema.plugin(mongoosePaginate);
companySchema.plugin(mongooseCrate, {
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
            return `/company/files/${attachment.team}/${uuid.v1()}-${attachment.originalname}`;
        }
    }),
    fields: {
        image: {}
    }
});
companySchema.virtual('users', {
    ref: 'User',
    localField: '_id',
    foreignField: 'company',
    justOne: false
});
const Company = mongoose.model('Company', companySchema);
exports.default = Company;
//# sourceMappingURL=company.model.js.map