"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const archiver = require("archiver");
const bluebird = require("bluebird");
const bson_1 = require("bson");
const fs = require("fs");
const GraphicsMagick = require("gm");
const https = require("https");
const mongoose = require("mongoose");
const app_1 = require("../../app");
const car_model_1 = require("../../app/models/car.model");
const car_model_2 = require("../../app/models/car.model");
const user_model_1 = require("../../app/models/user.model");
const user_model_2 = require("../../app/models/user.model");
const venue_model_1 = require("../../app/models/venue.model");
const server_1 = require("../../server");
const logger_service_1 = require("../../services/logger.service");
const push_service_1 = require("../../services/push.service");
const inventory_model_1 = require("../models/inventory.model");
const inventory_model_2 = require("../models/inventory.model");
const inventoryCar_model_1 = require("../models/inventoryCar.model");
const inventoryFile_model_1 = require("../models/inventoryFile.model");
const inventoryLabel_model_1 = require("../models/inventoryLabel.model");
class InventoryController {
    constructor() {
        this.index = this.index.bind(this);
        this.detail = this.detail.bind(this);
        this.create = this.create.bind(this);
        this.list = this.list.bind(this);
        this.detaill = this.detaill.bind(this);
        this.apiList = this.apiList.bind(this);
        this.apiDetail = this.apiDetail.bind(this);
        this.apiFoundCar = this.apiFoundCar.bind(this);
        this.uploadFile = this.uploadFile.bind(this);
        this.autoRotate = this.autoRotate.bind(this);
        this.resizeImage = this.resizeImage.bind(this);
        this.setLabel = this.setLabel.bind(this);
        this.finishInventory = this.finishInventory.bind(this);
        this.deleteInventory = this.deleteInventory.bind(this);
        this.reportCar = this.reportCar.bind(this);
        this.addComment = this.addComment.bind(this);
        this.downloadFile = this.downloadFile.bind(this);
        this.downloadImages = this.downloadImages.bind(this);
    }
    async index(req, res) {
        try {
            res.render('app/index', { token: await req.user.generateToken() });
        }
        catch (e) {
            console.log(e);
        }
    }
    async detail(req, res) {
        const { team } = req.user;
        const { id } = req.params;
        try {
            const inventory = await inventory_model_1.default.findOne({ _id: id, team });
            if (!inventory) {
                return res.status(404).render('404');
            }
            else {
                res.render('app/index', { token: await req.user.generateToken() });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            if (e) {
                res.status(500).send(e);
            }
        }
    }
    async create(req, res) {
        const { company, team } = req.user;
        const { carsByVenue, name, notification } = req.body;
        try {
            const inventoryCars = [];
            const venuesIDs = [];
            for (const venue of carsByVenue) {
                if (venue.name && venue.name.length) {
                    const venueRegExp = new RegExp(venue.name.trim(), 'i');
                    let currentVenue = await venue_model_1.default.findOne({
                        team,
                        name: venueRegExp
                    });
                    // create venue if no existe
                    if (currentVenue === null) {
                        currentVenue = new venue_model_1.default({
                            name: venue.name.trim(),
                            team,
                            company
                        });
                        await currentVenue.save();
                    }
                    venuesIDs.push(currentVenue._id.toString());
                    if (venue.cars && venue.cars.length) {
                        for (const car of venue.cars) {
                            let currentCar = await car_model_2.default.findOne({
                                team,
                                vin: car.vin
                            });
                            if (currentCar === null && car.vin && car.vin.trim().length) {
                                currentCar = new car_model_2.default({
                                    team,
                                    company,
                                    vin: car.vin,
                                    vin2: car.vin.substr(car.vin.length - 6),
                                    color: car.color,
                                    denomination: car.denomination,
                                    brand: car.brand,
                                    patent: car.patent,
                                    status: car_model_2.ChoicesStatusCar.active
                                });
                                await currentCar.save();
                            }
                            if (currentVenue && currentCar) {
                                inventoryCars.push({
                                    venue: currentVenue._id,
                                    car: currentCar._id,
                                    comments: [],
                                    images: []
                                });
                                app_1.queue.create('updateCar', {
                                    title: `updateCar ${car.vin}`,
                                    currentCar: currentCar._id,
                                    car
                                }).delay(10000).priority('high').attempts(5).save();
                            }
                        }
                    }
                }
            }
            const inventory = new inventory_model_1.default({
                name,
                company,
                team,
                venues: venuesIDs,
                createdBy: req.user._id,
                status: inventory_model_1.ChoicesStatusInventory.inProcess
            });
            await inventory.save();
            inventoryCars.map((i) => {
                i.inventory = inventory._id;
                return i;
            });
            await inventoryCar_model_1.default.insertMany(inventoryCars);
            if (notification) {
                const usersIDs = await user_model_1.default.find({
                    venue: {
                        $in: venuesIDs
                    },
                    team
                }, {
                    _id: true
                });
                push_service_1.default.massiveSend('Nuevo inventario', `Se ha iniciado el inventario "${inventory.name}"`, 'Ya puedes empezar a escanear', usersIDs.map((user) => user._id.toString()));
            }
            server_1.io.to(`inventory-list-${team}`).emit('REFRESH', {
                update: true
            });
            res.json({
                _id: inventory._id.toString(),
                message: 'Inventario creado satisfactoriamente',
                status: 200
            });
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`create: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            /* istanbul ignore next */
            res.status(400).json({
                message: e,
                status: 400
            });
        }
    }
    async list(req, res) {
        const { team } = req.user;
        const venuesPermissions = req.user.venuesPermissions();
        try {
            const response = [];
            const inventories = await inventory_model_1.default.aggregate([{
                    $match: {
                        team,
                        venues: {
                            $in: venuesPermissions
                        }
                    }
                }, {
                    $lookup: {
                        from: 'inventorycars',
                        localField: '_id',
                        foreignField: 'inventory',
                        as: 'cars'
                    }
                }, {
                    $unwind: '$cars'
                }, {
                    $match: {
                        'cars.venue': {
                            $in: venuesPermissions
                        }
                    }
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
                    [inventoryCar_model_1.ChoicesStatusCarInventory.pending]: 0,
                    [inventoryCar_model_1.ChoicesStatusCarInventory.found]: 0,
                    [inventoryCar_model_1.ChoicesStatusCarInventory.missing]: 0,
                    [inventoryCar_model_1.ChoicesStatusCarInventory.reported]: 0,
                    [inventoryCar_model_1.ChoicesStatusCarInventory.leftover]: 0
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
            /* istanbul ignore next */
            logger_service_1.default.error(`list: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            /* istanbul ignore next */
            res.status(400).json({
                message: e,
                status: 400
            });
        }
    }
    async apiDetail(req, res) {
        const { team } = req.user;
        const { id } = req.params;
        logger_service_1.default.info(`apiDetail`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, inventory: ${id}}`);
        try {
            const updatedUser = await user_model_2.default.findById(req.user._id);
            if (!updatedUser) {
                res.status(404).json({
                    message: 'No se ha encontrado el inventario solicitado.',
                    status: 404
                });
            }
            else {
                // const venuesPermissions = req.user.venuesPermissions();
                const inventory = await inventory_model_2.default
                    .findOne({
                    _id: id,
                    venues: updatedUser.venue,
                    status: {
                        $in: [inventory_model_1.ChoicesStatusInventory.inProcess]
                    },
                    team
                })
                    .populate([{
                        path: 'cars',
                        match: {
                            status: {
                                $in: [inventoryCar_model_1.ChoicesStatusCarInventory.pending, inventoryCar_model_1.ChoicesStatusCarInventory.found]
                            }
                            //   venue: {
                            //     $in: venuesPermissions
                            //   }
                        },
                        populate: [{
                                path: 'car',
                                select: ['vin', 'vin2', 'color', 'denomination', 'brand', 'patent']
                            }, {
                                path: 'venue',
                                select: ['name']
                            }]
                    }]).lean();
                if (inventory) {
                    res.status(200).json({
                        data: {
                            cars: inventory.cars
                                .map((car) => {
                                return {
                                    ...car.car,
                                    _id: car._id,
                                    venue: car.venue,
                                    status: car.status
                                };
                            }),
                            reasons: []
                        },
                        status: 200
                    });
                }
                else {
                    logger_service_1.default.error(`apiDetail: No se ha encontrado el inventario solicitado.`);
                    logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
                    res.status(404).json({
                        message: 'No se ha encontrado el inventario solicitado.',
                        status: 404
                    });
                }
            }
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`apiDetail: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            /* istanbul ignore next */
            res.status(400).json(e);
        }
    }
    async downloadFile(url, dest) {
        return new Promise(async (resolve, reject) => {
            try {
                // generate directory name from dest var
                const directories = dest.split('/');
                directories.pop();
                // validate that the directory exist and create recursive if it does not exist
                const directoyName = directories.join('/');
                if (!fs.existsSync(directoyName)) {
                    fs.mkdirSync(directoyName, { recursive: true });
                }
                const file = fs.createWriteStream(dest);
                // download file
                https.get(url, (response) => {
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve(response.headers['content-length'] ? parseInt(response.headers['content-length'], 10) : 0);
                    });
                });
            }
            catch (e) {
                // Validate that the file exists and delete it if it exists.
                if (fs.existsSync(dest)) {
                    fs.unlink(dest, (err) => {
                        if (err) {
                            reject(err);
                        }
                    });
                }
                else {
                    console.log(url);
                    reject(e);
                }
            }
        });
    }
    async uploadFile(req, res) {
        const { id } = req.params;
        const { team, venue, company } = req.user;
        logger_service_1.default.info(`uploadFile`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, inventory: ${id}}`);
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
                file.headers = {
                    'Content-Type': file.mimetype
                };
                file.team = team._id;
                file.venue = venue._id;
                file.inventory = id;
                inventoryFile.inventory = id;
                inventoryFile.user = req.user._id;
                inventoryFile.company = company._id;
                // fix exif
                if (new RegExp('\\bimage\\b').test(file.mimetype)) {
                    await this.autoRotate(file.path);
                }
                await inventoryFile.attach('file', file);
                await this.resizeImage(file.path);
                await inventoryFile.attach('thumbnail', file);
                await inventoryFile.save();
                res.status(201).json({
                    data: {
                        _id: inventoryFile._id,
                        file: inventoryFile.file
                    },
                    status: 201
                });
            }
            catch (e) {
                /* istanbul ignore next */
                logger_service_1.default.error(`uploadFile: Async Error.`);
                /* istanbul ignore next */
                logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
                /* istanbul ignore next */
                logger_service_1.default.error(e);
                /* istanbul ignore next */
                res.status(400).json(e);
            }
        }
        else {
            logger_service_1.default.error(`uploadFile: La imagen es obligatoria.`);
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            res.status(400).json({
                message: 'La imagen es obligatoria.',
                status: 400
            });
        }
    }
    async apiFoundCar(req, res) {
        const { team } = req.user;
        const { id } = req.params;
        const { vin, images } = req.body;
        logger_service_1.default.info(`apiFoundCar`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}}`);
        try {
            const updatedUser = await user_model_2.default.findById(req.user._id).populate([{
                    path: 'venue',
                    select: ['name']
                }]);
            if (!updatedUser) {
                return res.status(404).json({
                    message: 'No se ha encontrado el inventario solicitado.',
                    status: 404
                });
            }
            const venueId = updatedUser.venue._id;
            const inventory = await inventory_model_1.default.findOne({
                _id: id,
                team,
                status: inventory_model_1.ChoicesStatusInventory.inProcess
            });
            if (inventory) {
                const car = await car_model_1.default.findOne({
                    vin,
                    team
                });
                if (car) {
                    const inventoriedCar = await inventoryCar_model_1.default.findOne({
                        inventory: id,
                        car: car._id,
                        status: {
                            $in: [inventoryCar_model_1.ChoicesStatusCarInventory.found, inventoryCar_model_1.ChoicesStatusCarInventory.leftover]
                        }
                    });
                    if (inventoriedCar) {
                        logger_service_1.default.error(`apiFoundCar: Este vehículo ya ha sido inventariado`);
                        logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
                        res.status(400).json({
                            message: 'Este vehículo ya ha sido inventariado',
                            status: 400
                        });
                    }
                    else {
                        const inventoryCar = await inventoryCar_model_1.default.findOne({
                            inventory: id,
                            car: car._id
                        });
                        // if car in inventory
                        if (inventoryCar) {
                            inventoryCar.venueFound = venueId;
                            inventoryCar.status = inventoryCar_model_1.ChoicesStatusCarInventory.found;
                            inventoryCar.images = images ? images.map((image) => (new bson_1.ObjectID(image))) : [];
                            inventoryCar.inventoriedBy = req.user._id;
                            await inventoryCar.save();
                            server_1.io.to(`inventory-detail-${inventory._id}`).emit('REFRESH', {
                                title: 'Vehículo encontrado',
                                text: `${req.user.firstName} ${req.user.lastName} encontró ${car.brand} (${car.denomination}) en ${updatedUser.venue.name}.`,
                                status: inventoryCar_model_1.ChoicesStatusCarInventory.found,
                                venue: venueId,
                                update: true
                            });
                            server_1.io.to(`inventory-list-${team._id}`).emit('REFRESH', {
                                update: true
                            });
                            res.status(200).json({
                                vin: car.vin,
                                status: 200
                            });
                        }
                        else {
                            logger_service_1.default.error(`apiFoundCar: Este vehículo no se encuentra en el inventario.`);
                            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
                            res.status(400).json({
                                message: 'Este vehículo no se encuentra en el inventario.',
                                status: 400
                            });
                        }
                    }
                }
                else {
                    // if car no exist
                    logger_service_1.default.error(`apiFoundCar: Este vehículo no se encuentra en el inventario.`);
                    logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
                    res.status(400).json({
                        message: 'Este vehículo no se encuentra en el inventario.',
                        status: 400
                    });
                }
            }
            else {
                // if inventory no exist
                logger_service_1.default.error(`apiFoundCar: Este inventario no existe o ya no se encuentra activo.`);
                logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
                res.status(404).json({
                    message: 'Este inventario no existe o ya no se encuentra activo.',
                    status: 404
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`apiFoundCar: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, error: ${e}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            /* istanbul ignore next */
            res.status(400).json({
                message: e,
                status: 400
            });
        }
    }
    async finishInventory(req, res) {
        const { team } = req.user;
        const { id } = req.params;
        if (!req.user.hasPermission('finishInventory')) {
            return res.status(403).json({
                message: 'No tienes permisos para esta operación'
            });
        }
        try {
            const inventory = await inventory_model_1.default.findOne({ _id: id, team });
            if (inventory) {
                await inventory.update({
                    status: inventory_model_1.ChoicesStatusInventory.finalized,
                    finalizedAt: new Date(),
                    finalizedBy: req.user._id
                });
                server_1.io.to(`inventory-list-${team}`).emit('REFRESH', {
                    update: true
                });
                res.json({
                    message: 'Se ha finalizado correctamente el inventario.',
                    status: 200
                });
            }
            else {
                logger_service_1.default.error(`finishInventory: No se ha encontrado el inventario`);
                logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
                res.status(400).json({
                    message: 'No se ha encontrado el inventario',
                    status: 400
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`finishInventory: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            /* istanbul ignore next */
            res.status(400).json({
                message: 'Ha ocurrido un error',
                status: 400
            });
        }
    }
    async deleteInventory(req, res) {
        const { team } = req.user;
        const { id } = req.params;
        if (!req.user.hasPermission('deleteInventory')) {
            return res.status(403).json({
                message: 'No tienes permisos para esta operación'
            });
        }
        try {
            const inventory = await inventory_model_1.default.findOne({
                _id: id,
                team
            });
            if (inventory) {
                await inventoryCar_model_1.default.find({ inventory }).remove();
                await inventory.remove();
                server_1.io.to(`inventory-list-${team}`).emit('REFRESH', {
                    update: true
                });
                res.json({
                    message: 'Se ha eliminado correctamente el inventario.',
                    status: 200
                });
            }
            else {
                logger_service_1.default.error(`deleteInventory: No se ha encontrado el inventario`);
                logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
                res.status(400).json({
                    message: 'No se ha encontrado el inventario',
                    status: 400
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`deleteInventory: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            /* istanbul ignore next */
            res.status(400).json({
                message: 'Ha ocurrido un error',
                status: 400
            });
        }
    }
    async addComment(req, res) {
        const { inventory } = req.params;
        const { _id, comment } = req.body;
        try {
            await inventoryCar_model_1.default.update({
                inventory,
                _id
            }, {
                $push: {
                    comments: {
                        user: req.user._id,
                        comment,
                        createdAt: new Date()
                    }
                }
            }, {
                upsert: true
            });
            server_1.io.to(`inventory-detail-${inventory}`).emit('REFRESH', {
                update: true
            });
            server_1.io.to(`inventory-comment-${_id}`).emit('NEW_COMMENT', {
                _id: new bson_1.ObjectID(),
                user: {
                    _id: req.user._id,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName
                },
                comment
            });
            res.status(200).json({
                message: 'Comentario agregado satisfactoriamente.',
                status: 200
            });
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`addComment: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            /* istanbul ignore next */
            res.status(400).json({
                message: 'Ha ocurrido un error',
                status: 400
            });
        }
    }
    async downloadImages(req, res) {
        const { id } = req.params;
        const { cars } = req.body;
        const { team } = req.user;
        try {
            const inventory = await inventory_model_1.default.findOne({
                _id: id,
                team
            }, {
                name: true
            });
            if (inventory) {
                const inventoriesCars = await inventory_model_1.default.aggregate([{
                        $match: {
                            team,
                            _id: mongoose.Types.ObjectId(id)
                        }
                    }, {
                        $lookup: {
                            from: 'inventorycars',
                            localField: '_id',
                            foreignField: 'inventory',
                            as: 'cars'
                        }
                    }, {
                        $project: {
                            cars: {
                                $filter: {
                                    input: '$cars',
                                    as: 'cars',
                                    cond: {
                                        $and: [
                                            {
                                                $in: ['$$cars._id', cars.map((car) => mongoose.Types.ObjectId(car))]
                                            }, {
                                                $ne: ['$$cars.images', []]
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }, {
                        $unwind: '$cars'
                    }, {
                        $replaceRoot: {
                            newRoot: '$cars'
                        }
                    }, {
                        $lookup: {
                            from: 'inventoryfiles',
                            localField: 'images',
                            foreignField: '_id',
                            as: 'images'
                        }
                    }, {
                        $lookup: {
                            from: 'cars',
                            localField: 'car',
                            foreignField: '_id',
                            as: 'car'
                        }
                    }, {
                        $unwind: '$car'
                    }, {
                        $lookup: {
                            from: 'venues',
                            localField: 'venue',
                            foreignField: '_id',
                            as: 'venue'
                        }
                    }, {
                        $unwind: '$venue'
                    }, {
                        $project: {
                            images: 1,
                            venue: 1,
                            car: 1
                        }
                    }]);
                const archive = archiver('zip', {
                    zlib: {
                        level: 0
                    }
                });
                archive.on('error', (err) => {
                    res.status(500).send({
                        error: err.message
                    });
                });
                const filename = `${inventory.name}.zip`;
                archive.on('end', () => {
                    console.log(`${filename}: Archive wrote ${(archive.pointer() / (1024 * 1024)).toFixed(2)}MB`);
                });
                res.attachment(filename);
                const imagesToDownload = [];
                const imagesToCompress = [];
                for (const car of inventoriesCars) {
                    for (const image of car.images) {
                        const destDirectory = `/tmp/${car._id}${image._id}.${image.file.name.split('.')[image.file.name.split('.').length - 1]}`;
                        imagesToDownload.push(() => this.downloadFile(image.file.url, destDirectory));
                        imagesToCompress.push({
                            destDirectory,
                            name: `${car.car.vin}/IMAGE${image._id.toString().substr(image._id.length - 10, 10).toUpperCase()}.${image.file.name.split('.')[image.file.name.split('.').length - 1]}`
                        });
                    }
                }
                // download images
                console.log('EXECUTE PROMISES');
                let results = [];
                let numb = 1;
                while (imagesToDownload.length) {
                    console.log('promise', numb);
                    results = [...results, ...await bluebird.all(imagesToDownload.splice(0, 20).map((promise) => promise()))];
                    numb++;
                }
                // compress images
                console.log('EXECUTE COMPRESS');
                imagesToCompress.map((image) => {
                    archive.file(image.destDirectory, {
                        name: image.name
                    });
                    setTimeout(() => {
                        if (fs.existsSync(image.destDirectory)) {
                            console.log(`clear ${image.destDirectory}`);
                            fs.unlink(image.destDirectory, (err) => {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        }
                    }, 7200000);
                });
                console.log('results', results);
                res.setHeader('size', results.reduce((a, b) => a + b));
                archive.pipe(res);
                archive.finalize();
            }
            else {
                logger_service_1.default.error(`downloadImages: 'No se ha encontrado el inventario.`);
                logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
                res.status(404).json({
                    message: 'No se ha encontrado el inventario.',
                    status: 404
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`downloadImages: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            /* istanbul ignore next */
            res.status(400).json({
                message: e,
                status: 400
            });
        }
    }
    async reportCar(req, res) {
        const { team, company } = req.user;
        const { id } = req.params;
        const { vin, denomination, brand, color, images } = req.body;
        logger_service_1.default.info(`reportCar`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}}`);
        try {
            const updatedUser = await user_model_2.default.findById(req.user._id).populate([{
                    path: 'venue',
                    select: ['name']
                }]);
            if (!updatedUser) {
                return res.status(404).json({
                    message: 'No se ha encontrado el inventario solicitado.',
                    status: 404
                });
            }
            const venueId = updatedUser.venue._id;
            const inventory = await inventory_model_1.default.findOne({
                _id: id,
                status: inventory_model_1.ChoicesStatusInventory.inProcess,
                team
            });
            if (inventory) {
                const car = await car_model_2.default.findOneOrCreate({
                    vin,
                    team
                }, {
                    vin,
                    vin2: vin.substr(vin.length - 6),
                    brand,
                    denomination,
                    color,
                    team,
                    company,
                    status: car_model_2.ChoicesStatusCar.inventory
                });
                const inventoryCar = new inventoryCar_model_1.default({
                    car,
                    inventory,
                    venue: venueId,
                    venueFound: venueId,
                    comments: [],
                    inventoriedBy: req.user._id,
                    images: images ? images.map((image) => (new bson_1.ObjectID(image))) : [],
                    status: inventoryCar_model_1.ChoicesStatusCarInventory.reported
                });
                await inventoryCar.save();
                const textNotification = `${req.user.firstName} ${req.user.lastName} encontró ${car.brand} (${car.denomination}) en ${updatedUser.venue.name}.`;
                server_1.io.to(`inventory-detail-${inventory._id}`).emit('REFRESH', {
                    title: 'Vehículo reportado',
                    text: textNotification,
                    status: inventoryCar_model_1.ChoicesStatusCarInventory.reported,
                    venue: venueId,
                    update: true
                });
                server_1.io.to(`inventory-list-${team._id}`).emit('REFRESH', {
                    update: true
                });
                res.json({
                    message: 'Se ha generado el reporte correctamente.',
                    vin,
                    status: 200
                });
            }
            else {
                logger_service_1.default.error(`reportCar: Este inventario ya no se encuentra disponible.`);
                logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
                res.status(404).json({
                    message: 'Este inventario ya no se encuentra disponible.',
                    status: 404
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`reportCar: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            /* istanbul ignore next */
            res.status(400).json({
                message: e,
                status: 400
            });
        }
    }
    async setLabel(req, res) {
        const { team } = req.user;
        const { id } = req.params;
        const { car, label, custom, carID } = req.body;
        logger_service_1.default.info(`setLabel`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}, params: ${req.params}}`);
        try {
            const newLabel = await inventoryLabel_model_1.default.findOne({
                _id: label,
                team
            });
            if (newLabel) {
                const inventoryCar = await inventoryCar_model_1.default.findById(car, { venue: true });
                if (inventoryCar) {
                    await inventoryCar_model_1.default.update({
                        _id: car,
                        inventory: id
                    }, {
                        status: newLabel.sendTo,
                        label: newLabel._id,
                        labelBy: req.user._id,
                        labelText: custom
                    }, {
                        upsert: true
                    });
                    if (newLabel.isExhibition) {
                        await car_model_2.default.findOneAndUpdate({
                            _id: carID,
                            team
                        }, {
                            isExhibition: true
                        });
                    }
                    server_1.io.to(`inventory-detail-${id}`).emit('REFRESH', {
                        update: true,
                        venue: inventoryCar.venue
                    });
                    server_1.io.to(`inventory-list-${team}`).emit('REFRESH', {
                        update: true
                    });
                    res.json({
                        message: 'Opción procesada correctamente.',
                        status: 200
                    });
                }
            }
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`setLabel: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            /* istanbul ignore next */
            res.status(400).json({
                message: e,
                status: 400
            });
        }
    }
    async apiList(req, res) {
        const { team } = req.user;
        logger_service_1.default.info(`apiList`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
        try {
            const updatedUser = await user_model_2.default.findById(req.user._id);
            if (updatedUser) {
                const inventories = await inventory_model_1.default.find({
                    team,
                    venues: updatedUser.venue,
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
            else {
                logger_service_1.default.error(`apiList: Usuario no encontrado`);
                logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
                /* istanbul ignore next */
                res.status(400).json({
                    message: 'Usuario no encontrado',
                    status: 400
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`apiList: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            /* istanbul ignore next */
            res.status(400).json({
                message: e,
                status: 400
            });
        }
    }
    async detaill(req, res) {
        const { id } = req.params;
        const { team } = req.user;
        const venuesPermissions = req.user.venuesPermissions();
        try {
            // summary
            const inventory = await inventory_model_1.default.aggregate([
                {
                    $match: {
                        team,
                        _id: { $in: [mongoose.Types.ObjectId(id)] }
                    }
                }, {
                    $lookup: {
                        from: 'inventorycars',
                        localField: '_id',
                        foreignField: 'inventory',
                        as: 'cars'
                    }
                }, {
                    $unwind: '$cars'
                }, {
                    $match: {
                        $or: [
                            {
                                'cars.venue': {
                                    $in: venuesPermissions
                                }
                            },
                            {
                                'cars.venueFound': {
                                    $in: venuesPermissions
                                }
                            }
                        ]
                    }
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
                        team,
                        _id: { $in: [mongoose.Types.ObjectId(id)] }
                    }
                }, {
                    $lookup: {
                        from: 'inventorycars',
                        localField: '_id',
                        foreignField: 'inventory',
                        as: 'cars'
                    }
                }, {
                    $unwind: '$cars'
                }, {
                    $match: {
                        $or: [
                            {
                                'cars.venue': {
                                    $in: venuesPermissions
                                }
                            },
                            {
                                'cars.venueFound': {
                                    $in: venuesPermissions
                                }
                            }
                        ]
                    }
                }, {
                    $group: {
                        _id: {
                            category: {
                                $cond: {
                                    if: {
                                        $gt: ['$cars.venueFound', null]
                                    },
                                    then: '$cars.venueFound',
                                    else: '$cars.venue'
                                }
                            },
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
            /*
              console.log('################');
              cp.json(detailByVenues);
              console.log('################');
            * */
            // detail by brands
            const detailByBrands = await inventory_model_1.default.aggregate([
                {
                    $match: {
                        team,
                        _id: { $in: [mongoose.Types.ObjectId(id)] }
                    }
                }, {
                    $lookup: {
                        from: 'inventorycars',
                        localField: '_id',
                        foreignField: 'inventory',
                        as: 'cars'
                    }
                }, {
                    $unwind: '$cars'
                }, {
                    $match: {
                        $or: [
                            {
                                'cars.venue': {
                                    $in: venuesPermissions
                                }
                            },
                            {
                                'cars.venueFound': {
                                    $in: venuesPermissions
                                }
                            }
                        ]
                    }
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
                [inventoryCar_model_1.ChoicesStatusCarInventory.pending]: 0,
                [inventoryCar_model_1.ChoicesStatusCarInventory.found]: 0,
                [inventoryCar_model_1.ChoicesStatusCarInventory.leftover]: 0,
                [inventoryCar_model_1.ChoicesStatusCarInventory.missing]: 0,
                [inventoryCar_model_1.ChoicesStatusCarInventory.reported]: 0
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
                    _id: dv.info._id,
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
                const detailInventory = await inventory_model_1.default.findById(id, {
                    name: true,
                    status: true,
                    cars: true,
                    venues: true
                }).populate([{
                        path: 'cars',
                        match: {
                            $or: [{
                                    venue: {
                                        $in: venuesPermissions
                                    }
                                }, {
                                    venueFound: {
                                        $in: venuesPermissions
                                    }
                                }]
                        },
                        populate: [{
                                path: 'car',
                                select: ['vin', 'vin2', 'color', 'denomination', 'brand', 'venue', 'patent', 'internalNumber']
                            }, {
                                path: 'label'
                            }, {
                                path: 'venue',
                                select: ['name']
                            }, {
                                path: 'images'
                            }, {
                                path: 'venueFound',
                                select: ['name']
                            }, {
                                path: 'inventoriedBy',
                                select: ['firstName', 'lastName']
                            }, {
                                path: 'comments.user',
                                select: ['_id', 'firstName', 'lastName']
                            }]
                    }, {
                        path: 'venues',
                        select: ['_id', 'name'],
                        match: {
                            _id: {
                                $in: venuesPermissions
                            }
                        },
                        options: {
                            sort: {
                                name: 1
                            }
                        }
                    }]).lean();
                res.json({
                    summary: response,
                    labels: await inventoryLabel_model_1.default.find({
                        team,
                        active: true
                    }, {
                        name: true,
                        color: true,
                        affected: true,
                        sendTo: true,
                        isExhibition: true,
                        requireCustomText: true
                    }),
                    detailByVenue,
                    detailByBrand,
                    detail: detailInventory,
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
            /* istanbul ignore next */
            logger_service_1.default.error(`detaill: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            /* istanbul ignore next */
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
                    /* istanbul ignore next */
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    resizeImage(path) {
        // doc http://aheckmann.github.io/gm/docs.html
        /**** REQUIRE *****
         brew install imagemagick
         brew install graphicsmagick
         * */
        return new Promise((resolve, reject) => {
            GraphicsMagick(path)
                .resize(100, 100)
                .write(path, (err) => {
                if (err) {
                    /* istanbul ignore next */
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