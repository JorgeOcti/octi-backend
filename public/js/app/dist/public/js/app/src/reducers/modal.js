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
    title: '',
    body: null,
    footer: null
};
function modal(state, action) {
    if (state === void 0) { state = initialState; }
    switch (action.type) {
        case '/MODAL/LOAD_DATA':
            setTimeout(function () {
                $('#andesModal').modal('show');
            }, 100);
            return __assign({}, state, { title: action.payload.title, body: action.payload.body, footer: action.payload.footer });
        case '/MODAL/CLEAR':
            return initialState;
        default:
            return state;
    }
}
exports.modal = modal;
//# sourceMappingURL=modal.js.map