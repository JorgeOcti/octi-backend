"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
}
exports.default = new GeneralUtils();
//# sourceMappingURL=general.utils.js.map