"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const car_model_1 = require("../../app/models/car.model");
const car_model_2 = require("../../app/models/car.model");
const venue_model_1 = require("../../app/models/venue.model");
const server_1 = require("../../server");
const inventory_model_1 = require("../models/inventory.model");
class InventoryController {
    constructor() {
        this.index = this.index.bind(this);
        this.create = this.create.bind(this);
        this.list = this.list.bind(this);
        this.apiList = this.apiList.bind(this);
        this.apiFoundCar = this.apiFoundCar.bind(this);
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
    async apiFoundCar(req, res) {
        const { company, venue } = req.user;
        const { id } = req.params;
        const { vin } = req.body;
        try {
            const car = await car_model_2.default.findOne({
                vin,
                company
            });
            // if car exist
            if (car) {
                const inventoriedCar = await inventory_model_1.default.findOne({
                    $and: [{
                            _id: id
                        }, {
                            company
                        }, {
                            ['cars.car']: car._id
                        }]
                }, {
                    'cars.$': 1
                });
                if (inventoriedCar && inventoriedCar.cars.length && inventoriedCar.cars[0].status !== inventory_model_1.ChoicesStatusCarInventory.pending) {
                    res.status(400).json({
                        message: 'Este auto ya ha sido inventariado',
                        status: 400
                    });
                }
                else {
                    const inventoryCar = await inventory_model_1.default.findOne({
                        _id: id,
                        ['cars.car']: car._id,
                        company
                    }, {
                        'cars.$': 1
                    });
                    // if car in inventory
                    if (inventoryCar && inventoryCar.cars.length) {
                        await inventory_model_1.default.update({
                            _id: id,
                            ['cars.car']: car._id,
                            company
                        }, {
                            $set: {
                                'cars.$.venueFound': venue._id,
                                'cars.$.status': inventory_model_1.ChoicesStatusCarInventory.found
                            }
                        }, {
                            upsert: true
                        });
                        // send socket messsage
                        server_1.io.to(`inventory-list-${company._id}`).emit('REFRESH', {
                            update: true
                        });
                        res.json({
                            id
                        });
                    }
                    else {
                        const inventory = await inventory_model_1.default.findOne({
                            _id: id,
                            company
                        });
                        if (inventory) {
                            inventory.cars.push({
                                car: car._id,
                                venue: venue._id,
                                venueFound: venue._id,
                                status: inventory_model_1.ChoicesStatusCarInventory.leftover
                            });
                            await inventory.save();
                            // send socket messsage
                            server_1.io.to(`inventory-list-${company._id}`).emit('REFRESH', {
                                update: true
                            });
                            res.json({
                                id
                            });
                        }
                        else {
                            // if inventory no exist
                            res.status(400).json({
                                message: 'Este inventario ya no se encuentra activo',
                                status: 400
                            });
                        }
                    }
                }
            }
            else {
                // if car no exist
                const inventory = await inventory_model_1.default.findOne({
                    _id: id,
                    company
                });
                if (inventory) {
                    const newCar = new car_model_1.default({
                        vin,
                        vin2: vin.substr(vin.length - 6),
                        company
                    });
                    await newCar.save();
                    inventory.cars.push({
                        car: newCar._id,
                        venue: venue._id,
                        venueFound: venue._id,
                        status: inventory_model_1.ChoicesStatusCarInventory.leftover
                    });
                    await inventory.save();
                    // send socket messsage
                    server_1.io.to(`inventory-list-${company._id}`).emit('REFRESH', {
                        update: true
                    });
                    res.json({
                        id
                    });
                }
                else {
                    // if inventory no exist
                    res.status(400).json({
                        message: 'Este inventario ya no se encuentra activo',
                        status: 400
                    });
                }
            }
        }
        catch (e) {
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