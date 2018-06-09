"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var redux_1 = require("redux");
var users_1 = require("./users");
var modal_1 = require("./modal");
var dashboard_1 = require("./dashboard");
exports.default = redux_1.combineReducers({
    users: users_1.users,
    modal: modal_1.modal,
    dashboard: dashboard_1.dashboard
});
//# sourceMappingURL=index.js.map