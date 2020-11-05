"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const team_model_1 = require("../../models/team.model");
class AdminsTeamController {
    constructor() {
        this.index = this.index.bind(this);
        this.apiListTeams = this.apiListTeams.bind(this);
    }
    async index(req, res) {
        // if (req.user.hasPermission('viewCompanies')) {
        res.render('app/index', { token: await req.user.generateToken() });
        // } else {
        //   res.status(403).render('403');
        // }
    }
    async apiListTeams(req, res) {
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
            page: parseInt(page ? page : "1", 10),
            limit: parseInt(pageSize ? pageSize : "20", 10)
        };
        const teams = await this.getTeams({}, options, search);
        if (options.page && teams.pages && teams.pages < options.page) {
            res.status(400).json({
                error: 'La página solicitada no existe.',
                status: 200
            });
        }
        else {
            res.json({
                count: teams.total,
                pages: teams.pages,
                hasPrevious: options.page && options.page > 1 && teams.pages && teams.pages >= options.page,
                hasNext: options.page && teams.pages && teams.pages > options.page,
                results: teams.docs,
                status: 200
            });
        }
    }
    getTeams(filter, options, search) {
        return new Promise((resolve, reject) => {
            team_model_1.default.paginate(filter, options, (err, result) => {
                /* istanbul ignore if */
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
}
exports.default = new AdminsTeamController();
//# sourceMappingURL=team.admin.controller.js.map