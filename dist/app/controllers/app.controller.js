"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AppController {
    constructor() {
        this.index = this.index.bind(this);
    }
    index(req, res) {
        res.render('app/index', { title: 'Hey', message: 'Hello there!' });
    }
}
exports.default = new AppController();
//# sourceMappingURL=app.controller.js.map