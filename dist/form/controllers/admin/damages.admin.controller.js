"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const damages_model_1 = require("../../models/damages.model");
const kind_model_1 = require("../../models/kind.model");
const part_model_1 = require("../../models/part.model");
const position_model_1 = require("../../models/position.model");
class AdminDamagesController {
    kind;
    position;
    part;
    damage;
    constructor() {
        this.index = this.index.bind(this);
        this.apiListDamages = this.apiListDamages.bind(this);
        this.kind = new kind_model_1.default();
        this.position = new position_model_1.default();
        this.part = new part_model_1.default();
        this.damage = new damages_model_1.default();
    }
    unused() {
        console.log({
            kind: this.kind,
            position: this.position,
            part: this.part,
            damage: this.damage
        });
    }
    /* istanbul ignore next */
    async index(req, res) {
        res.render('app/index', { token: await req.user.generateToken() });
    }
    async apiListDamages(req, res) {
        const { page, pageSize } = req.query;
        const team = req.user.team._id;
        // paginate options
        const options = {
            select: ['name', 'parts', 'kinds', 'positions'],
            sort: {
                name: 1
            },
            populate: [{
                    path: 'parts',
                    select: ['name'],
                    options: {
                        sort: {
                            name: 1
                        }
                    }
                }, {
                    path: 'kinds',
                    select: ['name'],
                    options: {
                        sort: {
                            name: 1
                        }
                    }
                }, {
                    path: 'positions',
                    select: ['name'],
                    options: {
                        sort: {
                            name: 1
                        }
                    }
                }],
            page: parseInt(page ? page : "1", 10),
            limit: parseInt(pageSize ? pageSize : "20", 10)
        };
        try {
            const forms = await this.getForms({
                team
            }, options);
            // validate exist page
            if (options.page && forms.pages && forms.pages < options.page) {
                /* istanbul ignore next */
                res.status(400).json({
                    error: 'La página solicitada no existe.',
                    status: 200
                });
            }
            else {
                res.json({
                    count: forms.total,
                    pages: forms.pages,
                    hasPrevious: options.page && options.page > 1 && forms.pages && forms.pages >= options.page,
                    hasNext: options.page && forms.pages && forms.pages > options.page,
                    results: forms.docs,
                    status: 200
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            if (e) {
                res.status(500).json(e);
            }
        }
    }
    getForms(filter, options) {
        return new Promise((resolve, reject) => {
            damages_model_1.default.paginate(filter, options, (err, result) => {
                if (err) {
                    /* istanbul ignore next */
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
}
exports.default = new AdminDamagesController();
//# sourceMappingURL=damages.admin.controller.js.map