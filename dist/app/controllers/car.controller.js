"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const car_model_1 = require("../models/car.model");
const user_model_1 = require("../models/user.model");
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
            populate: [{
                    path: 'lastForm',
                    select: ['createdAt', 'user']
                }],
            sort: {
                createdAt: -1
            },
            page: parseInt(page ? page : 1),
            limit: parseInt(pageSize ? pageSize : 20),
        };
        try {
            const cars = await this.getCars(company, options);
            const userIds = [];
            for (const car of cars.docs) {
                userIds.push(car.lastForm.user);
            }
            // generate user object
            let users = {};
            for (const user of await user_model_1.default.find({ _id: { $in: userIds } }, { firstName: true, lastName: true })) {
                users[user._id] = user;
            }
            // add user in lastForm
            const carsWithUser = cars.docs.map((car) => {
                if (car.lastForm.user && users.hasOwnProperty(car.lastForm.user)) {
                    car.lastForm.user = users[car.lastForm.user];
                    console.log(car.lastForm.user);
                }
                else {
                    car.lastForm.user = {
                        name: null
                    };
                }
                return car;
            });
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
                    results: carsWithUser,
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