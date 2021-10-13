"use strict";
exports.__esModule = true;
exports.createTransmittalSchema = void 0;
var yup = require("yup");
var createTransmittalSchema = yup.object().shape({
    name: yup.string(),
    files: yup.array().of(yup.string()),
    transporter: yup.object({
        carrier: yup.string().required(),
        driver: yup.string().required(),
        patent: yup.string()
    }),
    items: yup.array().of(yup.object({
        request: yup.string().nullable(true),
        requestItem: yup.string().nullable(true),
        observation: yup.string(),
        car: yup.object({
            _id: yup.string().required(),
            bl: yup.string(),
            client: yup.string()
        }).required(),
        destination: yup.string().required(),
        origin: yup.string().required()
    })).required()
});
exports.createTransmittalSchema = createTransmittalSchema;
//# sourceMappingURL=inputsSchema.js.map