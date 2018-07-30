"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const company_model_1 = require("../../models/company.model");
class AdminCompaniesController {
    constructor() {
        this.index = this.index.bind(this);
        this.getCompanies = this.getCompanies.bind(this);
    }
    index(req, res) {
    }
    getCompanies() {
        return new Promise((resolve, reject) => {
            company_model_1.default.find({}, (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
}
exports.default = new AdminCompaniesController();
//# sourceMappingURL=companies.admin.controller.js.map