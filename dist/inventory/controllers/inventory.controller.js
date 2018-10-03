"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bson_1 = require("bson");
const GraphicsMagick = require("gm");
const mongoose = require("mongoose");
const car_model_1 = require("../../app/models/car.model");
const car_model_2 = require("../../app/models/car.model");
const user_model_1 = require("../../app/models/user.model");
const venue_model_1 = require("../../app/models/venue.model");
const server_1 = require("../../server");
const push_service_1 = require("../../services/push.service");
const inventory_model_1 = require("../models/inventory.model");
const inventoryFile_model_1 = require("../models/inventoryFile.model");
class InventoryController {
    constructor() {
        this.index = this.index.bind(this);
        this.detail = this.detail.bind(this);
        this.create = this.create.bind(this);
        this.list = this.list.bind(this);
        this.apiList = this.apiList.bind(this);
        this.apiDetaill = this.apiDetaill.bind(this);
        this.apiFoundCar = this.apiFoundCar.bind(this);
        this.uploadFile = this.uploadFile.bind(this);
        this.autoRotate = this.autoRotate.bind(this);
        this.finishInventory = this.finishInventory.bind(this);
        this.deleteInventory = this.deleteInventory.bind(this);
    }
    async index(req, res) {
        res.render('app/index', { token: await req.user.generateToken() });
    }
    async detail(req, res) {
        const { company } = req.user;
        const { id } = req.params;
        try {
            const inventory = await inventory_model_1.default.findOne({ _id: id, company });
            if (!inventory) {
                return res.status(404).render('404');
            }
            else {
                res.render('app/index', { token: await req.user.generateToken() });
            }
        }
        catch (e) {
            if (e) {
                res.status(500).send(e);
            }
        }
    }
    async create(req, res) {
        const company = req.user.company;
        const { carsByVenue, name } = req.body;
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
                            if (currentCar === null && car.vin && car.vin.trim().length) {
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
                                    car: currentCar._id,
                                    images: []
                                });
                            }
                        }
                    }
                }
            }
            const inventory = new inventory_model_1.default({
                name,
                company,
                cars: inventoryCars,
                venues: venuesIDs,
                createdBy: req.user._id,
                status: inventory_model_1.ChoicesStatusInventory.inProcess
            });
            await inventory.save();
            const usersIDs = await user_model_1.default.find({
                venue: {
                    $in: venuesIDs
                },
                company
            }, {
                _id: true
            });
            push_service_1.default.massiveSend('Nuevo inventario', `Se ha iniciado el inventario "${inventory.name}"`, 'Ya puedes empezar ha escanear', usersIDs.map((user) => user._id.toString()));
            server_1.io.to(`inventory-list-${company}`).emit('REFRESH', {
                update: true
            });
            res.json({
                message: 'Inventario creado satisfactoriamente',
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
                            createdAt: '$createdAt',
                            finalizedBy: '$finalizedBy',
                            finalizedAt: '$finalizedAt'
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
                        finalizedAt: {
                            $first: '$_id.finalizedAt'
                        },
                        createdBy: {
                            $first: '$_id.createdBy'
                        },
                        finalizedBy: {
                            $first: '$_id.finalizedBy'
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
                        localField: 'createdBy',
                        foreignField: '_id',
                        as: 'createdBy'
                    }
                }, {
                    $lookup: {
                        from: 'users',
                        localField: 'finalizedBy',
                        foreignField: '_id',
                        as: 'finalizedBy'
                    }
                }, {
                    $project: {
                        '_id': 1,
                        'name': 1,
                        'results': 1,
                        'createdBy.firstName': 1,
                        'createdBy.lastName': 1,
                        'finalizedBy.firstName': 1,
                        'finalizedBy.lastName': 1,
                        'status': 1,
                        'createdAt': 1,
                        'finalizedAt': 1
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
                    createdBy: inventory.createdBy.length ? {
                        fullName: `${inventory.createdBy[0].firstName} ${inventory.createdBy[0].lastName}`
                    } : {},
                    finalizedBy: inventory.finalizedBy.length ? {
                        fullName: `${inventory.finalizedBy[0].firstName} ${inventory.finalizedBy[0].lastName}`
                    } : {},
                    results: inventory.results.reduce((acc, cur) => {
                        acc[cur.status] = cur.total;
                        return acc;
                    }, {
                        ...defaultResults
                    }),
                    status: inventory.status,
                    createdAt: inventory.createdAt,
                    finalizedAt: inventory.finalizedAt ? inventory.finalizedAt : null
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
    async uploadFile(req, res) {
        const { id } = req.params;
        const { company } = req.user;
        if (req.file) {
            const file = req.file;
            try {
                const inventoryFile = new inventoryFile_model_1.default();
                /*
                  {
                    fieldname: 'file',
                    originalname: 'Captura de pantalla 2018-06-28 a la(s) 11.59.58.png',
                    encoding: '7bit',
                    mimetype: 'image/png',
                    destination: '/tmp/',
                    filename: 'Captura de pantalla 2018-06-28 a la(s) 11.59.58.png',
                    path: '/tmp/Captura de pantalla 2018-06-28 a la(s) 11.59.58.png',
                    size: 794429
                  }
                */
                // fix exif
                if (new RegExp('\\bimage\\b').test(file.mimetype)) {
                    await this.autoRotate(file.path);
                }
                file.headers = {
                    'Content-Type': file.mimetype
                };
                file.company = company._id;
                file.inventory = id;
                inventoryFile.user = req.user._id;
                inventoryFile.company = company._id;
                inventoryFile.attach('file', file, async (error) => {
                    if (error) {
                        res.status(400).json(error);
                    }
                    else {
                        await inventoryFile.save();
                        res.status(201).json({
                            data: {
                                _id: inventoryFile._id,
                                file: inventoryFile.file
                            },
                            status: 201
                        });
                    }
                });
            }
            catch (e) {
                res.status(400).json(e);
            }
        }
        else {
            res.status(400).json({
                message: 'La imagen es obligatoria.',
                status: 400
            });
        }
    }
    async apiFoundCar(req, res) {
        const { company, venue } = req.user;
        const { id } = req.params;
        const { vin, images } = req.body;
        try {
            const car = await car_model_2.default.findOne({
                vin,
                company
            });
            // if car exist
            let textNotification = '';
            if (car) {
                textNotification = `${req.user.firstName} ${req.user.lastName} encontró ${car.brand} (${car.denomination}) en ${venue.name}.`;
                const inventoriedCar = await inventory_model_1.default.findOne({
                    $and: [{
                            _id: id
                        }, {
                            company
                        }, {
                            cars: {
                                $elemMatch: {
                                    car: car._id,
                                    status: {
                                        $ne: inventory_model_1.ChoicesStatusCarInventory.pending
                                    }
                                }
                            }
                        }]
                }, {
                    'cars.$': 1
                });
                if (inventoriedCar) {
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
                        if (inventoryCar.cars[0].venue.toString() === req.user.venue._id.toString()) {
                            await inventory_model_1.default.update({
                                _id: id,
                                ['cars.car']: car._id,
                                company
                            }, {
                                $set: {
                                    'cars.$.venueFound': venue._id,
                                    'cars.$.status': inventory_model_1.ChoicesStatusCarInventory.found,
                                    'cars.$.images': images ? images.map((image) => (new bson_1.ObjectID(image))) : [],
                                    'cars.$.inventoriedBy': req.user._id
                                }
                            }, {
                                upsert: true
                            });
                            server_1.io.to(`inventory-detail-${inventoryCar._id}`).emit('REFRESH', {
                                title: 'Vehiculo encontrado',
                                text: textNotification,
                                status: inventory_model_1.ChoicesStatusCarInventory.found,
                                update: true
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
                                    venue: req.user.venue._id,
                                    venueFound: req.user.venue._id,
                                    images: images ? images.map((image) => (new bson_1.ObjectID(image))) : [],
                                    status: inventory_model_1.ChoicesStatusCarInventory.leftover,
                                    inventoriedBy: req.user._id
                                });
                                await inventory.save();
                            }
                            server_1.io.to(`inventory-detail-${inventoryCar._id}`).emit('REFRESH', {
                                title: 'Vehiculo encontrado',
                                text: textNotification,
                                status: inventory_model_1.ChoicesStatusCarInventory.leftover,
                                update: true
                            });
                        }
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
                                status: inventory_model_1.ChoicesStatusCarInventory.leftover,
                                inventoriedBy: req.user._id,
                                images: images ? images.map((image) => (new bson_1.ObjectID(image))) : []
                            });
                            await inventory.save();
                            // send socket messsage
                            server_1.io.to(`inventory-list-${company._id}`).emit('REFRESH', {
                                update: true
                            });
                            server_1.io.to(`inventory-detail-${inventory._id}`).emit('REFRESH', {
                                title: 'Vehiculo encontrado',
                                text: textNotification,
                                status: inventory_model_1.ChoicesStatusCarInventory.leftover,
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
                    textNotification = `${req.user.firstName} ${req.user.lastName} encontró ${vin} en ${venue.name}.`;
                    inventory.cars.push({
                        car: newCar._id,
                        venue: venue._id,
                        venueFound: venue._id,
                        status: inventory_model_1.ChoicesStatusCarInventory.leftover,
                        inventoriedBy: req.user._id,
                        images: images ? images.map((image) => (new bson_1.ObjectID(image))) : []
                    });
                    await inventory.save();
                    // send socket messsage
                    server_1.io.to(`inventory-list-${company._id}`).emit('REFRESH', {
                        update: true
                    });
                    server_1.io.to(`inventory-detail-${inventory._id}`).emit('REFRESH', {
                        title: 'Vehiculo encontrado',
                        text: textNotification,
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
            console.log(e);
            res.status(400).json({
                message: e,
                status: 400
            });
        }
    }
    async finishInventory(req, res) {
        const { company } = req.user;
        const { id } = req.params;
        try {
            const inventory = await inventory_model_1.default.findOne({ _id: id, company });
            if (inventory) {
                await inventory.update({
                    status: inventory_model_1.ChoicesStatusInventory.finalized,
                    finalizedAt: new Date(),
                    finalizedBy: req.user._id
                });
                server_1.io.to(`inventory-list-${company}`).emit('REFRESH', {
                    update: true
                });
                res.json({
                    message: 'Se ha finalizado correctamente el inventario.',
                    status: 200
                });
            }
            else {
                res.status(400).json({
                    message: 'No se ha encontrado el inventario',
                    status: 400
                });
            }
        }
        catch (e) {
            console.log('e', e);
            res.status(400).json({
                message: 'Ha ocurrido un error',
                status: 400
            });
        }
    }
    async deleteInventory(req, res) {
        const { company } = req.user;
        const { id } = req.params;
        try {
            const inventory = await inventory_model_1.default.findOne({
                _id: id,
                company
            });
            if (inventory) {
                await inventory.remove();
                server_1.io.to(`inventory-list-${company}`).emit('REFRESH', {
                    update: true
                });
                res.json({
                    message: 'Se ha eliminado correctamente el inventario.',
                    status: 200
                });
            }
            else {
                res.status(400).json({
                    message: 'No se ha encontrado el inventario',
                    status: 400
                });
            }
        }
        catch (e) {
            console.log('e', e);
            res.status(400).json({
                message: 'Ha ocurrido un error',
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
    async apiDetaill(req, res) {
        const { id } = req.params;
        const { company } = req.user;
        try {
            // summary
            const inventory = await inventory_model_1.default.aggregate([
                {
                    $match: {
                        company,
                        _id: { $in: [mongoose.Types.ObjectId(id)] }
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
                            createdAt: '$createdAt',
                            finalizedAt: '$finalizedAt'
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
                        finalizedAt: {
                            $first: '$_id.finalizedAt'
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
                        'createdAt': 1,
                        'finalizedAt': 1
                    }
                }, {
                    $sort: {
                        createdAt: -1
                    }
                }
            ]);
            // detail by venue
            const detailByVenues = await inventory_model_1.default.aggregate([
                {
                    $match: {
                        company,
                        _id: { $in: [mongoose.Types.ObjectId(id)] }
                    }
                }, {
                    $unwind: '$cars'
                }, {
                    $group: {
                        _id: {
                            category: '$cars.venue',
                            status: '$cars.status'
                        },
                        total: {
                            $sum: 1
                        }
                    }
                }, {
                    $group: {
                        _id: '$_id.category',
                        status: {
                            $push: {
                                name: '$_id.status',
                                total: '$total'
                            }
                        }
                    }
                }, {
                    $lookup: {
                        from: 'venues',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'info'
                    }
                }, {
                    $unwind: '$info'
                }
            ]);
            // detail by brands
            const detailByBrands = await inventory_model_1.default.aggregate([
                {
                    $match: {
                        company,
                        _id: { $in: [mongoose.Types.ObjectId(id)] }
                    }
                }, {
                    $unwind: '$cars'
                }, {
                    $lookup: {
                        from: 'cars',
                        localField: 'cars.car',
                        foreignField: '_id',
                        as: 'car'
                    }
                }, {
                    $unwind: '$car'
                }, {
                    $group: {
                        _id: {
                            car: '$car.brand',
                            status: '$cars.status'
                        },
                        total: {
                            $sum: 1
                        }
                    }
                }, {
                    $group: {
                        _id: '$_id.car',
                        status: {
                            $push: {
                                name: '$_id.status',
                                total: '$total'
                            }
                        }
                    }
                }, {
                    $lookup: {
                        from: 'venues',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'info'
                    }
                }
            ]);
            const detailByBrand = [];
            const detailByVenue = [];
            const defaultResults = {
                [inventory_model_1.ChoicesStatusCarInventory.pending]: 0,
                [inventory_model_1.ChoicesStatusCarInventory.found]: 0,
                [inventory_model_1.ChoicesStatusCarInventory.leftover]: 0
            };
            for (const db of detailByBrands) {
                detailByBrand.push({
                    name: db._id ? db._id : 'Sin Marca',
                    results: db.status.reduce((acc, cur) => {
                        acc[cur.name] = cur.total;
                        return acc;
                    }, {
                        ...defaultResults
                    })
                });
            }
            for (const dv of detailByVenues) {
                detailByVenue.push({
                    name: dv.info.name,
                    results: dv.status.reduce((acc, cur) => {
                        acc[cur.name] = cur.total;
                        return acc;
                    }, {
                        ...defaultResults
                    })
                });
            }
            if (inventory && inventory.length) {
                const currentInventory = inventory[0];
                const response = {
                    _id: currentInventory._id,
                    name: currentInventory.name,
                    createdBy: currentInventory.userInfo ? {
                        ...currentInventory.userInfo,
                        fullName: `${currentInventory.userInfo.firstName} ${currentInventory.userInfo.lastName}`
                    } : {},
                    results: currentInventory.results.reduce((acc, cur) => {
                        acc[cur.status] = cur.total;
                        return acc;
                    }, {
                        ...defaultResults
                    }),
                    status: currentInventory.status,
                    createdAt: currentInventory.createdAt,
                    finalizedAt: currentInventory.finalizedAt ? currentInventory.finalizedAt : null
                };
                // console.log('detailByVenue', detailByVenue);
                res.json({
                    summary: response,
                    detailByVenue,
                    detailByBrand,
                    status: 200
                });
            }
            else {
                res.status(404).json({
                    message: 'Inventario no encontrado',
                    status: 404
                });
            }
        }
        catch (e) {
            console.log(e);
            res.status(400).json({
                message: e,
                status: 400
            });
        }
    }
    autoRotate(path) {
        // doc http://aheckmann.github.io/gm/docs.html
        /**** REQUIRE *****
          brew install imagemagick
          brew install graphicsmagick
        * */
        return new Promise((resolve, reject) => {
            GraphicsMagick(path)
                .autoOrient()
                .write(path, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
}
exports.default = new InventoryController();
//# sourceMappingURL=inventory.controller.js.map