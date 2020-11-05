"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const region_model_1 = require("../../models/region.model");
const base_admin_controller_1 = require("./base.admin.controller");
class AdminRegionController extends base_admin_controller_1.default {
    constructor() {
        super(region_model_1.default);
        this.apiList = this.apiList.bind(this);
        this.apiCreate = this.apiCreate.bind(this);
        this.apiUpdate = this.apiUpdate.bind(this);
        this.apiDelete = this.apiDelete.bind(this);
    }
    async apiCreate(req, res) {
        const { name, code } = req.body;
        const { team } = req.user;
        req.context = {
            name: 'Región',
            data: { team, name, code },
            filter: { team, name }
        };
        super.apiCreate(req, res);
    }
    async apiUpdate(req, res) {
        const { id } = req.params;
        const { team } = req.user;
        const { name, code } = req.body;
        req.context = {
            name: 'Región',
            filter: { team, _id: id },
            data: { name, code },
            permissionRequired: 'changeRegion'
        };
        super.apiUpdate(req, res);
    }
    async apiDelete(req, res) {
        const { id } = req.params;
        const { team } = req.user;
        req.context = {
            name: 'Región',
            filter: { team, _id: id },
            permissionRequired: 'deleteRegion'
        };
        super.apiDelete(req, res);
    }
    async apiList(req, res) {
        this.paginateOptions = {
            select: {
                name: true,
                code: true
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