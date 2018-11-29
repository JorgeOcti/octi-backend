"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const company_model_1 = require("../../models/company.model");
class AdminCompaniesController {
    constructor() {
        this.index = this.index.bind(this);
        this.getCompanies = this.getCompanies.bind(this);
        this.apiListCompanies = this.apiListCompanies.bind(this);
        this.apiCreateCompany = this.apiCreateCompany.bind(this);
        this.apiUpdateCompany = this.apiUpdateCompany.bind(this);
        this.apiDeleteCompany = this.apiDeleteCompany.bind(this);
    }
    async index(req, res) {
        // if (req.user.hasPermission('viewCompanies')) {
        res.render('app/index', { token: await req.user.generateToken() });
        // } else {
        //   res.status(403).render('403');
        // }
    }
    async apiListCompanies(req, res) {
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
            deleted: false,
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
    async apiCreateCompany(req, res) {
        /*if (!req.user.hasPermission('addCompany')) {
          return res.status(403).json({
            message: 'No tienes permisos para esta operación'
          });
        }*/
        const { name } = req.body;
        const { team } = req.user;
        if (!name || !name.trim().length) {
            res.status(400).json({
                message: 'El nombre es requerido.',
                status: 400
            });
        }
        try {
            const existCompany = await company_model_1.default.find({
                name,
                team,
                deleted: false
            });
            if (existCompany.length) {
                res.status(400).json({
                    message: 'Empresa ya existe.',
                    status: 400
                });
            }
            else {
                const newCompany = await new company_model_1.default({
                    name,
                    team
                }).save();
                res.status(201).json({
                    message: 'Empresa agregada satisfactoriamente.',
                    company: newCompany
                });
            }
        }
        catch (e) {
            console.log(e);
            res.status(500).json(e);
        }
    }
    async apiUpdateCompany(req, res) {
        // if (!req.user.hasPermission('changeCompany')) {
        //   return res.status(403).json({
        //     message: 'No tienes permisos para esta operación'
        //   });
        // }
        const { id } = req.params;
        const { team } = req.user;
        const { name } = req.body;
        if (!name || !name.length) {
            res.status(400).json({
                message: 'The name is are required',
                status: 400
            });
        }
        try {
            const company = await company_model_1.default.findOneAndUpdate({
                _id: id,
                team
            }, {
                name
            }, {
                new: true
            });
            if (company) {
                const response = {
                    message: 'Empresa editada satisfactoriamente.',
                    company
                };
                res.status(200).json(response);
            }
            else {
                const response = {
                    id,
                    message: 'Empresa no encontrada'
                };
                res.status(400).json(response);
            }
        }
        catch (e) {
            console.log(e);
            res.status(500).json(e);
        }
    }
    async apiDeleteCompany(req, res) {
        // if (!req.user.hasPermission('deleteCompany')) {
        //   return res.status(403).json({
        //     message: 'No tienes permisos para esta operación'
        //   });
        // }
        const { id } = req.params;
        const { team } = req.user;
        try {
            const company = await company_model_1.default.findOneAndUpdate({
                _id: id,
                team
            }, {
                deleted: true
            }, {
                new: true
            });
            if (company) {
                const response = {
                    message: 'Empresa eliminada satisfactoriamente.',
                    company
                };
                res.status(200).json(response);
            }
            else {
                const response = {
                    id,
                    message: 'Empresa no encontrada'
                };
                res.status(200).json(response);
            }
        }
        catch (e) {
            res.status(500).json(e);
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