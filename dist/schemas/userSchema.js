"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AJS = require("another-json-schema");
exports.userSchema = AJS('userSchema', {
    _id: {
        type: 'string',
        pattern: /^[0-9a-z]{24}$/,
        required: true
    },
    name: {
        type: 'string',
        pattern: /^[0-9a-z]{1,24}$/,
        _customErrorMsg: 'Nombre no válido'
    },
    age: {
        type: 'number',
        gte: 18,
        _customErrorMsg: 'Usuario no puede ser menor de edad'
    },
    option: {
        type: 'number',
        range: [1, 100]
    },
    gender: {
        type: 'string',
        enum: ['male', 'female'],
        _customErrorMsg: 'Esta opción no esta disponible'
    }
});
/*
const prueba = {
  _id: '5bbb7679cbe46580e77826d8',
  name: 'golang',
  age: 20,
  gender: 'man'
};
const validateUser = userSchema.validate(prueba);
if (!validateUser.valid) {
  console.log(validateUser);
  console.log(validateUser.valid);
  console.log(validateUser.error.expected._customErrorMsg);
}
* */
//# sourceMappingURL=userSchema.js.map