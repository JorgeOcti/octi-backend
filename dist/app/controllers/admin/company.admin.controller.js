"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const general_utils_1 = require("../../../utils/general.utils");
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
        if (req.user.hasPermission('viewCompany')) {
            res.render('app/index', { token: await req.user.generateToken() });
        }
        else {
            res.status(403).render('403');
        }
    }
    async apiListCompanies(req, res) {
        if (!req.user.hasPermission('viewCompany') && !req.user.hasPermission('viewUser')) {
            return res.status(403).json({
                message: 'No tienes permisos para esta operación'
            });
        }
        const team = req.user.team._id;
        const { page, pageSize, search } = req.query;
        // paginate options
        const options = {
            // select: {
            //   name: true,
            //   image: true,
            //   updatedAt: true,
            //   createdAt: true
            // },
            sort: {
                name: 1
            },
            page: parseInt(page ? page : "1", 10),
            limit: parseInt(pageSize ? pageSize : "20", 10)
        };
        const companies = await this.getCompanies({
            deleted: false,
            team
        }, options, search);
        /* istanbul ignore if  */
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
        if (!req.user.hasPermission('addCompany')) {
            return res.status(403).json({
                message: 'No tienes permisos para esta operación'
            });
        }
        const { name, billing, notifications } = req.body;
        const team = req.user.team;
        const image = general_utils_1.default.getFileFromRequest(req.files, 'image');
        const marker = general_utils_1.default.getFileFromRequest(req.files, 'marker');
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
                const newCompany = new company_model_1.default({
                    name,
                    billing: JSON.parse(billing),
                    notifications: JSON.parse(notifications),
                    team
                });
                if (image) {
                    image.headers = {
                        'Content-Type': image.mimetype
                    };
                    image.team = team._id;
                    await newCompany.attach('image', image);
                }
                if (marker) {
                    marker.headers = {
                        'Content-Type': marker.mimetype
                    };
                    marker.team = team._id;
                    await newCompany.attach('marker', marker);
                }
                await newCompany.save();
                res.status(201).json({
                    message: 'Empresa creada satisfactoriamente.',
                    company: newCompany
                });
            }
        }
        catch (e) {
            /* istanbul ignore next  */
            console.log(e);
            /* istanbul ignore next  */
            res.status(500).json(e);
        }
    }
    async apiUpdateCompany(req, res) {
        if (!req.user.hasPermission('changeCompany')) {
            return res.status(403).json({
                message: 'No tienes permisos para esta operación'
            });
        }
        const { id } = req.params;
        const team = req.user.team;
        const { name, billing, notifications } = req.body;
        const image = general_utils_1.default.getFileFromRequest(req.files, 'image');
        const marker = general_utils_1.default.getFileFromRequest(req.files, 'marker');
        if (!name || !name.length) {
            res.status(400).json({
                message: 'The name is are required',
                status: 400
            });
        }
        try {
            const company = await company_model_1.default.findOne({
                _id: id,
                team
            });
            if (company) {
                company.name = name;
                company.billing = JSON.parse(billing);
                company.notifications = JSON.parse(notifications);
                if (image) {
                    image.headers = {
                        'Content-Type': image.mimetype
                    };
                    image.team = team._id;
                    await company.attach('image', image);
                    await company.update({ image: company.image });
                }
                if (marker) {
                    marker.headers = {
                        'Content-Type': marker.mimetype
                    };
                    marker.team = team._id;
                    await company.attach('marker', marker);
                    await company.update({ marker: company.marker });
                }
                await company.save();
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
            /* istanbul ignore next  */
            console.log(e);
            /* istanbul ignore next  */
            res.status(500).json(e);
        }
    }
    async apiDeleteCompany(req, res) {
        if (!req.user.hasPermission('deleteCompany')) {
            return res.status(403).json({
                message: 'No tienes permisos para esta operación'
            });
        }
        const { id } = req.params;
        const team = req.user.team._id;
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
            /* istanbul ignore next  */
            res.status(500).json(e);
        }
    }
    getCompanies(filter, options, search) {
        return new Promise((resolve, reject) => {
            company_model_1.default.paginate(filter, options, (err, result) => {
                /* istanbul ignore next  */
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