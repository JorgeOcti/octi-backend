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
    users: [],
    venues: [],
    loading: true,
    tempUser: {
        _id: '',
        firstName: '',
        lastName: '',
        email: '',
        venue: ''
    },
    source: null,
    pagination: {
        count: 0,
        page: 1,
        pages: 1
    },
};
function users(state, action) {
    if (state === void 0) { state = initialState; }
    switch (action.type) {
        case '/USERS/IS_LOADING':
            return __assign({}, state, { loading: action.payload.loading });
        case '/USERS/LOAD_VENUES':
            return __assign({}, state, { venues: action.payload.venues });
        case '/USERS/CHANGE_TEMP_USER':
            return __assign({}, state, { tempUser: action.payload.user });
        case '/USERS/CHANGE_USER':
            return __assign({}, state, { users: state.users.map(function (user) { return (user._id === action.payload.user._id ? action.payload.user : user); }) });
        case '/USERS/LOAD_USERS':
            return __assign({}, state, { users: action.payload.users, pagination: __assign({}, state.pagination, { pages: action.payload.pages, count: action.payload.count }) });
        case '/USERS/CANCEL_REQUEST':
            return __assign({}, state, { source: action.payload.source });
        case '/USERS/DELETE_USER':
            return __assign({}, state, { users: state.users.filter(function (user) { return user._id !== action.payload.id; }) });
        case '/USERS/CHANGE_PAGE':
            return __assign({}, state, { pagination: __assign({}, state.pagination, { page: action.payload.page }) });
        default:
            return state;
    }
}
exports.users = users;
//# sourceMappingURL=users.js.map