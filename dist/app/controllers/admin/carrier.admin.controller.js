"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const carrier_model_1 = require("../../models/carrier.model");
const base_admin_controller_1 = require("./base.admin.controller");
class AdminCarrierController extends base_admin_controller_1.default {
    constructor() {
        super(carrier_model_1.default);
        this.index = this.index.bind(this);
        this.apiCreate = this.apiCreate.bind(this);
        this.apiList = this.apiList.bind(this);
        this.apiUpdate = this.apiUpdate.bind(this);
        this.apiDelete = this.apiDelete.bind(this);
    }
    async index(req, res) {
        req.context = {
            permissionRequired: 'viewCarrier'
        };
        super.index(req, res);
    }
    async apiCreate(req, res) {
        const { name } = req.body;
        const { team } = req.user;
        req.context = {
            name: 'Transportista',
            filter: { team, name },
            data: { team, name },
            permissionRequired: 'addCarrier'
        };
        super.apiCreate(req, res);
    }
    async apiUpdate(req, res) {
        const { id } = req.params;
        const { team } = req.user;
        const { name } = req.body;
        req.context = {
            name: 'Transportista',
            filter: { team, _id: id },
            data: { name },
            permissionRequired: 'changeCarrier'
        };
        super.apiUpdate(req, res);
    }
    async apiDelete(req, res) {
        const { id } = req.params;
        const { team } = req.user;
        req.context = {
            name: 'Transportista',
            filter: { team, _id: id },
            permissionRequired: 'deleteCarrier'
        };
        super.apiDelete(req, res);
    }
    async apiList(req, res) {
        const { team } = req.user;
        this.paginateOptions = {
            select: {
                name: true
            },
            sort: {
                name: 1
            }
        };
        req.context = {
            filter: { team }
        };
        super.apiList(req, res);
    }
}
exports.default = new AdminCarrierController();
//# sourceMappingURL=carrier.admin.controller.js.map