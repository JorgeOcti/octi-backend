"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const permision_model_1 = require("../../models/permision.model");
class AdminPermissionController {
    constructor() {
        this.index = this.index.bind(this);
        this.apiListPermissions = this.apiListPermissions.bind(this);
    }
    /* istanbul ignore next */
    async index(req, res) {
        res.render('app/index', { token: await req.user.generateToken() });
    }
    async apiListPermissions(req, res) {
        // if (!req.user.hasPermission('viewCar')) {
        //   return res.status(403).json({
        //     message: 'No tienes permisos para esta operación'
        //   });
        // }
        const { page, pageSize, search } = req.query;
        // paginate options
        const options = {
            select: {
                name: true,
                codeName: true
            },
            sort: {
                name: 1
            },
            page: parseInt(page ? page : 1, 10),
            limit: parseInt(pageSize ? pageSize : 20, 10)
        };
        try {
            const permissions = await this.getPermissions(options, search);
            // validate exist page
            /* istanbul ignore if */
            if (options.page && permissions.pages && permissions.pages < options.page) {
                res.status(400).json({
                    error: 'La página solicitada no existe.',
                    status: 200
                });
            }
            else {
                res.json({
                    count: permissions.total,
                    pages: permissions.pages,
                    hasPrevious: options.page && options.page > 1 && permissions.pages && permissions.pages >= options.page,
                    hasNext: options.page && permissions.pages && permissions.pages > options.page,
                    results: permissions.docs,
                    status: 200
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            if (e) {
                res.status(500).json(e);
            }
        }
    }
    getPermissions(options, search) {
        return new Promise((resolve, reject) => {
            permision_model_1.default.paginate({}, options, (err, result) => {
                /* istanbul ignore next */
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
}
exports.default = new AdminPermissionController();
//# sourceMappingURL=permission.admin.controller.js.map