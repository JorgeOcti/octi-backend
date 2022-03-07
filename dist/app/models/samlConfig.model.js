"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var mongooseCrate = require("mongoose-crate");
var MongooseCrateS3 = require("mongoose-crate-s3");
var mongoosePaginate = require("mongoose-paginate");
var uuid = require("uuid");
var s3Config = require("../../../s3-config.json");
var certSchema = new mongoose.Schema({
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
var samlConfigSchema = new mongoose.Schema({
    // name of the provider to identify it
    name: {
        type: String,
        required: true
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    // is the URL provided by Identity Provider which will be used to redirect users on the login page if not authenticated.
    entryPoint: {
        type: String,
        trim: true
    },
    // is a string provided to the Identity Provider to uniquely identify Service Provider.
    issuer: {
        type: String
    },
    // This will be the URL of the Service Provider which will consume the SAML response once authentication is done on Identity Provider. Identity Provider will call this URL.
    callbackUrl: {
        type: String,
        trim: true
    },
    // This is the certificate provided by Identity Provider. This will be used to establish the trust between Identity Provider and Service Provider.
    cert: {
        type: certSchema,
        "default": {}
    }
}, {
    timestamps: true
});
samlConfigSchema.plugin(mongoosePaginate);
samlConfigSchema.plugin(mongooseCrate, {
    storage: new MongooseCrateS3({
        key: process.env.S3_KEY || s3Config.accessKeyId,
        secret: process.env.S3_SECRET || s3Config.secretAccessKey,
        bucket: process.env.S3_BUCKET || s3Config.bucket,
        acl: 'public-read',
        region: process.env.S3_REGION || s3Config.region,
        // where the file is stored in the bucket - defaults to this function
        path: function (attachment) {
            return "/saml/cert/".concat(attachment.team, "/").concat(uuid.v1(), "-").concat(attachment.originalname);
        }
    }),
    fields: {
        cert: {}
    }
});
var SamlConfig = mongoose.model('SamlConfig', samlConfigSchema);
exports["default"] = SamlConfig;
//# sourceMappingURL=samlConfig.model.js.map