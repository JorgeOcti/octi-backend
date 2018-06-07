"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const car_model_1 = require("../models/car.model");
class AdminCompaniesController {
    constructor() {
        this.vinDashboard = this.vinDashboard.bind(this);
        this.apiCars = this.apiCars.bind(this);
        this.getCars = this.getCars.bind(this);
    }
    vinDashboard(req, res) {
        res.render('app/index');
    }
    async apiCars(req, res) {
        const company = req.user.company;
        const { page, pageSize } = req.query;
        // paginate options
        const options = {
            select: {
                vin: true
            },
            sort: {
                createdAt: -1
            },
            page: parseInt(page ? page : 1),
            limit: parseInt(pageSize ? pageSize : 20),
        };
        try {
            const cars = await this.getCars(company, options);
            // validate exist page
            if (options.page && cars.pages && cars.pages < options.page) {
                res.status(400).json({
                    error: 'La página solicitada no existe.',
                    status: 200,
                });
            }
            else {
                res.json({
                    count: cars.total,
                    pages: cars.pages,
                    hasPrevious: options.page && options.page > 1 && cars.pages && cars.pages >= options.page,
                    hasNext: options.page && cars.pages && cars.pages > options.page,
                    results: cars.docs,
                    status: 200,
                });
            }
        }
        catch (e) {
            if (e)
                res.status(500).json(e);
        }
    }
    getCars(company, options) {
        return new Promise((resolve, reject) => {
            car_model_1.default.paginate({ company }, options, (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
}
exports.default = new AdminCompaniesController();
//# sourceMappingURL=car.controller.js.map