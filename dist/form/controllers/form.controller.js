"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("../../services/redis");
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
        redis_1.default.get(id, async (error, result) => {
            if (result) {
                // the result exists in our cache - return it to our user immediately
                res.json({
                    data: { ...JSON.parse(result) },
                    status: 200
                });
            }
            else {
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
                    redis_1.default.setex(id, 30, JSON.stringify({ form, scales }));
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
        });
    }
    getScales(ids) {
        return new Promise((resolve, reject) => {
            scale_model_1.default
                .find({
                _id: { $in: ids }
            }, {
                'updatedAt': false,
                'createdAt': false,
                'active': false,
                'minValue': false,
                'maxValue': false,
                'choices.na': false
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