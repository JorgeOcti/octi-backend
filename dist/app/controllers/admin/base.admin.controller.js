"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Raven = require("raven");
class BaseAdminController {
    constructor(instanceModel) {
        this.instanceModel = instanceModel;
        this.apiList = this.apiList.bind(this);
        this.apiCreate = this.apiCreate.bind(this);
        this.apiUpdate = this.apiUpdate.bind(this);
        this.apiDelete = this.apiDelete.bind(this);
        this.getDataPaginated = this.getDataPaginated.bind(this);
    }
    async index(req, res) {
        if (this.permissionRequired && !req.user.hasPermission(this.permissionRequired)) {
            res.status(403).render('403');
        }
        res.render('app/index', { token: await req.user.generateToken() });
    }
    async apiCreate(req, res) {
        if (this.permissionRequired && !req.user.hasPermission(this.permissionRequired)) {
            return res.status(403).json({
                message: 'No tienes permisos para esta operación'
            });
        }
        try {
            const existInstance = await this.instanceModel.find(this.filter);
            if (existInstance.length) {
                res.status(400).json({
                    message: `${this.name} ya existe.`,
                    status: 400
                });
            }
            else {
                const result = new this.instanceModel(this.data);
                await result.save();
                res.status(201).json({
                    message: `${this.name} creado/a satisfactoriamente.`,
                    result
                });
            }
        }
        catch (e) {
            /* istanbul ignore next  */
            Raven.captureException(e);
            res.status(500).json(e);
        }
    }
    async apiUpdate(req, res) {
        if (this.permissionRequired && !req.user.hasPermission(this.permissionRequired)) {
            return res.status(403).json({
                message: 'No tienes permisos para esta operación'
            });
        }
        const { id } = req.params;
        try {
            const result = await this.instanceModel
                .findOneAndUpdate(this.filter, this.data, {
                new: true
            });
            if (result) {
                res.status(200).json({
                    message: `${this.name} editado/a satisfactoriamente.`,
                    result
                });
            }
            else {
                res.status(400).json({
                    id,
                    message: `${this.name} no encontrado/a.`
                });
            }
        }
        catch (e) {
            /* istanbul ignore next  */
            Raven.captureException(e);
            res.status(500).json(e);
        }
    }
    async apiDelete(req, res) {
        if (this.permissionRequired && !req.user.hasPermission(this.permissionRequired)) {
            return res.status(403).json({
                message: 'No tienes permisos para esta operación'
            });
        }
        const { id } = req.params;
        try {
            const existInstance = await this.instanceModel.findOne(this.filter);
            if (!existInstance) {
                res.status(400).json({
                    message: `${this.name} no encontrado/a.`,
                    status: 400
                });
            }
            else {
                await existInstance.remove();
                res.status(200).json({
                    id,
                    message: `${this.name} eliminado/a satisfactoriamente.`
                });
            }
        }
        catch (e) {
            /* istanbul ignore next  */
            Raven.captureException(e);
            res.status(500).json(e);
        }
    }
    async apiList(req, res) {
        const { page, pageSize } = req.query;
        // paginate options
        this.paginateOptions = {
            ...this.paginateOptions,
            page: parseInt(page ? page : 1, 10),
            limit: parseInt(pageSize ? pageSize : 20, 10)
        };
        try {
            const data = await this.getDataPaginated({
                filter: this.filter
            });
            // validate exist page
            /* istanbul ignore if  */
            if (this.paginateOptions.page && data.pages && data.pages < this.paginateOptions.page) {
                res.status(404).json({
                    message: 'La página solicitada no existe.',
                    status: 404
                });
            }
            else {
                res.json({
                    count: data.total,
                    pages: data.pages,
                    hasPrevious: this.paginateOptions.page && this.paginateOptions.page > 1 && data.pages && data.pages >= this.paginateOptions.page,
                    hasNext: this.paginateOptions.page && data.pages && data.pages > this.paginateOptions.page,
                    results: data.docs,
                    status: 200
                });
            }
        }
        catch (e) {
            /* istanbul ignore next  */
            Raven.captureException(e);
            res.status(500).json(e);
        }
    }
    getDataPaginated({ filter }) {
        return new Promise(async (resolve, reject) => {
            try {
                resolve(await this.instanceModel.paginate(filter, this.paginateOptions));
            }
            catch (e) {
                /* istanbul ignore next  */
                reject(e);
            }
        });
    }
}
exports.default = BaseAdminController;
//# sourceMappingURL=base.admin.controller.js.map