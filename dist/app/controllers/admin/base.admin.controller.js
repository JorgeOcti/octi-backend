"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BaseAdminController {
    constructor(instandeModel) {
        this.instandeModel = instandeModel;
        this.apiList = this.apiList.bind(this);
        this.getDataPaginated = this.getDataPaginated.bind(this);
    }
    async index(req, res) {
        res.render('app/index', { token: await req.user.generateToken() });
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
            const data = await this.getDataPaginated(this.filter);
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
            if (e) {
                res.status(500).json(e);
            }
        }
    }
    getDataPaginated(filter) {
        return new Promise((resolve, reject) => {
            this.instandeModel.paginate(filter, this.paginateOptions, (err, result) => {
                /* istanbul ignore next */
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
}
exports.default = BaseAdminController;
//# sourceMappingURL=base.admin.controller.js.map