"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AdminCarsController {
    constructor() {
        this.index = this.index.bind(this);
    }
    async index(req, res) {
        res.render('app/index');
    }
}
exports.default = new AdminCarsController();
//# sourceMappingURL=car.admin.controller.js.map