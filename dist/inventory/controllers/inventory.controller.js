"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const car_model_1 = require("../../app/models/car.model");
const venue_model_1 = require("../../app/models/venue.model");
const inventory_model_1 = require("../models/inventory.model");
class InventoryController {
    constructor() {
        this.index = this.index.bind(this);
        this.create = this.create.bind(this);
        this.list = this.list.bind(this);
        this.apiList = this.apiList.bind(this);
    }
    async index(req, res) {
        res.render('app/index', { token: await req.user.generateToken() });
    }
    async create(req, res) {
        const company = req.user.company;
        const { carsByVenue } = req.body;
        try {
            const inventoryCars = [];
            const venuesIDs = [];
            for (const venue of carsByVenue) {
                if (venue.name && venue.name.length) {
                    let currentVenue = await venue_model_1.default.findOne({ company, name: venue.name });
                    if (currentVenue === null) {
                        currentVenue = new venue_model_1.default({
                            name: venue.name,
                            company
                        });
                        await currentVenue.save();
                    }
                    venuesIDs.push(currentVenue._id.toString());
                    if (venue.cars && venue.cars.length) {
                        for (const car of venue.cars) {
                            let currentCar = await car_model_1.default.findOne({
                                company,
                                vin: car.vin
                            });
                            if (currentCar === null && car.vin && car.vin.length) {
                                currentCar = new car_model_1.default({
                                    company,
                                    vin: car.vin,
                                    vin2: car.vin.substr(car.vin.length - 6),
                                    color: car.color,
                                    denomination: car.denomination,
                                    brand: car.brand,
                                    patent: car.patent
                                });
                                await currentCar.save();
                            }
                            if (currentVenue && currentCar) {
                                inventoryCars.push({
                                    venue: currentVenue._id,
                                    car: currentCar._id
                                });
                            }
                        }
                    }
                }
            }
            const inventory = new inventory_model_1.default({
                name: 'prueba',
                company,
                cars: inventoryCars,
                venues: venuesIDs,
                createdBy: req.user._id,
                status: inventory_model_1.ChoicesStatusInventory.inProcess
            });
            inventory.save();
            res.json({});
        }
        catch (e) {
            res.status(400).json({
                message: e,
                status: 400
            });
        }
    }
    async list(req, res) {
        const { company } = req.user;
        try {
            const response = [];
            const inventories = await inventory_model_1.default.aggregate([{
                    $match: {
                        company
                    }
                }, {
                    $unwind: '$cars'
                }, {
                    $group: {
                        _id: {
                            category: '$_id',
                            status: '$status',
                            carStatus: '$cars.status',
                            name: '$name',
                            createdBy: '$createdBy',
                            createdAt: '$createdAt'
                        },
                        total: {
                            $sum: 1
                        }
                    }
                }, {
                    $group: {
                        _id: '$_id.category',
                        name: {
                            $first: '$_id.name'
                        },
                        createdAt: {
                            $first: '$_id.createdAt'
                        },
                        user: {
                            $first: '$_id.createdBy'
                        },
                        results: {
                            $push: {
                                status: '$_id.carStatus',
                                total: '$total'
                            }
                        },
                        status: {
                            $first: '$_id.status'
                        }
                    }
                }, {
                    $lookup: {
                        from: 'users',
                        localField: 'user',
                        foreignField: '_id',
                        as: 'userInfo'
                    }
                }, {
                    $unwind: '$userInfo'
                }, {
                    $project: {
                        '_id': 1,
                        'name': 1,
                        'results': 1,
                        'userInfo.firstName': 1,
                        'userInfo.lastName': 1,
                        'status': 1,
                        'createdAt': 1
                    }
                }, {
                    $sort: {
                        createdAt: -1
                    }
                }]);
            for (const inventory of inventories) {
                const defaultResults = {
                    [inventory_model_1.ChoicesStatusCarInventory.pending]: 0,
                    [inventory_model_1.ChoicesStatusCarInventory.found]: 0,
                    [inventory_model_1.ChoicesStatusCarInventory.leftover]: 0
                };
                response.push({
                    _id: inventory._id,
                    name: inventory.name,
                    createdBy: inventory.userInfo ? {
                        ...inventory.userInfo,
                        fullName: `${inventory.userInfo.firstName} ${inventory.userInfo.lastName}`
                    } : {},
                    results: inventory.results.reduce((acc, cur) => {
                        acc[cur.status] = cur.total;
                        return acc;
                    }, {
                        ...defaultResults
                    }),
                    status: inventory.status,
                    createdAt: inventory.createdAt
                });
            }
            res.json({
                inventories: response,
                status: 200
            });
        }
        catch (e) {
            console.log(e);
            res.status(400).json({
                message: e,
                status: 400
            });
        }
    }
    async apiList(req, res) {
        const { company, venue } = req.user;
        try {
            const inventories = await inventory_model_1.default.find({
                company,
                venues: venue._id,
                status: {
                    $in: [inventory_model_1.ChoicesStatusInventory.inProcess]
                }
            }, {
                _id: true,
                name: true
            });
            res.json({
                data: inventories,
                status: 200
            });
        }
        catch (e) {
            res.status(400).json({
                message: e,
                status: 400
            });
        }
    }
}
exports.default = new InventoryController();
//# sourceMappingURL=inventory.controller.js.map