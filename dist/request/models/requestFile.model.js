"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestFileSchema = void 0;
const mongoose = require("mongoose");
const mongooseCrate = require("mongoose-crate");
const MongooseCrateS3 = require("mongoose-crate-s3");
const uuid = require("uuid");
const s3Config = require("../../../s3-config.json");
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
exports.requestFileSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    file: fileSchema,
    thumbnail: fileSchema
}, {
    timestamps: true
});
exports.requestFileSchema.plugin(mongooseCrate, {
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
            return `/request/files/${attachment.team}/${uuid.v1()}-${attachment.originalname}`;
        }
    }),
    fields: {
        file: {},
        thumbnail: {}
    }
});
const RequestFile = mongoose.model('RequestFile', exports.requestFileSchema);
exports.default = RequestFile;
//# sourceMappingURL=requestFile.model.js.map