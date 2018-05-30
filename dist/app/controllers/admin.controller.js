"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../models/user.model");
class AdminController {
    constructor() {
        this.users = this.users.bind(this);
        this.apiUsers = this.apiUsers.bind(this);
    }
    async users(req, res) {
        res.render('app/index');
    }
    async apiUsers(req, res) {
        try {
            const users = await this.getUsers();
            res.json({
                users,
                status: 200
            });
        }
        catch (e) {
            res.status(400).json({
                error: 'Hemos tenido un error al obtener los usuarios',
                status: 400
            });
        }
    }
    getUsers() {
        return new Promise((resolve, reject) => {
            user_model_1.default
                .find({}, { password: false })
                .exec((err, users) => {
                if (err) {
                    return reject(err);
                }
                return resolve(users);
            });
        });
    }
}
exports.default = new AdminController();
//# sourceMappingURL=admin.controller.js.map