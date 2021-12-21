"use strict";
var _a;
exports.__esModule = true;
exports.createRequestSalfaParams = void 0;
var yup = require("yup");
var createRequestSalfaParams = yup.object().shape((_a = {
        brand: yup.string().required(),
        denomination: yup.string().required(),
        material: yup.string().required(),
        sellerText: yup.string().required()
    },
    _a['5bf2de35caf8ef7096105c21'] = yup.string().required(),
    _a['5bf2de35caf8ef7096105c22'] = yup.string().required(),
    _a['60b9232164adc90013a79b45'] = yup.string(),
    _a['conectaID'] = yup.string().required(),
    _a));
exports.createRequestSalfaParams = createRequestSalfaParams;
//# sourceMappingURL=inputsSchema.js.map