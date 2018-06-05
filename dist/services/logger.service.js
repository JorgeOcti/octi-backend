"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
const Raven = require("raven");
const app_1 = require("../app");
class LoggerService {
    constructor() {
        this.message = '';
        this.env = process.env.ENV || 'development';
        // https://github.com/shiena/ansicolor/blob/master/README.md
        this.colors = {
            brightBlack: '\x1b[90m',
            reset: '\x1b[0m',
            magenta: '\x1b[35m',
            green: '\x1b[32m',
            brighGreen: '\x1b[92m',
            yellow: '\x1b[33m',
            brighYellow: '\x1b[93m',
            blue: '\x1b[34m',
            cyan: '\x1b[36m',
            brighCyan: '\x1b[96m',
            red: '\x1b[31m',
            brighRed: '\x1b[91m',
            white: '\x1b[37m'
        };
    }
    info(message) {
        this.logger('INFO', 'production', message);
        this.logger('INFO', 'development', message);
    }
    /* istanbul ignore next */
    debbug(message) {
        this.logger('DEBUG', 'development', message);
    }
    /* istanbul ignore next */
    error(message) {
        this.message = message;
        Raven.captureException(new Error(this.message));
        console.log(`${this.colors.red}ERROR $\{this.colors.brightBlack}${this.now()}: ${this.colors.reset} ${message}${this.colors.reset}`);
        this.writeLog('ERROR');
    }
    /* istanbul ignore next */
    now() {
        return moment();
    }
    /* istanbul ignore next */
    logger(type, env, message) {
        if (this.env === env) {
            this.message = message;
            console.log(`${this.colors.brightBlack}${type} ${this.now()}:${this.colors.reset} ${this.message}`);
            this.writeLog(type);
        }
    }
    /* istanbul ignore next */
    writeLog(type) {
        app_1.accessLogStream.write(`${type} [${this.now()}] ${this.message} \n`);
    }
}
exports.default = new LoggerService();
//# sourceMappingURL=logger.service.js.map