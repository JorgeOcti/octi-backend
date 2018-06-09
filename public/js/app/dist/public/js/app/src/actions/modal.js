"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function loadDataAction(title, body, footer) {
    return {
        type: '/MODAL/LOAD_DATA',
        payload: {
            title: title,
            body: body,
            footer: footer
        }
    };
}
exports.loadDataAction = loadDataAction;
//# sourceMappingURL=modal.js.map