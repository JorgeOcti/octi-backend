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
        const keyCache = `list-form`;
        redis_1.default.get(keyCache, async (error, result) => {
            // the result exists in our cache - return it to our user immediately
            if (result) {
                res.json({
                    data: { ...JSON.parse(result) },
                    status: 200
                });
            }
            else {
                try {
                    // get forms from db
                    const forms = await this.getForms();
                    // set cache
                    redis_1.default.setex(keyCache, 30, JSON.stringify({ forms }));
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
        });
    }
    async detail(req, res) {
        const { id } = req.params;
        const keyCache = `detail-form-${id}`;
        redis_1.default.get(keyCache, async (error, result) => {
            // the result exists in our cache - return it to our user immediately
            if (result) {
                res.json({
                    data: { ...JSON.parse(result) },
                    status: 200
                });
            }
            else {
                try {
                    const form = await this.getForm(id);
                    // generate array of scale ids
                    const scalesIds = [];
                    form.sections.forEach((section) => {
                        section.questions.forEach((question) => {
                            const scaleID = question.scale.toString();
                            if (!scalesIds.includes(scaleID)) {
                                scalesIds.push(scaleID);
                            }
                        });
                    });
                    // get scales from db
                    const scales = await this.getScales(scalesIds);
                    // set cache
                    redis_1.default.setex(keyCache, 30, JSON.stringify({ form, scales }));
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
                'choices.na': false,
                '__v': false
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
                'sections.questions.shortName': false,
                '__v': false
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