"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const mongooseCrate = require("mongoose-crate");
const MongooseCrateS3 = require("mongoose-crate-s3");
const uuid = require("uuid");
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
    },
});
const participantFileSchema = new mongoose.Schema({
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
participantFileSchema.plugin(mongooseCrate, {
    storage: new MongooseCrateS3({
        key: 'AKIAI7N7MEN6RB7752VQ',
        secret: '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',
        bucket: 'media-andes-stage',
        acl: 'public-read',
        region: 'sa-east-1',
        // where the file is stored in the bucket - defaults to this function
        path: (attachment) => {
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
            return `/forms/files/${attachment.company}/${attachment.form}/${uuid.v1()}-${attachment.originalname}`;
        }
    }),
    fields: {
        file: {}
    }
});
// participantFileSchema.index({ form: 1, user: 1 });
const ParticipantFile = mongoose.model('ParticipantFile', participantFileSchema);
exports.default = ParticipantFile;
//# sourceMappingURL=participant-file.model.js.map