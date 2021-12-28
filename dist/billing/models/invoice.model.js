"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");
var mongooseCrate = require("mongoose-crate");
var MongooseCrateS3 = require("mongoose-crate-s3");
var s3Config = require("../../../s3-config.json");
var uuid = require("uuid");
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
var invoiceSchema = new mongoose.Schema({
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    period: {
        type: String
    },
    inventoryCars: {
        type: Number,
        "default": 0
    },
    checklistCars: {
        type: Number,
        "default": 0
    },
    requestCars: {
        type: Number,
        "default": 0
    },
    inventoryPrice: {
        type: Number,
        "default": 0
    },
    checklistPrice: {
        type: Number,
        "default": 0
    },
    requestPrice: {
        type: Number,
        "default": 0
    },
    totalUF: {
        type: Number,
        "default": 0
    },
    totalDolar: {
        type: Number,
        "default": 0
    },
    totalPeso: {
        type: Number,
        "default": 0
    },
    valueUF: {
        type: Number,
        "default": 0
    },
    valueDolar: {
        type: Number,
        "default": 0
    },
    file: {
        type: fileSchema,
        "default": {}
    }
}, {
    timestamps: true
});
invoiceSchema.plugin(mongooseCrate, {
    storage: new MongooseCrateS3({
        key: process.env.S3_KEY || s3Config.accessKeyId,
        secret: process.env.S3_SECRET || s3Config.secretAccessKey,
        bucket: process.env.S3_BUCKET || s3Config.bucket,
        acl: 'public-read',
        region: process.env.S3_REGION || s3Config.region,
        // where the file is stored in the bucket - defaults to this function
        path: function (attachment) {
            /* attachment params:
            destination:"/tmp/"
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
            return "/invoices/".concat(attachment.team, "/").concat(attachment.createdAt, "/").concat(attachment.company, "/").concat(uuid.v1(), "-").concat(attachment.originalname);
            // console.log('invoice-attachment', attachment);
            // return `/invoices/${uuid.v1()}-${attachment.originalname}`;
        }
    }),
    fields: {
        file: {}
    }
});
invoiceSchema.plugin(mongoosePaginate);
var Invoice = mongoose.model('Invoice', invoiceSchema);
exports["default"] = Invoice;
//# sourceMappingURL=invoice.model.js.map