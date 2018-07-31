"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const alert_model_1 = require("../../models/alert.model");
const user_model_1 = require("../../models/user.model");
class AdminAlertsController {
    constructor() {
        this.index = this.index.bind(this);
        this.apiListAlerts = this.apiListAlerts.bind(this);
        this.apiDeleteAlert = this.apiDeleteAlert.bind(this);
    }
    async index(req, res) {
        res.render('app/index', { token: await req.user.generateToken() });
    }
    async apiListAlerts(req, res) {
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
    async apiDeleteAlert(req, res) {
        const { id } = req.params;
        const company = req.user.company;
        try {
            const alert = await alert_model_1.default.findOneAndRemove({ _id: id, company });
            if (alert) {
                const response = {
                    message: 'Alerta eliminada satisfactoriamente.',
                    id: alert._id
                };
                res.status(200).json(response);
            }
            else {
                const response = {
                    id,
                    message: 'Esta alerta ya fue eliminada.'
                };
                res.status(200).json(response);
            }
        }
        catch (e) {
            res.status(500).json(e);
        }
    }
}
exports.default = new AdminAlertsController();
//# sourceMappingURL=alerts.admin.controller.js.map