"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("../../server");
const inventoryLabel_model_1 = require("../models/inventoryLabel.model");
const teamSetting_model_1 = require("../../app/models/teamSetting.model");
class LabelController {
    constructor() {
        this.index = this.index.bind(this);
        this.apiList = this.apiList.bind(this);
        this.apiUpdateLabel = this.apiUpdateLabel.bind(this);
    }
    async index(req, res) {
        res.render('app/index', { token: await req.user.generateToken() });
    }
    async apiList(req, res) {
        const team = req.user.team._id;
        const { page, pageSize } = req.query;
        // paginate options
        const options = {
            sort: {
                createdAt: -1
            },
            page: parseInt(page ? page : "1", 10),
            limit: parseInt(pageSize ? pageSize : "20", 10)
        };
        try {
            const labels = await this.getLabels({
                team
            }, options);
            /* istanbul ignore if  */
            if (options.page && labels.pages && labels.pages < options.page) {
                res.status(400).json({
                    message: 'La página solicitada no existe.',
                    status: 400
                });
            }
            else {
                const teamSettings = await teamSetting_model_1.default.findOne({ team });
                res.json({
                    inventorySettings: teamSettings.inventory,
                    count: labels.total,
                    pages: labels.pages,
                    hasPrevious: options.page && options.page > 1 && labels.pages && labels.pages >= options.page,
                    hasNext: options.page && labels.pages && labels.pages > options.page,
                    results: labels.docs,
                    status: 200
                });
            }
        }
        catch (e) {
            /* istanbul ignore next  */
            res.status(500).json(e);
        }
    }
    async apiCreateLabel(req, res) {
        const team = req.user.team._id;
        const { body } = req;
        try {
            const inventoryLabel = new inventoryLabel_model_1.default({
                name: body.name,
                affected: body.affected,
                sendTo: body.sendTo,
                description: body.description,
                isExhibition: body.isExhibition,
                color: body.color,
                requireCustomText: body.requireCustomText,
                updatedBy: req.user._id,
                team
            });
            await inventoryLabel.save();
            const response = {
                message: 'Etiqueta creada satisfactoriamente.',
                label: inventoryLabel
            };
            server_1.io.to(`label-list-${team}`).emit('REFRESH', {
                update: true,
                updatedBy: req.user._id
            });
            res.status(200).json(response);
        }
        catch (e) {
            /* istanbul ignore next  */
            console.log(e);
            /* istanbul ignore next  */
            res.status(500).json(e);
        }
    }
    async apiUpdateLabel(req, res) {
        const { id } = req.params;
        const team = req.user.team._id;
        const { body } = req;
        try {
            const inventoryLabel = await inventoryLabel_model_1.default.findOneAndUpdate({
                _id: id,
                team
            }, {
                name: body.name,
                active: body.active,
                affected: body.affected,
                sendTo: body.sendTo,
                description: body.description,
                isExhibition: body.isExhibition,
                color: body.color,
                requireCustomText: body.requireCustomText,
                updatedBy: req.user._id
            }, {
                new: true
            });
            if (inventoryLabel) {
                const response = {
                    message: 'Etiqueta editada satisfactoriamente.',
                    label: inventoryLabel
                };
                server_1.io.to(`label-list-${team}`).emit('REFRESH', {
                    update: true,
                    updatedBy: req.user._id
                });
                res.status(200).json(response);
            }
            else {
                const response = {
                    id,
                    message: 'Etiqueta no encontrada'
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
    async apiDeleteLabel(req, res) {
        const { id } = req.params;
        const team = req.user.team._id;
        try {
            const inventoryLabel = await inventoryLabel_model_1.default.findOneAndRemove({
                _id: id,
                team
            });
            if (inventoryLabel) {
                const response = {
                    message: 'Etiqueta eliminada satisfactoriamente.',
                    id: inventoryLabel._id
                };
                server_1.io.to(`label-list-${team}`).emit('REFRESH', {
                    update: true,
                    updatedBy: req.user._id
                });
                res.status(200).json(response);
            }
            else {
                const response = {
                    id,
                    message: 'Esta Etiqueta ya fue eliminada.'
                };
                res.status(200).json(response);
            }
        }
        catch (e) {
            /* istanbul ignore next */
            res.status(500).json(e);
        }
    }
    getLabels(filter, options) {
        return new Promise((resolve, reject) => {
            inventoryLabel_model_1.default.paginate(filter, options, (err, result) => {
                /* istanbul ignore next  */
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
}
exports.default = new LabelController();
//# sourceMappingURL=label.controller.js.map