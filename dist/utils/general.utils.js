"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pug = require("pug");
class GeneralUtils {
    getObjectProperty(obj, attribute, defaultValue) {
        if (obj.hasOwnProperty(attribute)) {
            return obj[attribute];
        }
        else {
            return defaultValue;
        }
    }
    getFromEnviroment(name, defaultValue) {
        if (process.env.hasOwnProperty(name) && process.env[name]) {
            return process.env[name];
        }
        else {
            return defaultValue;
        }
    }
    generateHtmlFromPugFile(path, context) {
        const pugCompile = pug.compileFile(path);
        return pugCompile(context);
    }
    getFileFromRequest(files, name) {
        if (files && files.length) {
            return files.find((file) => file.fieldname === name);
        }
        return undefined;
    }
}
exports.default = new GeneralUtils();
//# sourceMappingURL=general.utils.js.map