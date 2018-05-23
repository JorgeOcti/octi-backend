"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const form_model_1 = require("../models/form.model");
const scale_model_1 = require("../models/scale.model");
class FormController {
    constructor() {
        this.list = this.list.bind(this);
        this.detail = this.detail.bind(this);
    }
    async list(req, res) {
        // debugger;
        try {
            const forms = await this.getForms();
            res.json({
                data: forms,
                status: 200
            });
        }
        catch (e) {
            res.status(400).json({
                error: 'Ha ocurrido un error',
                status: 400
            });
        }
    }
    async detail(req, res) {
        const { id } = req.params;
        try {
            const form = await this.getForm(id);
            const scalesIds = [];
            form.sections.forEach((section) => {
                section.questions.forEach((question) => {
                    const scaleID = question.scale.toString();
                    if (!scalesIds.includes(scaleID)) {
                        scalesIds.push(scaleID);
                    }
                });
            });
            const scales = await this.getScales(scalesIds);
            res.json({
                data: {
                    form,
                    scales
                },
                status: 200
            });
        }
        catch (e) {
            res.status(400).json({
                error: 'No se encontro formularío',
                status: 400
            });
        }
    }
    getScales(ids) {
        return new Promise((resolve, reject) => {
            scale_model_1.default
                .find({
                _id: { $in: ids }
            }, {
                updatedAt: false,
                createdAt: false,
                active: false,
                minValue: false,
                maxValue: false
            })
                .exec((err, scales) => {
                if (err) {
                    return reject(err);
                }
                return resolve(scales);
            });
        });
    }
    getForm(id) {
        return new Promise((resolve, reject) => {
            form_model_1.default
                .findById(id, {
                'updatedAt': false,
                'createdAt': false,
                'active': false,
                'sections.shortName': false,
                'sections.questions.shortName': false
            })
                .exec((err, form) => {
                if (err) {
                    return reject(err);
                }
                if (form) {
                    return resolve(form);
                }
                return reject('No se encontro formularío');
            });
        });
    }
    getForms() {
        return new Promise((resolve, reject) => {
            form_model_1.default
                .find({}, { _id: 1, name: 1 })
                .exec((err, forms) => {
                if (err) {
                    return reject(err);
                }
                return resolve(forms);
            });
        });
    }
}
exports.default = new FormController();
//# sourceMappingURL=form.controller.js.map