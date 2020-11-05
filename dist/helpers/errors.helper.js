"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebError = exports.APIError = void 0;
// import * as Raven from 'raven';
/**
 * @extends Error
 */
class ExtendableError extends Error {
    constructor(message, status) {
        super(message);
        this.name = this.constructor.name;
        this.message = message;
        this.status = status;
        Error.captureStackTrace(this);
    }
}
/**
 * Class representing an API error.
 * @extends ExtendableError
 */
class APIError extends ExtendableError {
    /**
     * Creates an API error.
     * @param {string} message - Error message.
     * @param {number} status - HTTP status code of error.
     */
    constructor(message, status = 500) {
        super(message, status);
        this.name = this.constructor.name;
    }
}
exports.APIError = APIError;
/**
 * Class representing an Web error.
 * @extends ExtendableError
 */
class WebError extends ExtendableError {
    /**
     * Creates an API error.
     * @param {string} message - Error message.
     * @param {number} status - HTTP status code of error.
     */
    constructor(message, status = 500) {
        super(message, status);
        this.name = this.constructor.name;
    }
}
exports.WebError = WebError;
//# sourceMappingURL=errors.helper.js.map