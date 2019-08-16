"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const excel = require("exceljs");
const bluebird = require("bluebird");
const tempfile = require("tempfile");
const moment = require("moment");
const mongoose = require("mongoose");
const app_1 = require("../../app");
const participant_model_1 = require("../../form/models/participant.model");
const inventory_model_1 = require("../../inventory/models/inventory.model");
const inventoryCar_model_1 = require("../../inventory/models/inventoryCar.model");
const logger_service_1 = require("../../services/logger.service");
const vin_service_1 = require("../../services/vin.service");
const car_model_1 = require("../models/car.model");
const user_model_1 = require("../models/user.model");
const venue_model_1 = require("../models/venue.model");
const kind_model_1 = require("../../form/models/kind.model");
const part_model_1 = require("../../form/models/part.model");
const position_model_1 = require("../../form/models/position.model");
class CarController {
    constructor() {
        this.carBrands = {
            'VF1': 'RENAULT',
            'VF2': 'RENAULT',
            'VF6': 'RENAULT',
            '8A1': 'RENAULT',
            '93Y': 'RENAULT',
            '9FB': 'RENAULT',
            '3BR': 'RENAULT',
            'JC1': 'MAZDA',
            'JMZ': 'MAZDA',
            'JM6': 'MAZDA',
            'JM7': 'MAZDA',
            'PE3': 'MAZDA',
            'MM8': 'MAZDA',
            'MM0': 'MAZDA',
            'MM7': 'MAZDA',
            '1YV': 'MAZDA',
            '3MD': 'MAZDA',
            'JS2': 'SUZUKI',
            'MMS': 'SUZUKI',
            'JS3': 'SUZUKI',
            'IJS': 'SUZUKI',
            'TSM': 'SUZUKI',
            'MA3': 'SUZUKI',
            'MHY': 'SUZUKI',
            'LJ1': 'JAC',
            'LS4': 'CHANGAN',
            'LSC': 'CHANGAN',
            'LS5': 'CHANGAN',
            'LPA': 'CHANGAN',
            'LVR': 'CHANGAN',
            'LVS': 'CHANGAN',
            'LGW': 'GREAT WALL'
        };
        this.generalDashboard = this.generalDashboard.bind(this);
        this.vinDashboard = this.vinDashboard.bind(this);
        this.vinDashboardDetail = this.vinDashboardDetail.bind(this);
        this.checkVIN = this.checkVIN.bind(this);
        this.processDamagedCar = this.processDamagedCar.bind(this);
        this.apiDamagesExport = this.apiDamagesExport.bind(this);
        this.addRevisions = this.addRevisions.bind(this);
        this.apiCars = this.apiCars.bind(this);
        this.apiRevisions = this.apiRevisions.bind(this);
        this.apiCarDetail = this.apiCarDetail.bind(this);
        this.getCars = this.getCars.bind(this);
        this.apiParticipantDetail = this.apiParticipantDetail.bind(this);
        this.apiParticipantsPerDate = this.apiParticipantsPerDate.bind(this);
    }
    async generalDashboard(req, res) {
        res.render('app/index', { token: await req.user.generateToken() });
    }
    async vinDashboard(req, res) {
        res.render('app/index', { token: await req.user.generateToken() });
    }
    async vinDashboardDetail(req, res) {
        const { id } = req.params;
        const { team } = req.user;
        // validate params
        /* istanbul ignore next */
        if (!mongoose.Types.ObjectId.isValid(id) || !await car_model_1.default.find({ _id: id, team }).count()) {
            return res.redirect('/cars/');
            // return res.status(404).render('404');
        }
        try {
            // validate car exist
            const car = await car_model_1.default.findOne({
                _id: id,
                lastForm: {
                    $exists: true,
                    $ne: null,
                    $in: await participant_model_1.default.find({
                        venue: {
                            $in: req.user.venuesPermissions()
                        }
                    }, {
                        _id: true
                    })
                },
                team
            });
            if (!car) {
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
    async checkVIN(req, res) {
        let { vin, vin2 } = req.body;
        const { inventory } = req.body;
        // const {multi} = req.query;
        const { team, company } = req.user;
        logger_service_1.default.info(`checkVIN`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}}`);
        /*
          {
            $group: {
              _id: {
                vin: {
                  $substr: ["$vin", 0, 3]
                },
                brand: "$brand"
              }
            }
          }
        */
        if (vin) {
            vin = vin.replace(/[\W_]+/g, '');
            logger_service_1.default.info(`VIN fixed: ${vin}`);
        }
        if (inventory) {
            try {
                const inventoryStatus = await inventory_model_1.default.findOne({
                    _id: inventory
                }, { status: true });
                if (inventoryStatus && inventoryStatus.status !== inventory_model_1.ChoicesStatusInventory.inProcess) {
                    logger_service_1.default.error(`checkVIN: Este inventario ya no se encuentra disponible.`);
                    logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
                    res.status(404).json({
                        message: 'Este inventario ya no se encuentra disponible.',
                        status: 404
                    });
                }
                else {
                    const inventoryQuery = {
                        team
                    };
                    if (vin) {
                        inventoryQuery.vin = vin;
                    }
                    if (vin2) {
                        if (vin2[0] === '0') {
                            const vinRegex = new RegExp(vin2.substr(vin2.length - 5), 'i');
                            inventoryQuery.vin2 = { $regex: vinRegex };
                        }
                        else {
                            const patentRegex = new RegExp(vin2, 'i');
                            inventoryQuery.$or = [{ vin2 }, { patent: patentRegex }];
                        }
                    }
                    const cars = await car_model_1.default.find(inventoryQuery, {
                        vin: true,
                        vin2: true,
                        brand: true,
                        color: true,
                        patent: true,
                        denomination: true
                    });
                    if (cars.length) {
                        const carsByID = cars.reduce((acc, cur) => {
                            acc[cur._id.toString()] = cur;
                            return acc;
                        }, {});
                        const inventoriedCar = await inventory_model_1.default.findOne({
                            _id: inventory,
                            team,
                            status: inventory_model_1.ChoicesStatusInventory.inProcess
                        }, {
                            'cars.car': true,
                            'cars.status': true,
                            'cars.venue': true
                        }).populate([{
                                path: 'cars',
                                populate: [{
                                        path: 'venue',
                                        select: ['name']
                                    }]
                            }]);
                        if (inventoriedCar) {
                            const carsInInventory = [];
                            for (const car of inventoriedCar.cars) {
                                if (carsByID.hasOwnProperty(car.car)) {
                                    const carToAdd = cars.find((ci) => {
                                        return ci._id.toString() === car.car.toString();
                                    });
                                    if (carToAdd && car.status !== inventoryCar_model_1.ChoicesStatusCarInventory.leftover) {
                                        carsInInventory.push({
                                            _id: carToAdd._id,
                                            vin: carToAdd.vin,
                                            vin2: carToAdd.vin2,
                                            color: carToAdd.color,
                                            denomination: carToAdd.denomination,
                                            status: car.status,
                                            venue: car.venue,
                                            brand: carToAdd.brand
                                        });
                                    }
                                }
                            }
                            if (carsInInventory.length) {
                                res.json({
                                    data: vin2 ? carsInInventory : carsInInventory[0],
                                    status: 200
                                });
                            }
                            else {
                                logger_service_1.default.error(`checkVIN: VIN no válido 1.`);
                                logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
                                res.status(400).json({
                                    message: 'VIN no válido.',
                                    status: 400
                                });
                            }
                        }
                        else {
                            logger_service_1.default.error(`checkVIN: Este inventario ya no se encuentra disponible.`);
                            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
                            res.status(404).json({
                                message: 'Este inventario ya no se encuentra disponible.',
                                status: 404
                            });
                        }
                    }
                    else {
                        logger_service_1.default.error(`checkVIN: VIN no válido 2.`);
                        logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
                        res.status(400).json({
                            message: 'VIN no válido.',
                            status: 400
                        });
                    }
                }
            }
            catch (e) {
                /* istanbul ignore next */
                if (e) {
                    /* istanbul ignore next */
                    logger_service_1.default.error(`checkVIN: Async Error.`);
                    /* istanbul ignore next */
                    logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
                    /* istanbul ignore next */
                    logger_service_1.default.error(e);
                    res.status(500).json(e);
                }
            }
        }
        else {
            if (vin) {
                try {
                    /* istanbul ignore next */
                    if (app_1.default.get('env') !== 'testing') {
                        const testDecode = vin_service_1.default.decode(vin);
                        logger_service_1.default.info(`vin decode ${JSON.stringify(testDecode)}`);
                    }
                    const indexBrand = vin.slice(0, 3);
                    vin2 = vin.substr(vin.length - 6);
                    const brand = this.carBrands.hasOwnProperty(indexBrand) ? this.carBrands[indexBrand] : null;
                    const car = await car_model_1.default.findOneOrCreate({
                        vin,
                        team
                    }, {
                        vin,
                        vin2,
                        company,
                        team,
                        brand,
                        createdBy: req.user,
                        status: car_model_1.ChoicesStatusCar.active
                    });
                    res.json({
                        data: {
                            _id: car._id,
                            vin: car.vin,
                            vin2: car.vin2,
                            brand: car.brand,
                            patent: car.patent,
                            color: car.color,
                            denomination: car.denomination
                        },
                        status: 200
                    });
                }
                catch (e) {
                    /* istanbul ignore next */
                    console.log(e);
                    /* istanbul ignore next */
                    if (e) {
                        res.status(500).send(e);
                    }
                }
            }
            else if (vin2) {
                // vin2 = vin2.replace(/[\W_]+/g, '');
                try {
                    const vinRegex = new RegExp('[a-zA-Z0]' + vin2.substr(vin2.length - 5), 'i');
                    const patentRegex = new RegExp(vin2, 'i');
                    const car = await car_model_1.default.find({
                        $or: [{ vin2: vin2 && vin2[0] === '0' ? { $regex: vinRegex } : vin2 }, { patent: patentRegex }],
                        team
                    }, {
                        vin: true,
                        vin2: true,
                        brand: true,
                        color: true,
                        patent: true,
                        denomination: true
                    });
                    if (car.length) {
                        res.json({
                            data: car,
                            status: 200
                        });
                    }
                    else {
                        logger_service_1.default.error(`checkVIN: VIN no encontrado.`);
                        logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
                        res.status(400).json({
                            message: 'VIN no encontrado.',
                            status: 400
                        });
                    }
                }
                catch (e) {
                    /* istanbul ignore next */
                    if (e) {
                        /* istanbul ignore next */
                        logger_service_1.default.error(`checkVIN: Async Error.`);
                        /* istanbul ignore next */
                        logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
                        /* istanbul ignore next */
                        logger_service_1.default.error(e);
                        res.status(500).send(e);
                    }
                }
            }
            else {
                logger_service_1.default.error(`checkVIN: VIN no encontrado.`);
                logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
                res.status(400).json({
                    message: 'VIN no encontrado.',
                    status: 400
                });
            }
        }
    }
    async apiParticipantsPerDate(req, res) {
        const { team } = req.user;
        try {
            const participantPerDay = await participant_model_1.default
                .aggregate([{
                    $match: {
                        venue: {
                            $in: req.user.venuesPermissions()
                        },
                        createdAt: {
                            $gte: moment().subtract(14, 'd').toDate()
                        }
                    }
                }, {
                    $project: {
                        _id: 1, user: 1, form: 1, car: 1, createdAt: {
                            $subtract: ['$createdAt', 4 * 60 * 60 * 1000]
                        }
                    }
                }, {
                    $group: {
                        // _id: {
                        //   $dateToString: {
                        //     format: '%Y-%m-%d',
                        //     date: '$createdAt'
                        //   },
                        // },
                        _id: {
                            category: {
                                $dateToString: {
                                    format: '%Y-%m-%d',
                                    date: '$createdAt'
                                    // timezone: 'America/Santiago'
                                }
                            },
                            user: '$user'
                        },
                        total: {
                            $sum: 1
                        }
                    }
                }, {
                    $lookup: {
                        from: 'users',
                        localField: '_id.user',
                        foreignField: '_id',
                        as: 'userInfo'
                    }
                }, {
                    $unwind: '$userInfo'
                }, {
                    $project: {
                        '_id.category': 1,
                        '_id.user': 1,
                        'total': 1,
                        'userInfo._id': 1,
                        'userInfo.firstName': 1,
                        'userInfo.lastName': 1
                    }
                }, {
                    $group: {
                        _id: '$_id.category',
                        users: {
                            $push: {
                                user: '$_id.user',
                                userInfo: '$userInfo',
                                total: '$total'
                            }
                        },
                        total: { $sum: '$total' }
                    }
                }, {
                    $sort: {
                        _id: 1
                    }
                }]);
            const importCarsPerDay = await car_model_1.default
                .aggregate([{
                    $match: {
                        team,
                        destination: { $ne: '' },
                        createdAt: {
                            $gte: moment().subtract(2, 'd').toDate()
                        }
                    }
                }, {
                    $project: {
                        _id: 1, createdAt: {
                            $subtract: ['$createdAt', 4 * 60 * 60 * 1000]
                        }
                    }
                }, {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$createdAt'
                                // timezone: 'America/Santiago'
                            }
                        },
                        total: {
                            $sum: 1
                        }
                    }
                }]);
            // normalize show last 14 days
            const participants = [];
            const cars = [];
            for (let i = 13; i >= 0; i--) {
                const key = moment().subtract(i, 'd').format('YYYY-MM-DD');
                const existInParticipantPerDay = participantPerDay.find((day) => day._id.toString() === key);
                const existInImportCarsPerDay = importCarsPerDay.find((day) => day._id.toString() === key);
                if (!existInParticipantPerDay) {
                    participants.push({
                        _id: key,
                        users: [],
                        total: 0
                    });
                }
                else {
                    participants.push(existInParticipantPerDay);
                }
                if (!existInImportCarsPerDay) {
                    cars.push({
                        _id: key,
                        total: 0
                    });
                }
                else {
                    cars.push(existInImportCarsPerDay);
                }
            }
            /* Update Venue in lastForm*/
            // const carsWithLastForm = await CarModel.find({
            //   company,
            //   $and: [{
            //       lastForm: {
            //         $exists: true
            //       }
            //     }, {
            //       lastForm: {
            //         $ne: null
            //       }
            //     }]
            // }, {
            //   lastForm: true
            // }).populate({
            //   path: 'lastForm',
            //   select: ['venue', 'reception', 'shipping', 'createdAt'],
            //   options: {
            //     sort: {
            //       createdAt: -1
            //     }
            //   },
            //   populate: [{
            //     path: 'venue',
            //     select: 'name'
            //   }]
            // });
            // const carsByVenue: any = {
            //   inTransit: {
            //     cars: []
            //   }
            // };
            // for (const car of carsWithLastForm) {
            //   if (car.lastForm.venue) {
            //     if (car.lastForm.reception) {
            //       if (!carsByVenue.hasOwnProperty(car.lastForm.venue.name)) {
            //         carsByVenue[car.lastForm.venue.name] = {
            //           cars: []
            //         };
            //       }
            //       carsByVenue[car.lastForm.venue.name].cars.push(car._id.toString());
            //     // } else if (car.lastForm.shipping) {
            //     } else {
            //       carsByVenue.inTransit.cars.push(car._id.toString());
            //     }
            //   }
            // }
            /* END Update Venue in lastForm */
            /* search participant and group per range qualification */
            // generate ranges
            const proyection = [];
            const proyectionInterval = 5;
            for (let i = 0; i < 100; i += proyectionInterval) {
                const max = i + proyectionInterval;
                if (i === 0) {
                    proyection.push({ $cond: [{ $and: [{ $gte: ['$qualification', i] }, { $lte: ['$qualification', max] }] }, `${i}-${max}`, ''] });
                }
                else {
                    proyection.push({ $cond: [{ $and: [{ $gt: ['$qualification', i] }, { $lte: ['$qualification', max] }] }, `${i}-${max}`, ''] });
                }
            }
            // get data
            const participantPerRange = await participant_model_1.default
                .aggregate([{
                    $match: {
                        venue: {
                            $in: req.user.venuesPermissions()
                        },
                        createdAt: {
                            $gte: moment().subtract(14, 'd').toDate()
                        }
                    }
                }, {
                    $project: {
                        range: {
                            $concat: [
                                { $cond: [{ $lt: ['$qualification', 0] }, 'Unknown', ''] },
                                // {$cond: [{$and: [{$gte: ['$qualification', 1]}, {$lt: ['$qualification', 10]}]}, '1-10', '']},
                                // {$cond: [{$and: [{$gte: ['$qualification', 11]}, {$lt: ['$qualification', 20]}]}, '11-20', '']},
                                // {$cond: [{$and: [{$gte: ['$qualification', 21]}, {$lt: ['$qualification', 30]}]}, '25-30', '']},
                                // {$cond: [{$and: [{$gte: ['$qualification', 31]}, {$lt: ['$qualification', 40]}]}, '31-40', '']},
                                // {$cond: [{$and: [{$gte: ['$qualification', 41]}, {$lt: ['$qualification', 50]}]}, '41-50', '']},
                                // {$cond: [{$and: [{$gte: ['$qualification', 51]}, {$lt: ['$qualification', 60]}]}, '51-60', '']},
                                // {$cond: [{$and: [{$gte: ['$qualification', 61]}, {$lt: ['$qualification', 70]}]}, '61-70', '']},
                                // {$cond: [{$and: [{$gte: ['$qualification', 71]}, {$lt: ['$qualification', 80]}]}, '71-80', '']},
                                // {$cond: [{$and: [{$gte: ['$qualification', 81]}, {$lt: ['$qualification', 90]}]}, '81-90', '']},
                                // {$cond: [{$and: [{$gte: ['$qualification', 91]}, {$lt: ['$qualification', 100]}]}, '91-100', '']},
                                ...proyection
                            ]
                        }
                    }
                }, {
                    $group: {
                        _id: '$range',
                        count: {
                            $sum: 1
                        }
                    }
                }]);
            res.json({
                carsByVenue: [],
                participants,
                participantPerRange,
                cars,
                totalCars: await car_model_1.default.count({ team }),
                status: 200
            });
        }
        catch (e) {
            /* istanbul ignore next */
            console.log('e', e);
            /* istanbul ignore next */
            if (e) {
                res.status(500).json(e);
            }
        }
    }
    /* istanbul ignore next */
    async apiParticipantCSV(req, res) {
        try {
            const participants = await participant_model_1.default.find({}).populate([{
                    path: 'car'
                }, {
                    path: 'user',
                    populate: [{
                            path: 'venue'
                        }]
                }, {
                    path: 'form'
                }, {
                    path: 'company'
                }]);
            // const cars = await CarModel.find({}).populate([{
            //   path: 'company'
            // }]);
            const data = [];
            data.push(`Company|VIN|Marca|Denominacion|Usuario|formulario|venue|calificacion|fecha|Cargado`);
            for (const participant of participants) {
                data.push(`${participant.company.name}|${participant.car.vin}|${participant.car.brand}|${participant.car.denomination}|${participant.user ? participant.user.fullName() : '-'}|${participant.form.name}|${participant.user ? participant.user.venue.name : '-'}|${participant.qualification.toString().replace('.', ',')}|${moment(participant.createdAt).format('DD/MM/YY HH:MM:SS')}`);
            }
            // for (const car of cars) {
            //   data.push(`${car.company.name}|${car.vin}|${car.brand}|${car.denomination}||||||${moment(car.createdAt).format('DD/MM/YY HH:MM:SS')}`);
            // }
            res.send(data.join('\n'));
        }
        catch (e) {
            console.log(e);
        }
    }
    async apiParticipantDetail(req, res) {
        const { id } = req.params;
        const { team } = req.user;
        try {
            const venuesPermissions = req.user.venuesPermissions();
            const participant = await participant_model_1.default
                .findOne({
                _id: id,
                team,
                $or: [{
                        venue: {
                            $in: venuesPermissions
                        }
                    }, {
                        venue: {
                            $exists: false
                        }
                    }, {
                        venue: null
                    }]
            }, {
                name: true,
                user: true,
                sections: true,
                qualification: true,
                shipping: true,
                shippingConfirmation: true,
                shippingText: true,
                shippingImages: true,
                reception: true,
                receptionConfirmation: true,
                receptionText: true,
                receptionImages: true,
                carrier: true,
                carrierText: true,
                carrierBy: true,
                conciliation: true,
                conciliationText: true,
                receiveFrom: true,
                receptionVenueText: true,
                sendTo: true,
                shippingVenueText: true,
                conciliationImages: true,
                createdAt: true
            })
                .populate([{
                    path: 'carrierBy',
                    select: ['name']
                }, {
                    path: 'receiveFrom',
                    select: ['name']
                }, {
                    path: 'sendTo',
                    select: ['name']
                }, {
                    path: 'user',
                    select: ['firstName', 'lastName']
                }, {
                    path: 'sections.answers.images'
                }, {
                    path: 'sections.answers.damagesSelected.images'
                }, {
                    path: 'shippingImages'
                }, {
                    path: 'receptionImages'
                }, {
                    path: 'conciliationImages'
                }]);
            // validate exist participant
            if (!participant) {
                res.status(404).json({
                    messsage: 'Formulario no encontrado.',
                    status: 404
                });
            }
            else {
                res.json({
                    data: participant,
                    status: 200
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            if (e) {
                res.status(500).json(e);
            }
        }
    }
    async apiCarDetail(req, res) {
        const { team } = req.user;
        const { id } = req.params;
        try {
            const venuesPermissions = req.user.venuesPermissions();
            const car = await car_model_1.default
                .findOne({
                _id: id,
                team
            }, {
                vin: true,
                brand: true,
                internalNumber: true,
                createdAt: true,
                patent: true,
                denomination: true,
                color: true
            })
                .populate([{
                    path: 'inventories',
                    match: {
                        inventory: {
                            $in: await inventory_model_1.default.find({
                                team,
                                venues: {
                                    $in: venuesPermissions
                                },
                                status: inventory_model_1.ChoicesStatusInventory.finalized
                            }, {
                                _id: true
                            })
                        },
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
                            path: 'venue',
                            select: ['name']
                        }, {
                            path: 'label'
                        }, {
                            path: 'venueFound',
                            select: ['name']
                        }, {
                            path: 'inventory',
                            select: ['name']
                        }, {
                            path: 'inventoriedBy',
                            select: ['firstName', 'lastName']
                        }, {
                            path: 'labelBy',
                            select: ['firstName', 'lastName']
                        }],
                    options: {
                        sort: {
                            createdAt: -1
                        }
                    }
                }, {
                    // reverse populate
                    path: 'participants',
                    select: ['number', 'name', 'user', 'createdAt', 'updatedAt', 'qualification', 'venue', 'shipping', 'reception'],
                    match: {
                        $or: [{
                                venue: {
                                    $in: venuesPermissions
                                }
                            }, {
                                venue: {
                                    $exists: false
                                }
                            }, {
                                venue: null
                            }]
                    },
                    options: {
                        sort: {
                            createdAt: -1
                        }
                    },
                    // deep populate user
                    populate: [{
                            path: 'venue',
                            select: ['name']
                        }, {
                            path: 'form',
                            select: ['shipping', 'reception']
                        }, {
                            path: 'user',
                            select: ['firstName', 'lastName']
                        }]
                }]).lean();
            if (!car) {
                res.status(404).json({
                    messsage: 'Auto no encontrado.',
                    status: 404
                });
            }
            else {
                res.json({
                    data: car,
                    status: 200
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            if (e) {
                res.status(500).json(e);
            }
        }
    }
    async apiRevisions(req, res) {
        const { page, pageSize, search, from, to } = req.query;
        const { team } = req.user;
        // paginate options
        const options = {
            select: {
                createdAt: true,
                number: true,
                car: true,
                venue: true,
                user: true,
                sections: true,
                qualification: true,
            },
            populate: [{
                    path: 'car',
                    select: ['vin', 'brand', 'denomination', 'color', 'lastForm'],
                    populate: {
                        path: 'lastForm',
                        select: ['createdAt']
                    }
                }, {
                    path: 'user',
                    select: ['firstName', 'lastName']
                }, {
                    path: 'venue',
                    select: ['name']
                }],
            sort: {
                createdAt: -1
            },
            page: parseInt(page ? page : 1, 10),
            limit: parseInt(pageSize ? pageSize : 20, 10)
        };
        try {
            const participantFilter = {
                $and: [{
                        venue: {
                            $in: req.user.venuesPermissions()
                        },
                        team
                    }]
            };
            if (search && search.length) {
                const searchText = new RegExp(search, 'i');
                const searchUser = await user_model_1.default.find({
                    $and: [{
                            $or: [{
                                    firstName: { $regex: searchText }
                                }, {
                                    lastName: { $regex: searchText }
                                }]
                        }, { team }]
                }, { _id: true });
                const searchVenue = await venue_model_1.default.find({
                    _id: {
                        $in: req.user.venuesPermissions()
                    },
                    name: {
                        $regex: searchText
                    },
                    team
                }, { _id: true });
                if (searchUser.length) {
                    participantFilter.$and.push({
                        user: {
                            $in: searchUser
                        }
                    });
                }
                else if (searchVenue.length) {
                    participantFilter.$and.push({
                        venue: {
                            $in: searchVenue
                        }
                    });
                }
                else {
                    const searchCar = await car_model_1.default.find({
                        $or: [{
                                vin: {
                                    $regex: searchText
                                }
                            }, {
                                brand: {
                                    $regex: searchText
                                }
                            }],
                        team
                    }, { _id: true });
                    participantFilter.$and.push({
                        car: {
                            $in: searchCar
                        }
                    });
                }
            }
            // check if any date filter
            if (from || to) {
                const createdAtFilter = {};
                if (from)
                    createdAtFilter.$gte = moment(from, 'YYYY-MM-DD').startOf('day');
                if (to)
                    createdAtFilter.$lte = moment(to, 'YYYY-MM-DD').endOf('day');
                // TODO. this is only querying for the last revisions
                participantFilter.$and.push({
                    createdAt: createdAtFilter
                });
            }
            const revisions = await this.getRevisions(participantFilter, options, search);
            // validate exist page
            if (options.page && revisions.pages && revisions.pages < options.page) {
                res.status(400).json({
                    message: 'La página solicitada no existe.',
                    status: 200
                });
            }
            else {
                res.json({
                    count: revisions.total,
                    pages: revisions.pages,
                    hasPrevious: options.page && options.page > 1 && revisions.pages && revisions.pages >= options.page,
                    hasNext: options.page && revisions.pages && revisions.pages > options.page,
                    results: revisions.docs,
                    status: 200
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            console.log(e);
            if (e) {
                res.status(500).json(e);
            }
        }
    }
    processDamagedCar(cache, participant, worksheet) {
        return new Promise(async (resolve, reject) => {
            const rows = [];
            const damages = [];
            for (const section of participant.sections) {
                for (const answer of section.answers) {
                    for (const damage of answer.damagesSelected) {
                        const kind = damage.kind && cache.kinds.hasOwnProperty(damage.kind.toString()) ? cache.kinds[damage.kind.toString()] : answer.damages.kinds
                            .find((d) => d._id && damage.kind && d._id.toString() == damage.kind.toString());
                        const part = damage.part && cache.parts.hasOwnProperty(damage.part.toString()) ? cache.parts[damage.part.toString()] : answer.damages.parts
                            .find((d) => d._id && damage.part && d._id.toString() == damage.part.toString());
                        const position = damage.position && cache.positions.hasOwnProperty(damage.position.toString()) ? cache.positions[damage.position.toString()] : answer.damages.positions
                            .find((d) => d._id && damage.position && d._id.toString() == damage.position.toString());
                        if (kind && part)
                            damages.push({ kind, part, position });
                    }
                }
            }
            for (const d in damages) {
                const idx = parseInt(d) + 1;
                const row = {
                    vin: participant.car.vin,
                    denomination: participant.car.denomination,
                    color: participant.car.color,
                    brand: participant.car.brand,
                    venue: participant.venue.name,
                    created_at: participant.createdAt,
                    user: `${participant.user.firstName} ${participant.user.lastName}`,
                    damages: `${damages.length}`,
                    has_damages: damages.length > 0 ? 'Sí' : 'No',
                    damage: idx,
                    position: damages[d].position ? damages[d].position.name : "-",
                    kind: damages[d].kind.name,
                    part: damages[d].part.name
                };
                worksheet.addRow(row);
            }
            resolve(rows);
        });
    }
    addRevisions(user, period, damagesCache, worksheet) {
        return new Promise(async (resolve, reject) => {
            const revisionsToProcess = [];
            const t0 = moment().subtract(period, 'weeks').startOf('week');
            const t1 = moment().subtract(period, 'weeks').endOf('week');
            const revisions = await participant_model_1.default.find({
                $and: [
                    {
                        createdAt: {
                            $gte: t0,
                            $lte: t1,
                        },
                    },
                    {
                        venue: {
                            $in: user.venuesPermissions()
                        },
                        'sections.answers.kind': 'damage',
                    }
                ]
            }, {
                createdAt: true,
                user: true,
                venue: true,
                car: true,
                'sections.answers.damages': true,
                'sections.answers.damagesSelected': true
            }).populate([
                {
                    path: 'user',
                    select: ['firstName', 'lastName']
                },
                {
                    path: 'car',
                    select: ['vin', 'vin2', 'denomination', 'color', 'brand']
                },
                {
                    path: 'venue',
                    select: ['name']
                }
            ]);
            for (const revision of revisions) {
                revisionsToProcess.push(this.processDamagedCar(damagesCache, revision, worksheet));
            }
            let results = [];
            while (revisionsToProcess.length) {
                results = [...results, ...await bluebird
                        .all(revisionsToProcess.splice(0, 100))
                ];
            }
            resolve(results);
        });
    }
    async apiDamagesExport(req, res) {
        if (!req.user.hasPermission('exportDamages')) {
            return res.status(403).json({
                message: 'No tienes permisos para esta operación'
            });
        }
        try {
            const { team } = req.user;
            const workbook = new excel.Workbook();
            const worksheet = workbook.addWorksheet('Daños', {
                properties: {
                    defaultRowHeight: 30
                }, pageSetup: {
                    fitToPage: true, fitToHeight: 100, fitToWidth: 1
                }
            });
            worksheet.autoFilter = { from: 'A1', to: 'F1' };
            const columns = [{
                    header: 'VIN', key: 'vin', width: 30
                }, {
                    header: 'Denominación', key: 'denomination', width: 30
                }, {
                    header: 'Color', key: 'color', width: 30
                }, {
                    header: 'Marca', key: 'brand', width: 30
                }, {
                    header: 'Sucursal', key: 'venue', width: 30
                }, {
                    header: 'Fecha', key: 'created_at', width: 30, style: { numFmt: 'dd/mm/yyyy hh:mm' }
                }, {
                    header: 'Usuario', key: 'user', width: 30
                }, {
                    header: 'Tiene daños', key: 'has_damages', width: 30
                }, {
                    header: 'Daños reportados', key: 'damages', width: 30
                }];
            columns.push({ header: 'Daño', key: 'damage', width: 30 });
            columns.push({ header: 'Parte', key: 'part', width: 30 });
            columns.push({ header: 'Tipo', key: 'kind', width: 30 });
            columns.push({ header: 'Posición', key: 'position', width: 30 });
            /* headers */
            worksheet.columns = columns;
            const periods = 2;
            const kinds = await kind_model_1.default.find({ team }, { name: true });
            const parts = await part_model_1.default.find({ team }, { name: true });
            const positions = await position_model_1.default.find({ team }, { name: true });
            const damagesCache = {
                kinds: kinds.reduce((acc, cur) => {
                    acc[cur._id.toString()] = cur;
                    return acc;
                }, {}),
                parts: parts.reduce((acc, cur) => {
                    acc[cur._id.toString()] = cur;
                    return acc;
                }, {}),
                positions: positions.reduce((acc, cur) => {
                    acc[cur._id.toString()] = cur;
                    return acc;
                }, {}),
            };
            const periodToProcess = [];
            for (let i = periods; i >= 0; i--) {
                periodToProcess.push(this.addRevisions(req.user, i, damagesCache, worksheet));
            }
            await bluebird.all(periodToProcess);
            /* formats */
            worksheet.getRow(1).eachCell((cell) => {
                cell.font = {
                    bold: true
                };
            });
            // const idCol = worksheet.getColumn('id');
            // idCol.eachCell({includeEmpty: true}, (cell) => {
            //   cell.alignment = {vertical: 'middle', horizontal: 'center'};
            // });
            const tempFilePath = tempfile('.xlsx');
            await workbook.xlsx.writeFile(tempFilePath);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=usuarios-21-03-2019.xlsx');
            return res.sendFile(tempFilePath);
        }
        catch (e) {
            /* istanbul ignore next */
            if (e) {
                console.log(e);
                res.status(500).json(e);
            }
        }
    }
    async apiRotationExport(req, res) {
        if (!req.user.hasPermission('exportRotation')) {
            return res.status(403).json({
                message: 'No tienes permisos para esta operación'
            });
        }
        try {
            const { team } = req.user;
            const workbook = new excel.Workbook();
            const worksheet = workbook.addWorksheet('Rotación de unidades', {
                properties: {
                    defaultRowHeight: 30
                }, pageSetup: {
                    fitToPage: true, fitToHeight: 100, fitToWidth: 1
                }
            });
            worksheet.autoFilter = { from: 'A1', to: 'F1' };
            worksheet.columns = [{
                    header: 'VIN', key: 'vin', width: 30
                }, {
                    header: 'Denominación', key: 'denomination', width: 30
                }, {
                    header: 'Color', key: 'color', width: 30
                }, {
                    header: 'Marca', key: 'brand', width: 30
                }, {
                    header: 'Tiempo inicio', key: 't0', width: 30
                }, {
                    header: 'Tiempo fin', key: 't1', width: 30
                }, {
                    header: 'Inventarios', key: 'inventories', width: 30
                }, {
                    header: 'Rotación', key: 'rotation', width: 30
                }];
            var i = 12;
            while (--i > 0) {
                const ti = moment().subtract(i * 15, 'day');
                const tf = moment().subtract((i - 1) * 15, 'day');
                console.log(ti.format("YYYY-MM-DD"), tf.format("YYYY-MM-DD"));
                let cars = await car_model_1.default.find({
                    team,
                    lastForm: { $exists: true },
                    createdAt: {
                        $gte: ti,
                        $lte: tf,
                    }
                }).populate({
                    path: 'inventories',
                    populate: {
                        path: 'venue',
                        model: 'Venue'
                    }
                }).populate({
                    path: 'participants',
                    populate: {
                        path: 'venue',
                        model: 'Venue'
                    }
                });
                for (const car of cars) {
                    const inventories = car.inventories.sort((i0, i1) => i0.createdAt > i1.createdAt);
                    if (inventories.length == 0)
                        continue;
                    const n = inventories.length;
                    const t0 = inventories[0].createdAt;
                    const t1 = inventories[n - 1].createdAt;
                    const row = {
                        vin: car.vin,
                        denomination: car.denomination,
                        color: car.color,
                        brand: car.brand,
                        t0: t0,
                        t1: t1,
                        inventories: n,
                        rotation: moment(t1).diff(moment(t0), 'days', true)
                    };
                    worksheet.addRow(row);
                }
            }
            const tempFilePath = tempfile('.xlsx');
            await workbook.xlsx.writeFile(tempFilePath);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=usuarios-21-03-2019.xlsx');
            return res.sendFile(tempFilePath);
        }
        catch (e) {
            /* istanbul ignore next */
            if (e) {
                console.log(e);
                res.status(500).json(e);
            }
        }
    }
    participantWithDamages(participant) {
        return new Promise((resolve) => {
            participant.hasDamages = participant.sections.some((section) => {
                return section.answers.some((answer) => {
                    return answer.damagesSelected.length > 0;
                });
            });
            resolve(participant);
        });
    }
    async apiCars(req, res) {
        const { page, pageSize, search } = req.query;
        // paginate options
        const options = {
            select: {
                vin: true,
                brand: true,
                denomination: true,
                color: true
            },
            populate: [{
                    path: 'lastForm',
                    select: ['createdAt', 'user', 'qualification', 'venue'],
                    populate: [{
                            path: 'user',
                            select: ['firstName', 'lastName']
                        }, {
                            path: 'venue',
                            select: ['name']
                        }]
                }],
            sort: {
                updatedAt: -1
            },
            page: parseInt(page ? page : 1, 10),
            limit: parseInt(pageSize ? pageSize : 20, 10)
        };
        try {
            const cars = await this.getCars({
                lastForm: {
                    $exists: true,
                    $ne: null,
                    $in: await participant_model_1.default.find({
                        venue: {
                            $in: req.user.venuesPermissions()
                        }
                    }, { _id: true })
                }
            }, options, search);
            // validate exist page
            if (options.page && cars.pages && cars.pages < options.page) {
                res.status(400).json({
                    message: 'La página solicitada no existe.',
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
            /* istanbul ignore next */
            if (e) {
                res.status(500).json(e);
            }
        }
    }
    getRevisions(filters, options, search) {
        return new Promise((resolve, reject) => {
            participant_model_1.default.paginate(filters, options, (err, result) => {
                if (err) {
                    /* istanbul ignore next */
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
    getCars(filters, options, search) {
        let filter = { ...filters };
        if (search && search.length) {
            const searchText = new RegExp(search, 'i');
            // search in vin and brand
            filter = {
                $and: [{
                        $or: [{
                                vin: {
                                    $regex: searchText
                                }
                            }, {
                                brand: {
                                    $regex: searchText
                                }
                            }]
                    }, filter]
            };
        }
        return new Promise((resolve, reject) => {
            car_model_1.default.paginate(filter, options, (err, result) => {
                if (err) {
                    /* istanbul ignore next */
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
}
exports.default = new CarController();
//# sourceMappingURL=car.controller.js.map