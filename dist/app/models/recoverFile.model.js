"use strict";
exports.__esModule = true;
exports.recoverFileSchema = void 0;
var mongoose = require("mongoose");
var mongooseCrate = require("mongoose-crate");
var MongooseCrateS3 = require("mongoose-crate-s3");
var s3Config = require("../../../s3-config.json");
var fileSchema = new mongoose.Schema({
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
exports.recoverFileSchema = new mongoose.Schema({
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    file: fileSchema
}, {
    timestamps: true
});
exports.recoverFileSchema.plugin(mongooseCrate, {
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
            encoding:"7bit"
            fieldname:"file"
            filename:"158df9426e29a5a057526c2cbf74397d"
            mimetype:"image/svg+xml"
            name:"158df9426e29a5a057526c2cbf74397d"
            originalname:"aws-codedeploy.svg"
            path:"/tmp/158df9426e29a5a057526c2cbf74397d"
            size:966
            type:"image/svg"
            * */
            return "/forms/files/".concat(attachment.company, "/recover/").concat(attachment.user, "/").concat(attachment.originalname);
        }
    }),
    fields: {
        file: {}
    }
});
var RecoverFile = mongoose.model('RecoverFile', exports.recoverFileSchema);
exports["default"] = RecoverFile;
//# sourceMappingURL=recoverFile.model.js.map