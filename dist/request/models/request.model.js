"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var mongooseCrate = require("mongoose-crate");
var MongooseCrateS3 = require("mongoose-crate-s3");
var s3Config = require("../../../s3-config.json");
var uuid = require("uuid");
var customerInformationSchema = new mongoose.Schema({
    name: {
        type: String
    },
    rut: {
        type: String
    },
    email: {
        type: String
    },
    phone: {
        type: String
    }
});
var paymentInformationSchema = new mongoose.Schema({
    method: {
        type: String
    },
    number: {
        type: String
    },
    files: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RequestFile'
        }],
    letters: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RequestFile'
        }]
});
var requestSchema = new mongoose.Schema({
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    number: {
        type: Number
    },
    customerInformation: {
        type: customerInformationSchema,
        "default": {}
    },
    advancePaymentInformation: {
        type: paymentInformationSchema,
        "default": {}
    },
    conectaID: {
        type: String
    },
    origin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue'
    },
    destination: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue'
    },
    loadingDate: {
        type: Date
    },
    arrivalDate: {
        type: Date
    },
    sellerText: {
        type: String
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalesChannel'
    },
    operationType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OperationType'
    },
    fleet: {
        type: Boolean,
        "default": false
    },
    deliveryVenue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue'
    },
    deliveryAddress: {
        type: String
    },
    deliveryDate: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        "default": null
    }
}, {
    timestamps: true
});
requestSchema.virtual('items', {
    ref: 'RequestItem',
    localField: '_id',
    foreignField: 'request',
    justOne: false
});
requestSchema.set('toObject', { virtuals: true });
requestSchema.set('toJSON', { virtuals: true });
requestSchema.plugin(mongoosePaginate);
requestSchema.plugin(mongooseCrate, {
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
            return "/request/files/".concat(attachment.team, "/").concat(uuid.v1(), "-").concat(attachment.originalname);
        }
    }),
    fields: {
        paymentInformationSchema: {
            advancePaymentFile: {}
        }
    }
});
var Request = mongoose.model('Request', requestSchema);
exports["default"] = Request;
//# sourceMappingURL=request.model.js.map