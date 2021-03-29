"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const mongooseCrate = require("mongoose-crate");
const MongooseCrateS3 = require("mongoose-crate-s3");
const s3Config = require("../../../s3-config.json");
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
    }
});
const invoiceSchema = new mongoose.Schema({
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
        default: 0
    },
    checklistCars: {
        type: Number,
        default: 0
    },
    requestCars: {
        type: Number,
        default: 0
    },
    inventoryPrice: {
        type: Number,
        default: 0
    },
    checklistPrice: {
        type: Number,
        default: 0
    },
    requestPrice: {
        type: Number,
        default: 0
    },
    totalUF: {
        type: Number,
        default: 0
    },
    totalDolar: {
        type: Number,
        default: 0
    },
    totalPeso: {
        type: Number,
        default: 0
    },
    valueUF: {
        type: Number,
        default: 0
    },
    valueDolar: {
        type: Number,
        default: 0
    },
    file: {
        type: fileSchema,
        default: {}
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
        path: (attachment) => {
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
            return `/invoices/${attachment.team}/${attachment.createdAt}/${attachment.company}/${uuid.v1()}-${attachment.originalname}`;
            // console.log('invoice-attachment', attachment);
            // return `/invoices/${uuid.v1()}-${attachment.originalname}`;
        }
    }),
    fields: {
        file: {}
    }
});
invoiceSchema.plugin(mongoosePaginate);
const Invoice = mongoose.model('Invoice', invoiceSchema);
exports.default = Invoice;
//# sourceMappingURL=invoice.model.js.map