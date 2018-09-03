"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class InventoryController {
    constructor() {
        this.index = this.index.bind(this);
    }
    async index(req, res) {
        res.render('app/index', { token: await req.user.generateToken() });
    }
}
exports.default = new InventoryController();
//# sourceMappingURL=inventory.controller.js.map