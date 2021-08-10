"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const archiver = require("archiver");
const bluebird = require("bluebird");
const bson_1 = require("bson");
const excel = require("exceljs");
const fs = require("fs");
const GraphicsMagick = require("gm");
const https = require("https");
const moment = require("moment");
const mongoose = require("mongoose");
const Raven = require("raven");
const tempfile = require("tempfile");
const app_1 = require("../../app");
const car_model_1 = require("../../app/models/car.model");
const team_model_1 = require("../../app/models/team.model");
const teamSetting_model_1 = require("../../app/models/teamSetting.model");
const user_model_1 = require("../../app/models/user.model");
const venue_model_1 = require("../../app/models/venue.model");
const activityHistory_model_1 = require("../../billing/models/activityHistory.model");
const server_1 = require("../../server");
const logger_service_1 = require("../../services/logger.service");
const push_service_1 = require("../../services/push.service");
const general_utils_1 = require("../../utils/general.utils");
const inventory_model_1 = require("../models/inventory.model");
const inventoryCar_model_1 = require("../models/inventoryCar.model");
const inventoryFile_model_1 = require("../models/inventoryFile.model");
const inventoryLabel_model_1 = require("../models/inventoryLabel.model");
const stock_model_1 = require("../models/stock.model");
const stockCar_model_1 = require("../models/stockCar.model");
class InventoryController {
    constructor() {
        this.index = this.index.bind(this);
        this.stock = this.stock.bind(this);
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
        this.inventoryByCars = this.inventoryByCars.bind(this);
        this.dashboard = this.dashboard.bind(this);
        this.currentStock = this.currentStock.bind(this);
        this.loadStock = this.loadStock.bind(this);
    }
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
    async stock(req, res) {
        try {
            res.render('app/index', {
                token: await req.user.generateToken()
            });
        }
        catch (e) {
            console.log(e);
        }
    }
    async detail(req, res) {
        const team = req.user.team._id;
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
        const { name, manualPhoto, reportPhoto } = req.body;
        let { carsByVenue, notification } = req.body;
        carsByVenue = JSON.parse(carsByVenue);
        notification = notification === 'true';
        try {
            const inventoryCars = [];
            const activityHistories = [];
            const venuesIDs = [];
            for (const venue of carsByVenue) {
                if (venue.name && venue.name.trim().length) {
                    const venueRegExp = new RegExp(`^${venue.name.trim()}$`, 'i');
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
                            let currentCar = await car_model_1.default.findOne({
                                team,
                                vin: car.vin.trim()
                            });
                            if (currentCar === null && car.vin && car.vin.trim().length) {
                                currentCar = new car_model_1.default({
                                    team,
                                    company,
                                    vin: car.vin,
                                    vin2: car.vin.substr(car.vin.length - 6),
                                    color: car.color,
                                    type: car.type,
                                    property: car.property,
                                    denomination: car.denomination,
                                    brand: car.brand,
                                    patent: car.patent,
                                    createdBy: req.user,
                                    status: car_model_1.ChoicesStatusCar.active
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
                                activityHistories.push({
                                    team,
                                    company,
                                    user: req.user._id,
                                    type: activityHistory_model_1.ChoicesTypeActivity.inventory,
                                    car: {
                                        _id: currentCar._id,
                                        vin: currentCar.vin
                                    }
                                });
                                app_1.queue
                                    .create('updateCar', {
                                    title: `updateCar ${car.vin}`,
                                    currentCar: currentCar._id,
                                    car
                                })
                                    .delay(10000)
                                    .priority('high')
                                    .attempts(5)
                                    .save();
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
                status: inventory_model_1.ChoicesStatusInventory.inProcess,
                settings: {
                    photos: {
                        manual: manualPhoto,
                        report: reportPhoto
                    }
                }
            });
            const file = general_utils_1.default.getFileFromRequest(req.files, 'file');
            if (file) {
                file.team = team;
                await inventory.attach('file', file);
            }
            const backup = general_utils_1.default.getFileFromRequest(req.files, 'backup');
            if (backup) {
                backup.team = team;
                await inventory.attach('backup', backup);
            }
            await inventory.save();
            inventoryCars.map((i) => {
                i.inventory = inventory._id;
                return i;
            });
            activityHistories.map((a) => {
                a.inventory = {
                    _id: inventory._id,
                    name: inventory.name
                };
                return a;
            });
            await activityHistory_model_1.default.insertMany(activityHistories);
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
            server_1.io.to(`stock-${team}`).emit('REFRESH', {
                update: true
            });
            const currentTeam = await team_model_1.default.findById(req.user.team._id);
            app_1.queue.create('email', {
                from: '',
                title: `Inventory Notification`,
                to: `"soporte"<soporte@osacontrol.com>`,
                subject: `${req.user.firstName} ha creado un inventario en ${currentTeam.name}`,
                text: `Hola Soporte

        Se ha creado un nuevo inventario.

        Team: ${team.name}
        Usuario: ${req.user.firstName} ${req.user.lastName}
        ENV: ${process.env.ENV}

        En caso de dudas o consultas puedes contactarte a soporte@osacontrol.com o a nuestro twitter@TaskforceOSA.`,
                view: 'alerts/inventoryNotification',
                context: {
                    team: currentTeam,
                    user: req.user,
                    env: process.env.ENV
                }
            }).priority('high').attempts(5).save();
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
            res.status(500).json({
                message: e,
                status: 500
            });
        }
    }
    async list(req, res) {
        const team = req.user.team._id;
        const { page, pageSize } = req.query;
        const venuesPermissions = req.user.venuesPermissions();
        try {
            // paginate options
            const options = {
                select: {
                    _id: true
                },
                sort: {
                    createdAt: -1
                },
                page: parseInt(page ? page : '1', 10),
                limit: parseInt(pageSize ? pageSize : '10', 10)
            };
            const paginatedInventories = await inventory_model_1.default.paginate({
                team,
                venues: {
                    $in: venuesPermissions
                }
            }, options);
            if (options.page && paginatedInventories.pages && paginatedInventories.pages < options.page) {
                res.status(400).json({
                    message: 'La página solicitada no existe.',
                    status: 200
                });
            }
            else {
                const response = [];
                const inventories = await inventory_model_1.default.aggregate([{
                        $match: {
                            _id: {
                                $in: paginatedInventories.docs.map(v => v._id)
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
                            },
                            'cars.status': {
                                $in: [
                                    inventoryCar_model_1.ChoicesStatusCarInventory.pending,
                                    inventoryCar_model_1.ChoicesStatusCarInventory.found,
                                    inventoryCar_model_1.ChoicesStatusCarInventory.missing,
                                    inventoryCar_model_1.ChoicesStatusCarInventory.leftover,
                                    inventoryCar_model_1.ChoicesStatusCarInventory.reported
                                ]
                            }
                        }
                    }, {
                        $group: {
                            _id: {
                                category: '$_id',
                                status: '$status',
                                carStatus: '$cars.status',
                                name: '$name',
                                file: '$file',
                                backup: '$backup',
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
                            file: {
                                $first: '$_id.file'
                            },
                            backup: {
                                $first: '$_id.backup'
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
                            'file': 1,
                            'backup': 1,
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
                        file: req.user.hasPermission('viewFilesInventory') ? inventory.file : null,
                        backup: req.user.hasPermission('viewFilesInventory') ? inventory.backup : null,
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
                const teamSettings = await teamSetting_model_1.default.findOne({ team });
                res.json({
                    inventories: response,
                    inventorySettings: teamSettings.inventory,
                    count: paginatedInventories.total,
                    pages: paginatedInventories.pages,
                    hasPrevious: options.page && options.page > 1 && paginatedInventories.pages && paginatedInventories.pages >= options.page,
                    hasNext: options.page && paginatedInventories.pages && paginatedInventories.pages > options.page,
                    status: 200
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`list: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            /* istanbul ignore next */
            res.status(500).json({
                message: e,
                status: 500
            });
        }
    }
    async apiDetail(req, res) {
        const team = req.user.team._id;
        const { id } = req.params;
        logger_service_1.default.info(`apiDetail`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, inventory: ${id}}`);
        try {
            const updatedUser = await user_model_1.default.findById(req.user._id);
            if (!updatedUser) {
                res.status(404).json({
                    message: 'No se ha encontrado el inventario solicitado.',
                    status: 404
                });
            }
            else {
                // const venuesPermissions = req.user.venuesPermissions();
                const inventory = await inventory_model_1.default
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
            res.status(500).json(e);
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
        const { company, venue, team } = req.user;
        logger_service_1.default.info(`uploadFile`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, inventory: ${id}}`);
        const file = general_utils_1.default.getFileFromRequest(req.files, 'file');
        if (file) {
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
            const updatedUser = await user_model_1.default.findById(req.user._id).populate([{
                    path: 'venue',
                    select: ['name']
                }]);
            const teamSettings = await teamSetting_model_1.default.findOne({ team });
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
                        res.status(200).json({
                            message: 'Este vehículo ya ha sido inventariado',
                            status: 200
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
                            if (teamSettings.inventory.leftoverDifferentVenue && inventoryCar.venue.toString() !== venueId.toString()) {
                                inventoryCar.status = inventoryCar_model_1.ChoicesStatusCarInventory.leftover;
                                server_1.io.to(`inventory-detail-${inventory._id}`).emit('REFRESH', {
                                    title: 'Vehículo encontrado',
                                    text: `${req.user.firstName} ${req.user.lastName} encontró ${car.brand} (${car.denomination}) en ${updatedUser.venue.name}.`,
                                    status: inventoryCar_model_1.ChoicesStatusCarInventory.leftover,
                                    venue: venueId,
                                    update: true
                                });
                            }
                            else {
                                inventoryCar.status = inventoryCar_model_1.ChoicesStatusCarInventory.found;
                                server_1.io.to(`inventory-detail-${inventory._id}`).emit('REFRESH', {
                                    title: 'Vehículo encontrado',
                                    text: `${req.user.firstName} ${req.user.lastName} encontró ${car.brand} (${car.denomination}) en ${updatedUser.venue.name}.`,
                                    status: inventoryCar_model_1.ChoicesStatusCarInventory.found,
                                    venue: venueId,
                                    update: true
                                });
                            }
                            inventoryCar.images = images ? images.map((image) => (new bson_1.ObjectID(image))) : [];
                            inventoryCar.inventoriedBy = req.user._id;
                            await inventoryCar.save();
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
        const team = req.user.team._id;
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
                server_1.io.to(`stock-${team}`).emit('REFRESH', {
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
        const team = req.user.team._id;
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
                server_1.io.to(`stock-${team}`).emit('REFRESH', {
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
        const team = req.user.team._id;
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
        const { company, team } = req.user;
        const { id } = req.params;
        const { vin, patent, denomination, brand, color, images } = req.body;
        logger_service_1.default.info(`reportCar`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}}`);
        try {
            const updatedUser = await user_model_1.default.findById(req.user._id).populate([{
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
            let findCOnditions = {};
            let isVinAvailable = vin && vin.length > 0;
            if (vin)
                findCOnditions = { vin, team };
            if (!isVinAvailable && patent && patent.length > 0)
                findCOnditions = { patent, team };
            if (inventory) {
                const car = await car_model_1.default.findOneOrCreate(findCOnditions, {
                    vin,
                    vin2: vin.substr(vin.length - 6),
                    patent,
                    brand,
                    denomination,
                    color,
                    team,
                    company,
                    createdBy: req.user,
                    status: car_model_1.ChoicesStatusCar.inventory
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
        const team = req.user.team._id;
        const { id } = req.params;
        const { car, label, custom, carID } = req.body;
        logger_service_1.default.info(`setLabel`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}, params: ${JSON.stringify(req.params)}}`);
        try {
            if (label === 'deleted') {
                const inventoryCar = await inventoryCar_model_1.default.findById(car, { venue: true });
                if (inventoryCar) {
                    await inventoryCar_model_1.default.update({
                        _id: car,
                        inventory: id
                    }, {
                        status: inventoryCar_model_1.ChoicesStatusCarInventory.deleted,
                        deletedBy: req.user._id
                    }, {
                        upsert: true
                    });
                    server_1.io.to(`inventory-detail-${id}`).emit('REFRESH', {
                        update: true,
                        venue: inventoryCar.venue
                    });
                    server_1.io.to(`inventory-list-${team}`).emit('REFRESH', {
                        update: true
                    });
                }
                res.json({
                    message: 'Opción procesada correctamente.',
                    status: 200
                });
            }
            else {
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
                            await car_model_1.default.findOneAndUpdate({
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
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`setLabel: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            /* istanbul ignore next */
            res.status(500).json({
                message: e,
                status: 500
            });
        }
    }
    async apiList(req, res) {
        const team = req.user.team._id;
        logger_service_1.default.info(`apiList`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
        try {
            const updatedUser = await user_model_1.default.findById(req.user._id);
            if (updatedUser) {
                const inventories = await inventory_model_1.default.find({
                    team,
                    venues: updatedUser.venue,
                    status: {
                        $in: [inventory_model_1.ChoicesStatusInventory.inProcess]
                    }
                }, {
                    _id: true,
                    name: true,
                    settings: true
                }).lean();
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
        const team = req.user.team._id;
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
                    $unwind: { path: '$cars', preserveNullAndEmptyArrays: true }
                }, {
                    $match: {
                        $or: [
                            {
                                'cars.venue': {
                                    $in: venuesPermissions
                                }
                            }, {
                                'cars.venueFound': {
                                    $in: venuesPermissions
                                }
                            }
                        ],
                        'cars.status': {
                            $in: [
                                inventoryCar_model_1.ChoicesStatusCarInventory.pending,
                                inventoryCar_model_1.ChoicesStatusCarInventory.found,
                                inventoryCar_model_1.ChoicesStatusCarInventory.missing,
                                inventoryCar_model_1.ChoicesStatusCarInventory.leftover,
                                inventoryCar_model_1.ChoicesStatusCarInventory.reported
                            ]
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
                    $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true }
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
                            }, {
                                'cars.venueFound': {
                                    $in: venuesPermissions
                                }
                            }
                        ],
                        'cars.status': {
                            $in: [
                                inventoryCar_model_1.ChoicesStatusCarInventory.pending,
                                inventoryCar_model_1.ChoicesStatusCarInventory.found,
                                inventoryCar_model_1.ChoicesStatusCarInventory.missing,
                                inventoryCar_model_1.ChoicesStatusCarInventory.leftover,
                                inventoryCar_model_1.ChoicesStatusCarInventory.reported
                            ]
                        }
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
                            }, {
                                'cars.venueFound': {
                                    $in: venuesPermissions
                                }
                            }
                        ],
                        'cars.status': {
                            $in: [
                                inventoryCar_model_1.ChoicesStatusCarInventory.pending,
                                inventoryCar_model_1.ChoicesStatusCarInventory.found,
                                inventoryCar_model_1.ChoicesStatusCarInventory.missing,
                                inventoryCar_model_1.ChoicesStatusCarInventory.leftover,
                                inventoryCar_model_1.ChoicesStatusCarInventory.reported
                            ]
                        }
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
                    venues: true,
                    company: true,
                    team: true,
                }).populate([{
                        path: 'cars',
                        match: {
                            $or: [
                                {
                                    venue: {
                                        $in: venuesPermissions
                                    }
                                }, {
                                    venueFound: {
                                        $in: venuesPermissions
                                    }
                                }
                            ],
                            status: {
                                $in: [
                                    inventoryCar_model_1.ChoicesStatusCarInventory.pending,
                                    inventoryCar_model_1.ChoicesStatusCarInventory.found,
                                    inventoryCar_model_1.ChoicesStatusCarInventory.missing,
                                    inventoryCar_model_1.ChoicesStatusCarInventory.leftover,
                                    inventoryCar_model_1.ChoicesStatusCarInventory.reported
                                ]
                            }
                        },
                        populate: [{
                                path: 'car',
                                select: ['vin', 'vin2', 'internalNumber', 'color', 'denomination', 'brand', 'venue', 'patent', 'internalNumber', 'property', 'type']
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
                const teamSettings = await teamSetting_model_1.default.findOne({ team });
                const labels = await inventoryLabel_model_1.default.find({
                    team,
                    active: true
                }, {
                    name: true,
                    color: true,
                    affected: true,
                    sendTo: true,
                    isExhibition: true,
                    requireCustomText: true
                });
                res.json({
                    summary: response,
                    inventorySettings: teamSettings.inventory,
                    labels,
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
    async dashboard(req, res) {
        let venuesPermissions = req.user.venuesPermissions();
        const { venues } = req.body;
        const team = req.user.team._id;
        if (venues && venues.length) {
            venuesPermissions = venuesPermissions.filter((v) => venues.includes(v.toString()));
        }
        const total = 6;
        try {
            const inventory = await inventoryCar_model_1.default.aggregate([{
                    $match: {
                        createdAt: {
                            $gte: moment()
                                .subtract(total, 'months')
                                .startOf('month')
                                .toDate()
                        },
                        venue: {
                            $in: venuesPermissions
                        }
                    }
                }, {
                    $group: {
                        _id: {
                            status: '$status',
                            month: {
                                $dateToString: { format: '%Y-%m', date: '$createdAt' }
                            }
                        },
                        total: {
                            $sum: 1
                        }
                    }
                }, {
                    $group: {
                        _id: '$_id.month',
                        results: {
                            $push: {
                                status: '$_id.status',
                                total: '$total'
                            }
                        }
                    }
                }]);
            const data = {};
            const defaultResults = {
                [inventoryCar_model_1.ChoicesStatusCarInventory.pending]: 0,
                [inventoryCar_model_1.ChoicesStatusCarInventory.found]: 0,
                [inventoryCar_model_1.ChoicesStatusCarInventory.missing]: 0,
                [inventoryCar_model_1.ChoicesStatusCarInventory.reported]: 0,
                [inventoryCar_model_1.ChoicesStatusCarInventory.leftover]: 0
            };
            for (let i = 0; i <= total; i++) {
                const month = moment()
                    .subtract(total - i, 'months')
                    .format('YYYY-MM');
                data[month] = { ...defaultResults };
            }
            for (const item of inventory) {
                data[item._id] = item.results.reduce((acc, cur) => {
                    acc[cur.status] = cur.total;
                    return acc;
                }, {
                    ...defaultResults
                });
            }
            const teamSettings = await teamSetting_model_1.default.findOne({ team });
            res.json({
                data,
                inventorySettings: teamSettings.inventory
            });
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`inventory dashboard: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            Raven.captureException(e, { req });
            /* istanbul ignore next */
            res.status(500).json({
                message: JSON.stringify(e),
                status: 500
            });
        }
    }
    async inventoryByCars(req, res) {
        const team = req.user.team._id;
        try {
            /* generate file */
            const workbook = new excel.Workbook();
            const worksheet = workbook.addWorksheet('Detalle', {
                properties: {
                    defaultRowHeight: 30
                }, pageSetup: {
                    fitToPage: true, fitToHeight: 100, fitToWidth: 1
                }
            });
            worksheet.views = [{
                    state: 'frozen',
                    xSplit: 3,
                    ySplit: 1,
                    topLeftCell: 'D2',
                    activeCell: 'D2'
                }];
            const columns = [{
                    header: 'VIN',
                    key: 'vin',
                    width: 30,
                    alignment: {
                        wrapText: true
                    }
                }, {
                    header: 'MARCA',
                    key: 'marca',
                    width: 30,
                    alignment: {
                        wrapText: true
                    }
                }, {
                    header: 'MODELO',
                    key: 'modelo',
                    width: 40,
                    alignment: {
                        wrapText: true
                    }
                }];
            const venues = await venue_model_1.default.find({ team, deleted: false }).sort('name');
            for (const venue of venues) {
                columns.push({
                    header: venue.name, key: venue._id.toString(), width: 5,
                    style: {
                        alignment: {
                            vertical: 'middle',
                            horizontal: 'center'
                        }
                    }
                });
            }
            worksheet.columns = columns;
            worksheet.autoFilter = {
                from: 'A1',
                to: {
                    row: 1,
                    column: columns.length
                }
            };
            worksheet.getColumn(1).eachCell((cell) => {
                cell.alignment = {
                    vertical: 'middle',
                    textRotation: 0,
                    wrapText: true
                };
                cell.font = {
                    bold: true
                };
            });
            worksheet.getRow(1).eachCell((cell) => {
                const alignment = {
                    vertical: 'middle',
                    horizontal: 'center',
                    textRotation: 0,
                    wrapText: true
                };
                if (parseInt(cell.col, 10) > 3) {
                    alignment.textRotation = 90;
                }
                cell.alignment = alignment;
                cell.font = {
                    bold: true
                };
            });
            const cars = await car_model_1.default.find({
                team,
                isExhibition: false,
                createdAt: {
                    $gte: moment().subtract(6, 'months')
                    //   $lte: tf,
                }
            }, {
                vin: true,
                denomination: true,
                color: true,
                brand: true
            }).populate({
                path: 'inventories',
                select: ['name', 'createdAt', 'venueFound', 'status'],
                match: {
                    status: {
                        $in: [inventoryCar_model_1.ChoicesStatusCarInventory.found]
                    }
                },
                options: {
                    sort: {
                        createdAt: 1
                    }
                }
            });
            for (const car of cars) {
                const inventories = car.inventories;
                if (inventories.length) {
                    const carData = {
                        vin: car.vin,
                        marca: car.brand,
                        modelo: car.denomination
                    };
                    for (const inventory of inventories) {
                        carData[inventory.venueFound] = carData.hasOwnProperty(inventory.venueFound) ? carData[inventory.venueFound] + 1 : 1;
                    }
                    worksheet.addRow(carData);
                }
            }
            const tempFilePath = tempfile('.xlsx');
            await workbook.xlsx.writeFile(tempFilePath);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=detalle-inventarios.xlsx');
            return res.sendFile(tempFilePath);
        }
        catch (e) {
            console.log(e);
            return res.status(500).json({
                message: 'Ha ocurrido un error. Comunicate con soporte para que te ayudemos a solucionarlo.'
            });
        }
    }
    async loadStock(req, res) {
        const { company } = req.user;
        const team = req.user.team._id;
        const { carsByVenue } = req.body;
        try {
            const stockCars = [];
            for (const venue of carsByVenue) {
                const venueRegExp = new RegExp(`^${venue.name.trim()}$`, 'i');
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
                for (const car of venue.cars) {
                    let currentCar = await car_model_1.default.findOne({
                        team,
                        vin: car.vin.trim()
                    });
                    if (currentCar === null && car.vin && car.vin.trim().length) {
                        currentCar = new car_model_1.default({
                            team,
                            company,
                            vin: car.vin,
                            vin2: car.vin.substr(car.vin.length - 6),
                            color: car.color,
                            type: car.type,
                            property: car.property,
                            denomination: car.denomination,
                            brand: car.brand,
                            patent: car.patent,
                            createdBy: req.user,
                            status: car_model_1.ChoicesStatusCar.active
                        });
                        await currentCar.save();
                    }
                    if (currentVenue && currentCar) {
                        stockCars.push({
                            venue: currentVenue._id,
                            car: currentCar._id
                        });
                        app_1.queue
                            .create('updateCar', {
                            title: `updateCar ${car.vin}`,
                            currentCar: currentCar._id,
                            car
                        })
                            .delay(10000)
                            .priority('high')
                            .attempts(5)
                            .save();
                    }
                }
            }
            const stock = new stock_model_1.default({
                company,
                team,
                createdBy: req.user._id
            });
            await stock.save();
            stockCars.map((s) => {
                s.stock = stock._id;
                return s;
            });
            await stockCar_model_1.default.insertMany(stockCars);
            server_1.io.to(`stock-${team}`).emit('REFRESH', {
                update: true
            });
            res.json({
                message: 'Stock creado satisfactoriamente',
                status: 200
            });
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`loadStock: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            /* istanbul ignore next */
            res.status(500).json({
                message: e,
                status: 500
            });
        }
    }
    async currentStock(req, res) {
        try {
            const { company, venue } = req.user;
            const lastInventory = await inventory_model_1.default
                .findOne({
                company
            }, {
                name: true,
                status: true,
                cars: true,
                createdAt: true
            }, {
                sort: { 'createdAt': -1 }
            });
            const lastStock = await stock_model_1.default
                .findOne({
                company
            }, {}, {
                sort: { 'createdAt': -1 }
            });
            let showInventory = false;
            let showStock = false;
            if (lastInventory && !lastStock) {
                showInventory = true;
                console.log('showInventory');
            }
            else if (!lastInventory && lastStock) {
                showStock = true;
                console.log('showStock');
            }
            else if (lastInventory && lastStock) {
                console.log('lastInventory.createdAt', lastInventory.createdAt);
                console.log('lastStock.createdAt', lastStock.createdAt);
                console.log('moment(lastInventory.createdAt).isAfter(lastStock.createdAt)', moment(lastInventory.createdAt).isAfter(lastStock.createdAt));
                if (moment(lastInventory.createdAt).isAfter(lastStock.createdAt)) {
                    showInventory = true;
                    console.log('showInventory');
                }
                else {
                    showStock = true;
                    console.log('showStock');
                }
            }
            if (showInventory) {
                const inventory = await inventory_model_1.default
                    .findOne({
                    company
                }, {
                    name: true,
                    status: true,
                    cars: true
                }, {
                    sort: { 'createdAt': -1 }
                })
                    .populate([{
                        path: 'cars',
                        select: ['_id', 'car', 'venue', 'venueFound'],
                        match: {
                            status: {
                                $in: [
                                    inventoryCar_model_1.ChoicesStatusCarInventory.found,
                                    inventoryCar_model_1.ChoicesStatusCarInventory.leftover
                                ]
                            }
                        },
                        populate: [{
                                path: 'car',
                                select: ['vin', 'vin2', 'internalNumber', 'color', 'denomination', 'brand', 'venue', 'patent', 'internalNumber', 'property', 'type']
                            }, {
                                path: 'venue',
                                select: ['name'],
                                populate: [{
                                        path: 'region',
                                        select: ['code', 'name']
                                    }]
                            }, {
                                path: 'venueFound',
                                select: ['name'],
                                populate: [{
                                        path: 'region',
                                        select: ['code', 'name']
                                    }]
                            }]
                    }]).lean();
                if (!inventory) {
                    res
                        .status(200)
                        .json({
                        message: 'No se han realizado inventarios para ver el stock.',
                        cars: []
                    });
                }
                else if (inventory.status !== inventory_model_1.ChoicesStatusInventory.finalized) {
                    res
                        .status(200)
                        .json({
                        message: 'Se esta procesando la toma de inventario.',
                        cars: []
                    });
                }
                else if (await inventoryCar_model_1.default.find({ inventory, venue, status: inventoryCar_model_1.ChoicesStatusCarInventory.pending }).count()) {
                    res
                        .status(200)
                        .json({
                        message: 'Tú sucursal no ha terminado el inventario.',
                        cars: []
                    });
                }
                else {
                    res
                        .status(200)
                        .json({
                        message: '',
                        cars: inventory.cars
                    });
                }
            }
            else if (showStock) {
                const stock = await stock_model_1.default
                    .findOne({
                    company
                }, {
                    name: true,
                    status: true,
                    cars: true
                }, {
                    sort: { 'createdAt': -1 }
                })
                    .populate([{
                        path: 'cars',
                        select: ['_id', 'car', 'venue'],
                        populate: [{
                                path: 'car',
                                select: ['vin', 'vin2', 'internalNumber', 'color', 'denomination', 'brand', 'venue', 'patent', 'internalNumber', 'property', 'type']
                            }, {
                                path: 'venue',
                                select: ['name'],
                                populate: [{
                                        path: 'region',
                                        select: ['code', 'name']
                                    }]
                            }]
                    }]).lean();
                res
                    .status(200)
                    .json({
                    message: '',
                    cars: stock.cars
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`inventory currentStock: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger_service_1.default.error(e);
            Raven.captureException(e, { req });
            /* istanbul ignore next */
            res.status(500).json({
                message: JSON.stringify(e),
                status: 500
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
                    resolve({});
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
                    resolve(true);
                }
            });
        });
    }
}
exports.default = new InventoryController();
//# sourceMappingURL=inventory.controller.js.map