"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const region_model_1 = require("../../models/region.model");
const base_admin_controller_1 = require("./base.admin.controller");
class AdminRegionController extends base_admin_controller_1.default {
    constructor() {
        super(region_model_1.default);
        this.apiList = this.apiList.bind(this);
    }
    async apiCreate(req, res) {
        const { name } = req.body;
        const { team } = req.user;
        req.context = {
            name: 'Region',
            filter: { team, name }
        };
        super.apiCreate(req, res);
    }
    async apiList(req, res) {
        this.paginateOptions = {
            select: {
                name: true
            },
            sort: {
                name: 1
            }
        };
        super.apiList(req, res);
    }
}
exports.default = new AdminRegionController();
//# sourceMappingURL=region.admin.controller.js.map