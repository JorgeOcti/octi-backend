"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var redux_1 = require("redux");
var redux_debounced_1 = require("redux-debounced");
var redux_devtools_extension_1 = require("redux-devtools-extension");
var redux_logger_1 = require("redux-logger");
var redux_thunk_1 = require("redux-thunk");
var _1 = require("../reducers/");
var configureStore = function () {
    var enhancers;
    var middlewares = [];
    if (process.env.NODE_ENV === 'development') {
        middlewares.push(redux_thunk_1.default);
        middlewares.push(redux_logger_1.default);
        middlewares.push(redux_debounced_1.default());
        enhancers = redux_devtools_extension_1.composeWithDevTools(redux_1.applyMiddleware.apply(void 0, middlewares));
    }
    else {
        middlewares.push(redux_thunk_1.default);
        middlewares.push(redux_debounced_1.default());
        enhancers = redux_1.applyMiddleware.apply(void 0, middlewares);
    }
    return redux_1.createStore(_1.default, enhancers);
};
exports.default = configureStore;
//# sourceMappingURL=configureStore.js.map