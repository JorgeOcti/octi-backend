"use strict";
exports.__esModule = true;
exports.participantFileSchema = void 0;
var mongoose = require("mongoose");
var mongooseCrate = require("mongoose-crate");
var MongooseCrateS3 = require("mongoose-crate-s3");
var uuid = require("uuid");
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
exports.participantFileSchema = new mongoose.Schema({
    participant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Participant'
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
exports.participantFileSchema.plugin(mongooseCrate, {
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
            return "/forms/files/" + attachment.company + "/" + attachment.form + "/" + uuid.v1() + "-" + attachment.originalname;
        }
    }),
    fields: {
        file: {}
    }
});
// participantFileSchema.index({ form: 1, user: 1 });
var ParticipantFile = mongoose.model('ParticipantFile', exports.participantFileSchema);
exports["default"] = ParticipantFile;
//# sourceMappingURL=participantFile.model.js.map