"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const planning_model_1 = require("../models/planning.model");
const moment = require("moment");
const car_model_1 = require("../../app/models/car.model");
const server_1 = require("../../server");
class PlanningController {
    constructor() {
        this.index = this.index.bind(this);
        this.list = this.list.bind(this);
        this.create = this.create.bind(this);
        this.getPlanning = this.getPlanning.bind(this);
    }
    /* istanbul ignore next */
    async index(req, res) {
        try {
            res.render('app/index', {
                token: await req.user.generateToken()
            });
        }
        catch (e) {
            console.log(e);
        }
    }
    async create(req, res) {
        const { team, company } = req.user;
        let { carsByDate } = req.body;
        try {
            const planningCars = [];
            for (const item of carsByDate) {
                for (const car of item.cars) {
                    let currentCar = await car_model_1.default.findOne({
                        team,
                        vin: car.vin.trim()
                    });
                    if (currentCar === null && car.vin && car.vin.trim().length) {
                        currentCar = new car_model_1.default({
                            team,
                            company,
                            internalNumber: car.NInterno,
                            vin: car.vin,
                            vin2: car.vin.substr(car.vin.length - 6),
                            color: car.color,
                            type: car.tipo,
                            property: car.propiedad,
                            denomination: car.denominacion,
                            brand: car.marca,
                            patent: car.patente,
                            createdBy: req.user,
                            status: car_model_1.ChoicesStatusCar.active
                        });
                        await currentCar.save();
                    }
                    if (currentCar) {
                        planningCars.push({
                            team,
                            company,
                            car: currentCar._id,
                            createdBy: req.user,
                            date: moment(item.key, "YYYYMMDD").toDate()
                        });
                    }
                }
            }
            await planning_model_1.default.insertMany(planningCars);
            server_1.io.to(`planning-list-${team}`).emit('REFRESH', {
                update: true
            });
            res.status(201)
                .json({
                message: 'Planificación importada satisfactoriamente',
                status: 201
            });
        }
        catch (e) {
            /* istanbul ignore next */
            if (e) {
                console.log(e);
                res.status(500).json(e);
            }
        }
    }
    async list(req, res) {
        const { team } = req.user;
        const { page, pageSize } = req.query;
        // paginate options
        const options = {
            // select: {
            //   vin: true,
            //   brand: true,
            //   denomination: true,
            //   color: true
            // },
            populate: [{
                    path: 'car',
                    select: ['vin', 'brand', 'denomination', 'color'],
                }, {
                    path: 'createdBy',
                    select: ['vin', 'brand', 'denomination', 'color']
                }],
            sort: {
                date: -1
            },
            page: parseInt(page ? page : "1", 10),
            limit: parseInt(pageSize ? pageSize : "20", 10)
        };
        try {
            const planning = await this.getPlanning({
                team
            }, options);
            // validate exist page
            if (options.page && planning.pages && planning.pages < options.page) {
                res.status(400).json({
                    message: 'La página solicitada no existe.',
                    status: 200
                });
            }
            else {
                res.json({
                    count: planning.total,
                    pages: planning.pages,
                    hasPrevious: options.page && options.page > 1 && planning.pages && planning.pages >= options.page,
                    hasNext: options.page && planning.pages && planning.pages > options.page,
                    results: planning.docs,
                    status: 200
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            if (e) {
                console.log(e);
                res.status(500).json(e);
            }
        }
    }
    getPlanning(filters, options) {
        return new Promise((resolve, reject) => {
            !planning_model_1.default.paginate(filters, options, (err, result) => {
                if (err) {
                    /* istanbul ignore next */
                    reject(err);
                }
                resolve(result);
            });
        });
    }
}
exports.default = new PlanningController();
//# sourceMappingURL=planning.controller.js.map