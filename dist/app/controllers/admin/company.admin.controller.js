"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const company_model_1 = require("../../models/company.model");
class AdminCompaniesController {
    constructor() {
        this.index = this.index.bind(this);
        this.getCompanies = this.getCompanies.bind(this);
        this.apiCompanies = this.apiCompanies.bind(this);
    }
    async index(req, res) {
        // if (req.user.hasPermission('viewCompanies')) {
        res.render('app/index', { token: await req.user.generateToken() });
        // } else {
        //   res.status(403).render('403');
        // }
    }
    async apiCompanies(req, res) {
        const { team } = req.user;
        const { page, pageSize, search } = req.query;
        // paginate options
        const options = {
            select: {
                name: true,
                updatedAt: true,
                createdAt: true
            },
            sort: {
                name: 1
            },
            page: parseInt(page ? page : 1, 10),
            limit: parseInt(pageSize ? pageSize : 20, 10)
        };
        const companies = await this.getCompanies({
            // delete: false,
            team
        }, options, search);
        if (options.page && companies.pages && companies.pages < options.page) {
            res.status(400).json({
                error: 'La página solicitada no existe.',
                status: 200
            });
        }
        else {
            res.json({
                count: companies.total,
                pages: companies.pages,
                hasPrevious: options.page && options.page > 1 && companies.pages && companies.pages >= options.page,
                hasNext: options.page && companies.pages && companies.pages > options.page,
                results: companies.docs,
                status: 200
            });
        }
    }
    getCompanies(filter, options, search) {
        return new Promise((resolve, reject) => {
            company_model_1.default.paginate(filter, options, (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
}
exports.default = new AdminCompaniesController();
//# sourceMappingURL=company.admin.controller.js.map