"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const server_1 = require("../../../server");
const car_model_1 = require("../../models/car.model");
class AdminCarController {
    constructor() {
        this.index = this.index.bind(this);
        this.indexDetail = this.indexDetail.bind(this);
        this.imports = this.imports.bind(this);
        this.importCars = this.importCars.bind(this);
        this.apiListCars = this.apiListCars.bind(this);
    }
    async index(req, res) {
        /* istanbul ignore else */
        if (req.user.hasPermission('viewCar')) {
            res.render('app/index', { token: await req.user.generateToken() });
        }
        else {
            res.status(403).render('403');
        }
    }
    async indexDetail(req, res) {
        const { id } = req.params;
        const team = req.user.team._id;
        /* istanbul ignore else */
        if (req.user.hasPermission('viewCar') && mongoose_1.Types.ObjectId.isValid(id) && await car_model_1.default.find({ _id: id, team }).count()) {
            res.render('app/index', { token: await req.user.generateToken() });
        }
        else {
            res.redirect('/settings/cars/');
        }
    }
    async imports(req, res) {
        /* istanbul ignore else */
        if (req.user.hasPermission('addCar')) {
            res.render('app/index', {
                token: await req.user.generateToken()
            });
        }
        else {
            res.status(403).render('403');
        }
    }
    async importCars(req, res) {
        /* istanbul ignore next  */
        if (!req.user.hasPermission('addCar')) {
            return res.status(403).json({
                message: 'No tienes permisos para esta operación'
            });
        }
        const { company } = req.user;
        const team = req.user.team._id;
        const { cars } = req.body;
        if (cars && cars.length) {
            for (const car of cars) {
                if (car.vin && car.vin.length) {
                    const vin2 = car.vin.substr(car.vin.length - 6);
                    try {
                        const newCar = await car_model_1.default.findOne({
                            vin: car.vin,
                            team
                        });
                        if (newCar) {
                            newCar.vin2 = vin2;
                            newCar.type = car.tipo ? car.tipo : newCar.type;
                            newCar.color = car.color ? car.color : newCar.color;
                            newCar.property = car.propiedad ? car.propiedad : newCar.property;
                            newCar.denomination = car.denominacion ? car.denominacion : newCar.denomination;
                            newCar.brand = car.marca ? car.marca : newCar.brand;
                            newCar.patent = car.patente ? car.patente : newCar.patent;
                            // newCar.engineNumber = car.motor ? car.motor : newCar.engineNumber;
                            newCar.internalNumber = car.NInterno ? car.NInterno : newCar.internalNumber;
                            // newCar.destination = car.destino ? car.destino : newCar.destination;
                            newCar.createdBy = req.user;
                            newCar.status = car_model_1.ChoicesStatusCar.active;
                            await newCar.save();
                        }
                        else {
                            await car_model_1.default.create({
                                vin: car.vin,
                                vin2,
                                type: car.tipo ? car.tipo : '',
                                color: car.color ? car.color : '',
                                property: car.propiedad ? car.propiedad : '',
                                denomination: car.denominacion ? car.denominacion : '',
                                brand: car.marca ? car.marca : '',
                                patent: car.patente ? car.patente : '',
                                // engineNumber: car.motor ? car.motor : car.engineNumber,
                                internalNumber: car.NInterno ? car.NInterno : '',
                                // destination: car.destino ? car.destino : '',
                                company,
                                team,
                                createdBy: req.user,
                                status: car_model_1.ChoicesStatusCar.active
                            });
                        }
                        // io.to(req.user._id).emit('STATUS-CARS', {newCar});
                    }
                    catch (e) {
                        /* istanbul ignore next */
                        console.log(e);
                    }
                }
            }
            server_1.io.to(req.user._id).emit('FINISH-IMPORT', { finish: true });
        }
        res.json({
            status: 200
        });
    }
    async apiListCars(req, res) {
        /* istanbul ignore next */
        if (!req.user.hasPermission('viewCar')) {
            return res.status(403).json({
                message: 'No tienes permisos para esta operación'
            });
        }
        const { page, pageSize, search } = req.query;
        const team = req.user.team._id;
        // paginate options
        const options = {
            select: {
                vin: true,
                vin2: true,
                brand: true,
                patent: true,
                denomination: true,
                color: true,
                internalNumber: true,
                createdAt: true,
                updatedAt: true
            },
            populate: [{
                    path: 'venue',
                    select: ['name', 'active']
                }],
            sort: {
                createdAt: -1
            },
            page: parseInt(page ? page : "1", 10),
            limit: parseInt(pageSize ? pageSize : "20", 10)
        };
        try {
            const cars = await this.getCars({
                team,
                status: {
                    $eq: car_model_1.ChoicesStatusCar.active
                }
            }, options, search);
            // validate exist page
            /* istanbul ignore if  */
            if (options.page && cars.pages && cars.pages < options.page) {
                res.status(400).json({
                    error: 'La página solicitada no existe.',
                    status: 200
                });
            }
            else {
                res.json({
                    count: cars.total,
                    pages: cars.pages,
                    hasPrevious: options.page && options.page > 1 && cars.pages && cars.pages >= options.page,
                    hasNext: options.page && cars.pages && cars.pages > options.page,
                    results: cars.docs,
                    status: 200
                });
            }
        }
        catch (e) {
            /* istanbul ignore next  */
            if (e) {
                console.log('e', e);
                res.status(500).json(e);
            }
        }
    }
    getCars(filter, options, search) {
        if (search && search.length) {
            const searchText = new RegExp(search, 'i');
            filter = {
                $and: [{
                        $or: [{
                                vin: { $regex: searchText }
                            }, {
                                brand: { $regex: searchText }
                            }, {
                                denomination: { $regex: searchText }
                            }, {
                                color: { $regex: searchText }
                            }]
                    }, filter]
            };
        }
        return new Promise((resolve, reject) => {
            car_model_1.default.paginate(filter, options, (err, result) => {
                /* istanbul ignore if */
                if (err) {
                    reject(err);
                }
                resolve(result);
            });
        });
    }
}
exports.default = new AdminCarController();
//# sourceMappingURL=car.admin.controller.js.map