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
        const { page, pageSize } = req.query;
        // options
        const options = {
            select: {
                password: false
            },
            page: parseInt(page ? page : 1),
            limit: parseInt(pageSize ? pageSize : 30),
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
            res.status(400).json({
                error: 'Hemos tenido un error al obtener los usuarios',
                status: 400
            });
        }
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
exports.default = new AdminController();
//# sourceMappingURL=admin.controller.js.map