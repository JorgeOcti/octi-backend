"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird = require("bluebird");
const mongoose = require("mongoose");
const app_1 = require("./app");
const logger_1 = require("./services/logger");
// Mongoose setting
const MONGODB_URI = process.env.MONGODB_URI || '';
// Mongoose connect
mongoose.connect(MONGODB_URI, { useMongoClient: true }, (err) => {
    if (err) {
        console.log('Unable to connect to the mongodb instance. Error: ', err);
        // throw err;
    }
    /* istanbul ignore if */
    if (app_1.default.get('env') !== 'testing') {
        console.log('Mongoose Successfully connected');
    }
});
mongoose.Promise = bluebird;
// mongoose.Promise = global.Promise;
mongoose.set('debug', app_1.default.get('env') !== 'testing');
// mongoose.set('debug', false);
const server = app_1.default.listen(app_1.default.get('port'), () => {
    /* istanbul ignore if */
    if (app_1.default.get('env') !== 'testing') {
        console.log(`${logger_1.default.colors.magenta}----------------------${logger_1.default.colors.reset}`);
        console.log(`${logger_1.default.colors.brighCyan}OSA-ANDES ${logger_1.default.colors.white}v1.0.0 ${logger_1.default.colors.brighGreen}RELEASE${logger_1.default.colors.reset}`);
        console.log(`${logger_1.default.colors.magenta}----------------------${logger_1.default.colors.reset}`);
        console.log('is running at http://localhost:%s in %s mode', app_1.default.get('port'), app_1.default.get('env'));
        console.log(`${logger_1.default.colors.brightBlack}Press CTRL-C to stop${logger_1.default.colors.reset}`);
    }
});
exports.default = server;
//# sourceMappingURL=server.js.map