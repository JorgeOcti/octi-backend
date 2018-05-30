"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../models/user.model");
class AdminUsersController {
    constructor() {
        this.users = this.users.bind(this);
        this.apiUsers = this.apiUsers.bind(this);
        this.apiDeleteUser = this.apiDeleteUser.bind(this);
    }
    async users(req, res) {
        res.render('app/index');
    }
    async apiUsers(req, res) {
        const { page, pageSize } = req.query;
        // paginate options
        const options = {
            select: {
                password: false
            },
            sort: {
                createdAt: -1
            },
            page: parseInt(page ? page : 1),
            limit: parseInt(pageSize ? pageSize : 20),
        };
        try {
            const users = await this.getUsers(options);
            // validate exist page
            if (options.page && users.pages && users.pages < options.page) {
                res.status(400).json({
                    error: 'La página solicitada no existe.',
                    status: 200,
                });
            }
            else {
                res.json({
                    count: users.total,
                    pages: users.pages,
                    hasPrevious: options.page && users.pages && users.pages <= options.page,
                    hasNext: options.page && users.pages && users.pages > options.page,
                    results: users.docs,
                    status: 200,
                });
            }
        }
        catch (e) {
            if (e)
                res.status(500).send(e);
        }
    }
    apiDeleteUser(req, res) {
        const { id } = req.params;
        user_model_1.default.findByIdAndRemove(id, (err, user) => {
            // As always, handle any potential errors:
            if (err)
                res.status(500).send(err);
            if (user) {
                const response = {
                    message: "Usuario eliminado satisfactoriamente.",
                    id: user._id
                };
                res.status(200).send(response);
            }
            else {
                const response = {
                    message: "Este usuario ya fue eliminado.",
                    id: id
                };
                res.status(200).send(response);
            }
        });
    }
    getUsers(options) {
        return new Promise((resolve, reject) => {
            user_model_1.default.paginate({}, options, (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
}
exports.default = new AdminUsersController();
//# sourceMappingURL=adminUsers.controller.js.map