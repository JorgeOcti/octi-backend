"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
const Raven = require("raven");
const app_1 = require("../app");
const general_utils_1 = require("../utils/general.utils");
class LoggerService {
    constructor() {
        this.message = '';
        this.env = general_utils_1.default.getFromEnviroment('ENV', 'development');
        // https://github.com/shiena/ansicolor/blob/master/README.md
        this.colors = {
            black: '\x1b[30m',
            brightBlack: '\x1b[90m',
            reset: '\x1b[0m',
            magenta: '\x1b[35m',
            green: '\x1b[32m',
            brighGreen: '\x1b[92m',
            yellow: '\x1b[33m',
            brighYellow: '\x1b[93m',
            blue: '\x1b[34m',
            brighBlue: '\x1b[94m',
            cyan: '\x1b[36m',
            brighCyan: '\x1b[96m',
            red: '\x1b[31m',
            brighRed: '\x1b[91m',
            white: '\x1b[37m',
            brighwhite: '\x1b[97m'
        };
    }
    info(message) {
        this.logger('INFO', 'production', message, this.colors.brightBlack);
        this.logger('INFO', 'development', message, this.colors.brightBlack);
    }
    /* istanbul ignore next */
    debug(message) {
        this.logger('DEBUG', 'development', message, this.colors.brighGreen, this.colors.brightBlack);
    }
    /* istanbul ignore next */
    error(message, propagate) {
        if (propagate) {
            Raven.captureException(new Error(this.message));
        }
        this.logger('ERROR', 'production', message, this.colors.brighRed);
        this.logger('ERROR', 'development', message, this.colors.brighRed);
    }
    /* istanbul ignore next */
    now() {
        // return moment();
        return moment().utc().format('DD/MMM/YYYY:HH:mm:ss ZZ');
    }
    /* istanbul ignore next */
    logger(type, env, message, color, textColor) {
        if (this.env === env) {
            this.message = message;
            if (!textColor) {
                textColor = this.colors.reset;
            }
            console.log(`${color}[${this.now()}] [${type}]:${textColor} ${this.message}${this.colors.reset}`);
            this.writeLog(type);
        }
    }
    /* istanbul ignore next */
    writeLog(type) {
        app_1.accessLogStream.write(`[${this.now()}] [${type}]: ${this.message} \n`);
    }
}
exports.default = new LoggerService();
//# sourceMappingURL=logger.service.js.map