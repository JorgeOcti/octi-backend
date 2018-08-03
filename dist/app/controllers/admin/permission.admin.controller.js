"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const permision_model_1 = require("../../models/permision.model");
class AdminPermissionController {
    constructor() {
        this.index = this.index.bind(this);
    }
    async index(req, res) {
        await this.getPermissions({});
        res.render('app/index', { token: await req.user.generateToken() });
    }
    getPermissions(options, search) {
        let filter = {};
        if (search && search.length) {
            const searchText = new RegExp(search, 'i');
            filter = {
                $and: [{
                        $or: [{
                                vin: { $regex: searchText }
                            }, {
                                brand: { $regex: searchText }
                            }, {
                                denomination: { $regex: searchText }
                            }, {
                                color: { $regex: searchText }
                            }]
                    },
                    filter
                ]
            };
            // filter = {
            //   $text: { $search: search }, company
            // };
            /* {score: {$meta: "toextScore"} */
        }
        return new Promise((resolve, reject) => {
            permision_model_1.default.paginate(filter, options, (err, result) => {
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