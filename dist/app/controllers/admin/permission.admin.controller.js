"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const permision_model_1 = require("../../models/permision.model");
const base_admin_controller_1 = require("./base.admin.controller");
class AdminPermissionController extends base_admin_controller_1.default {
    constructor() {
        super(permision_model_1.default);
        this.apiList = this.apiList.bind(this);
    }
    async apiList(req, res) {
        this.paginateOptions = {
            select: {
                name: true,
                codeName: true
            },
            sort: {
                name: 1
            }
        };
        let filter = {};
        if (req.user.hasPermission('changeTeamPermissions') && !req.user.isAdmin)
            filter = {
                _id: { $in: req.user.userPermissions }
            };
        req.context = {
            filter
        };
        super.apiList(req, res);
    }
}
exports.default = new AdminPermissionController();
//# sourceMappingURL=permission.admin.controller.js.map