"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
var bluebird = require("bluebird");
var MONGODB_URI = process.env.MONGODB_URI || '';
// Mongoose connect
mongoose.Promise = bluebird;
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true }, function (err) {
    if (err) {
        /* istanbul ignore next */
        console.log('Unable to connect to the mongodb instance. Error: ', err);
        throw err;
    }
});
mongoose.set('debug', true);
exports["default"] = mongoose;
//# sourceMappingURL=mongoRaw.js.map