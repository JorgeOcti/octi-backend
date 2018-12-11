"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const form_model_1 = require("../../models/form.model");
class AdminFormsController {
    constructor() {
        this.index = this.index.bind(this);
        this.apiListForms = this.apiListForms.bind(this);
    }
    async index(req, res) {
        res.render('app/index', { token: await req.user.generateToken() });
    }
    async apiListForms(req, res) {
        const { page, pageSize } = req.query;
        const { team } = req.user;
        // paginate options
        const options = {
            select: {
                name: true
            },
            sort: {
                firstName: 1
            },
            page: parseInt(page ? page : 1, 10),
            limit: parseInt(pageSize ? pageSize : 20, 10)
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
            form_model_1.default.paginate(filter, options, (err, result) => {
                if (err) {
                    /* istanbul ignore next */
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
}
exports.default = new AdminFormsController();
//# sourceMappingURL=form.admin.controller.js.map