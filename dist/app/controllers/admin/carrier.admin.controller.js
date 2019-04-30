"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const carrier_model_1 = require("../../models/carrier.model");
const base_admin_controller_1 = require("./base.admin.controller");
class AdminCarrierController extends base_admin_controller_1.default {
    constructor() {
        super(carrier_model_1.default);
        this.apiList = this.apiList.bind(this);
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
        this.filter = {};
        super.apiList(req, res);
    }
}
exports.default = new AdminCarrierController();
//# sourceMappingURL=carrier.admin.controller.js.map