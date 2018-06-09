"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var initialState = {
    loading: true,
    source: null,
    cars: [],
};
function dashboard(state, action) {
    if (state === void 0) { state = initialState; }
    switch (action.type) {
        case '/DASHBOARD/IS_LOADING':
            return __assign({}, state, { loading: action.payload.loading });
        case '/DASHBOARD/LOAD_CARS':
            return __assign({}, state, { cars: action.payload.cars });
        case '/DASHBOARD/CANCEL_REQUEST':
            return __assign({}, state, { source: action.payload.source });
        default:
            return state;
    }
}
exports.dashboard = dashboard;
//# sourceMappingURL=dashboard.js.map