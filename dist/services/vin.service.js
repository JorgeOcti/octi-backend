"use strict";
exports.__esModule = true;
var general_utils_1 = require("../utils/general.utils");
var countries_1 = require("./data/countries");
var manufacters_1 = require("./data/manufacters");
var years_1 = require("./data/years");
var VINService = /** @class */ (function () {
    function VINService() {
        this.INDEXES = {
            MADE_IN_START: 0,
            MADE_IN_END: 2,
            MANUFACTURER_START: 0,
            MANUFACTURER_END: 3,
            DETAILS_START: 3,
            DETAILS_END: 8,
            SECURITY_CODE: 8,
            YEAR: 9,
            ASSEMBLY_PLANT: 10,
            SERIAL_NUMBER_START: 11
        };
        this.manufacturers = manufacters_1["default"];
        this.years = years_1["default"];
        this.countries = countries_1["default"];
    }
    VINService.prototype.decode = function (vin) {
        /* istanbul ignore else */
        if (vin && vin.length > 12) {
            var codeValues = this.split(vin);
            return {
                serialNumber: codeValues.serialNumber,
                securityCode: codeValues.securityCode,
                year: this.getYear(codeValues.year),
                country: this.getCountry(codeValues.madeIn),
                details: codeValues.details,
                manufacturer: this.getManufacturer(codeValues.manufacturer)
            };
        }
        else {
            return 'Este VIN no ha podido ser procesado. =(';
        }
    };
    VINService.prototype.split = function (vin) {
        return {
            madeIn: vin.substring(this.INDEXES.MADE_IN_START, this.INDEXES.MADE_IN_END),
            manufacturer: vin.substring(this.INDEXES.MANUFACTURER_START, this.INDEXES.MANUFACTURER_END),
            details: vin.substring(this.INDEXES.DETAILS_START, this.INDEXES.DETAILS_END),
            securityCode: vin.charAt(this.INDEXES.SECURITY_CODE),
            year: vin.charAt(this.INDEXES.YEAR),
            assemblyPlant: vin.charAt(this.INDEXES.ASSEMBLY_PLANT),
            serialNumber: vin.substring(this.INDEXES.SERIAL_NUMBER_START)
        };
    };
    VINService.prototype.getManufacturer = function (code) {
        return general_utils_1["default"].getObjectProperty(this.manufacturers, 'code', '');
    };
    VINService.prototype.getYear = function (code) {
        return general_utils_1["default"].getObjectProperty(this.years, 'code', '');
    };
    VINService.prototype.getCountry = function (code) {
        return general_utils_1["default"].getObjectProperty(this.countries, 'code', '');
    };
    return VINService;
}());
exports["default"] = new VINService();
//# sourceMappingURL=vin.service.js.map