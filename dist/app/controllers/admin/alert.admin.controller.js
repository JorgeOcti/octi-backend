"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const alert_model_1 = require("../../models/alert.model");
const user_model_1 = require("../../models/user.model");
class AdminAlertController {
    constructor() {
        this.index = this.index.bind(this);
        this.apiListAlerts = this.apiListAlerts.bind(this);
        this.apiCreateAlert = this.apiCreateAlert.bind(this);
        this.apiDeleteAlert = this.apiDeleteAlert.bind(this);
    }
    async index(req, res) {
        res.render('app/index', { token: await req.user.generateToken() });
    }
    async apiListAlerts(req, res) {
        const company = req.user.company;
        try {
            const alerts = await alert_model_1.default
                .find({
                company
            }, {
                name: 1,
                users: 1,
                lte: 1,
                gte: 1
            })
                .populate([{
                    path: 'users',
                    select: ['firstName', 'lastName', 'email']
                }])
                .sort({
                createdAt: -1
            });
            const users = await user_model_1.default
                .find({ company }, {
                firstName: 1,
                lastName: 1,
                email: 1
            });
            res.json({
                alerts,
                users
            });
        }
        catch (e) {
            /* istanbul ignore next */
            res.status(400).json({
                message: e,
                status: 400
            });
        }
    }
    async apiCreateAlert(req, res) {
        const { name, gte, lte, users } = req.body;
        const company = req.user.company;
        try {
            if (name && users && users.length) {
                const alert = await alert_model_1.default
                    .create({
                    name,
                    gte,
                    lte,
                    users,
                    company
                });
                res.status(201).json({
                    message: 'Alerta agregada satisfactoriamente',
                    alert: await alert_model_1.default
                        .findOne({ _id: alert._id, company }, {
                        name: 1,
                        users: 1,
                        lte: 1,
                        gte: 1
                    })
                        .populate([{
                            path: 'users',
                            select: ['firstName', 'lastName', 'email']
                        }])
                });
            }
            else {
                /* istanbul ignore next */
                res.status(400).json({
                    message: 'No se a podido crear a alerta'
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
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
            /* istanbul ignore next */
            res.status(500).json(e);
        }
    }
}
exports.default = new AdminAlertController();
//# sourceMappingURL=alert.admin.controller.js.map