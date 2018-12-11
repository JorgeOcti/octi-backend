"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GeneralUtils {
    getObjectAttribute(obj, attribute, defaultValue) {
        if (obj.hasOwnProperty(attribute)) {
            return obj[attribute];
        }
        else {
            return defaultValue;
        }
    }
}
exports.default = new GeneralUtils();
//# sourceMappingURL=general.utils.js.map