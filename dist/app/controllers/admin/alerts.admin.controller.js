"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const alert_model_1 = require("../../models/alert.model");
const user_model_1 = require("../../models/user.model");
class AdminAlertsController {
    constructor() {
        this.index = this.index.bind(this);
        this.list = this.list.bind(this);
    }
    async index(req, res) {
        res.render('app/index', { token: await req.user.generateToken() });
    }
    async list(req, res) {
        const company = req.user.company;
        try {
            const alerts = await alert_model_1.default
                .find({ company })
                .populate([{
                    path: 'users',
                    select: ['firstName', 'lastName']
                }]);
            const users = await user_model_1.default
                .find({ company }, {
                firstName: 1,
                lastName: 1
            });
            res.json({
                alerts,
                users
            });
        }
        catch (e) {
            res.status(400).json({
                message: e,
                status: 400
            });
        }
    }
}
exports.default = new AdminAlertsController();
//# sourceMappingURL=alerts.admin.controller.js.map