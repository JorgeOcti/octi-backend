"use strict";
exports.__esModule = true;
var pug = require("pug");
var GeneralUtils = /** @class */ (function () {
    function GeneralUtils() {
    }
    GeneralUtils.prototype.getObjectProperty = function (obj, attribute, defaultValue) {
        if (obj.hasOwnProperty(attribute)) {
            return obj[attribute];
        }
        else {
            return defaultValue;
        }
    };
    GeneralUtils.prototype.getFromEnviroment = function (name, defaultValue) {
        if (process.env.hasOwnProperty(name) && process.env[name]) {
            return process.env[name];
        }
        else {
            return defaultValue;
        }
    };
    GeneralUtils.prototype.generateHtmlFromPugFile = function (path, context) {
        var pugCompile = pug.compileFile(path);
        return pugCompile(context);
    };
    GeneralUtils.prototype.getFileFromRequest = function (files, name) {
        if (files && files.length) {
            return files.find(function (file) { return file.fieldname === name; });
        }
        return undefined;
    };
    return GeneralUtils;
}());
exports["default"] = new GeneralUtils();
//# sourceMappingURL=general.utils.js.map