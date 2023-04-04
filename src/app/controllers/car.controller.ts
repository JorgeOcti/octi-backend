import * as bluebird from 'bluebird';
import * as excel from 'exceljs';
import * as moment from 'moment-timezone';
import * as mongoose from 'mongoose';
import * as tempfile from 'tempfile';

import CarModel, {
  Car,
  ChoicesStatusCar,
  ICarModel
} from '../models/car.model';
import FormModel, {
  IFormModel,
  KindForm,
  KindQuestion
} from '../../form/models/form.model';
import { IRequest } from '../../interfaces/global.interface';
import InventoryModel, {
  ChoicesStatusInventory
} from '../../inventory/models/inventory.model';
import {
  CustomLabels,
  PaginateOptions,
  PaginateResult,
  PipelineStage,
  Types
} from 'mongoose';
import ParticipantModel, {
  IParticipantAnswerModel
} from '../../form/models/participant.model';

import { ChoicesStatusCarInventory } from '../../inventory/models/inventoryCar.model';
import { IParticipant } from '../../form/interfaces/participant.interface';
import Kind from '../../form/models/kind.model';
import Part from '../../form/models/part.model';
import Planning from '../../planning/models/planning.model';
import Position from '../../form/models/position.model';
import { Response } from 'express';
import User from '../models/user.model';
import Venue from '../models/venue.model';
import conectaController from '../../request/controllers/conecta.controller';
import logger from '../../services/logger.service';
import Participant from '../../form/models/participant.model';

moment.tz.setDefault('America/Santiago');

class CarController {
  readonly aggregateCustomLabels: CustomLabels = {
    totalDocs: 'total',
    docs: 'docs',
    limit: 'perPage',
    page: 'currentPage',
    nextPage: 'next',
    prevPage: 'prev',
    totalPages: 'pages',
    hasPrevPage: 'hasPrevious',
    hasNextPage: 'hasNext',
    pagingCounter: 'pageCounter'
  };

  constructor() {
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
    this.processParticipant = this.processParticipant.bind(this);
    this.exportParticipants = this.exportParticipants.bind(this);
    this.listProperties = this.listProperties.bind(this);
    this.createCar = this.createCar.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    return res.render('app/index', { token: await req.user.generateToken() });
  }

  public async generalDashboard(req: IRequest, res: Response) {
    return res.render('app/index', { token: await req.user.generateToken() });
  }

  public async deliveries(req: IRequest, res: Response) {
    return res.render('app/index', { token: await req.user.generateToken() });
  }

  public async vinDashboard(req: IRequest, res: Response) {
    return res.render('app/index', { token: await req.user.generateToken() });
  }

  public async createCar(req: IRequest, res: Response) {
    try {
      const car = req.body;
      const { company, team } = req.user;

      const newCar = await CarModel.findOne({
        vin: car.vin,
        team
      });

      if (newCar) {
        newCar.vin2 = car.vin2;
        newCar.color = car.color ? car.color : newCar.color;
        newCar.denomination = car.denomination
          ? car.denomination
          : newCar.denomination;
        newCar.brand = car.brand ? car.brand : newCar.brand;
        newCar.patent = car.patent ? car.patent : newCar.patent;
        newCar.imported = false;
        newCar.createdBy = req.user;
        newCar.status = ChoicesStatusCar.active;
        await newCar.save();
      } else {
        await new CarModel({
          vin: car.vin,
          vin2: car.vin2,
          color: car.color ? car.color : '',
          denomination: car.denomination ? car.denomination : '',
          brand: car.brand ? car.brand : '',
          patent: car.patent ? car.patent : '',
          imported: false,
          company,
          team,
          createdBy: req.user,
          status: ChoicesStatusCar.active
        }).save();
      }

      res.json({
        status: 200
      });
    } catch (e) {
      /* istanbul ignore next */
      console.log(e);
    }
  }

  public async listProperties(req: IRequest, res: Response) {
    const { team } = req.user;
    try {
      // validate car exist
      const cars = await CarModel.aggregate([
        {
          $match: {
            team: team._id
          }
        },
        {
          $group: {
            _id: null,
            uniqueValues: {
              $addToSet: '$property'
            }
          }
        }
      ]);
      if (cars.length && cars[0].hasOwnProperty('uniqueValues')) {
        res.json(
          cars[0].uniqueValues
            .filter((v: string) => v.length > 0)
            .map((v: string) => ({ _id: v, name: v }))
            .sort((a: any, b: any) => {
              const x = a.name;
              const y = b.name;
              return x < y ? -1 : x > y ? 1 : 0;
            })
        );
      } else {
        res.json([]);
      }
    } catch (e) {
      /* istanbul ignore next */
      if (e) {
        res.status(500).send(e);
      }
    }
  }

  public async vinDashboardDetail(req: IRequest, res: Response) {
    const { id } = req.params;
    const { team } = req.user;
    // validate params
    /* istanbul ignore next */
    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !(await CarModel.find({ _id: id, team }).countDocuments())
    ) {
      return res.redirect('/cars/');
      // return res.status(404).render('404');
    }
    try {
      // validate car exist
      const car = await CarModel.findOne({
        _id: id,
        // lastForm: {
        //   $exists: true,
        //   $ne: null,
        //   $in: await ParticipantModel.find(
        //     {
        //       venue: {
        //         $in: req.user.venuesPermissions()
        //       }
        //     }, {
        //       _id: true
        //     })
        // },
        team: team._id
      });
      if (!car) {
        return res.status(404).render('404');
      } else {
        res.render('app/index', { token: await req.user.generateToken() });
      }
    } catch (e) {
      /* istanbul ignore next */
      if (e) {
        res.status(500).send(e);
      }
    }
  }

  public async checkVIN(req: IRequest, res: Response) {
    let { vin, vin2 } = req.body;
    const { inventory } = req.body;
    const team = req.user.team._id;
    logger.info(
      `CarController.checkVIN  ${req.user.email} body: ${JSON.stringify(
        req.body
      )}}`
    );
    if (vin) {
      vin = vin.replace(/[\W_]+/g, '');
      logger.info(`VIN fixed: ${vin}`);
    }
    if (inventory) {
      try {
        const inventoryStatus = await InventoryModel.findOne(
          {
            _id: inventory
          },
          { status: true }
        );
        if (
          inventoryStatus &&
          inventoryStatus.status !== ChoicesStatusInventory.inProcess
        ) {
          logger.error(
            `checkVIN: Este inventario ya no se encuentra disponible.`
          );
          logger.error(
            `{user: {_id: ${req.user._id}, email: ${req.user.email}}`
          );
          res.status(404).json({
            message: 'Este inventario ya no se encuentra disponible.',
            status: 404
          });
        } else {
          let carQuery: any = {
            $and: [{ team }]
          };
          if (vin) {
            carQuery = {
              $and: [...carQuery['$and'], { vin }]
            };
          }
          if (vin2) {
            if (vin2[0] === '0') {
              const vinRegex = new RegExp(vin2.substr(vin2.length - 5), 'i');
              carQuery = {
                $and: [
                  ...carQuery['$and'],
                  {
                    vin2: { $regex: vinRegex }
                  }
                ]
              };
            } else {
              // const patentRegex = new RegExp(vin2, 'i');
              carQuery = {
                $and: [
                  ...carQuery['$and'],
                  { $or: [{ vin2 }, { patent: vin2 }] }
                ]
              };
            }
          }
          const cars = await CarModel.find(carQuery, {
            vin: true,
            vin2: true,
            brand: true,
            color: true,
            patent: true,
            denomination: true
          }).lean();
          if (cars.length) {
            const carsByID = cars.reduce((acc: any, cur: any) => {
              acc[cur._id] = cur;
              return acc;
            }, {});
            const inventoriedCar = await InventoryModel.findOne(
              {
                _id: inventory,
                team,
                status: ChoicesStatusInventory.inProcess
              },
              {
                cars: true
              }
            ).populate([
              {
                path: 'cars',
                populate: [
                  {
                    path: 'venue',
                    select: ['name']
                  }
                ],
                select: ['car', 'status', 'venue']
              }
            ]);
            if (inventoriedCar) {
              const carsInInventory: any[] = [];
              for (const car of inventoriedCar.cars) {
                if (carsByID.hasOwnProperty(car.car)) {
                  const carToAdd: any = cars.find((ci) => {
                    return ci._id.toString() === car.car.toString();
                  });
                  if (
                    carToAdd &&
                    car.status !== ChoicesStatusCarInventory.leftover
                  ) {
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
                logger.debug(
                  `CarController.checkVIN.generic ${
                    req.user.email
                  } carsInInventory: ${JSON.stringify({ carsInInventory })}}`
                );
                res.json({
                  data: vin2 ? carsInInventory : carsInInventory[0],
                  status: 200
                });
              } else {
                logger.error(`checkVIN: VIN no válido 1.`);
                logger.error(
                  `{user: {_id: ${req.user._id}, email: ${req.user.email}}`
                );
                res.status(400).json({
                  message: 'VIN no válido.',
                  status: 400
                });
              }
            } else {
              logger.error(
                `checkVIN: Este inventario ya no se encuentra disponible.`
              );
              logger.error(
                `{user: {_id: ${req.user._id}, email: ${req.user.email}}`
              );
              res.status(404).json({
                message: 'Este inventario ya no se encuentra disponible.',
                status: 404
              });
            }
          } else {
            logger.error(`checkVIN: VIN no válido 2.`);
            logger.error(
              `{user: {_id: ${req.user._id}, email: ${req.user.email}}`
            );
            res.status(400).json({
              message: 'VIN no válido.',
              status: 400
            });
          }
        }
      } catch (e) {
        /* istanbul ignore next */
        if (e) {
          /* istanbul ignore next */
          logger.error(`checkVIN: Async Error.`);
          /* istanbul ignore next */
          logger.error(
            `{user: {_id: ${req.user._id}, email: ${req.user.email}}`
          );
          /* istanbul ignore next */
          logger.error(e);
          res.status(500).json(e);
        }
      }
    } else {
      try {
        let carFilter: any = {
          $and: [{ team }]
        };
        if (vin) {
          carFilter = {
            $and: [...carFilter['$and'], { vin }]
          };
          if (vin?.length > 5 && team === '5bf2de35caf8ef7096105cdd') {
            let { data: integrationData } =
              await conectaController.searchVinContecta(vin);
            if (integrationData?.length) {
              for (const car of integrationData) {
                await Car.updateOne(
                  {
                    team,
                    vin: car.vin
                  },
                  {
                    $set: {
                      vin2: car.vin.toString().substr(car.vin?.length - 6),
                      brand: car.brand,
                      denomination: car.denomination,
                      material: car.material,
                      color: car.color,
                      company: req.user.company?._id,
                      status: ChoicesStatusCar.active
                    }
                  },
                  {
                    upsert: true,
                    setDefaultsOnInsert: true
                  }
                );
              }
            }
          }
        }
        if (vin2) {
          if (vin2?.length > 5 && team === '5bf2de35caf8ef7096105cdd') {
            let { data: integrationData } =
              await conectaController.searchVinContecta(vin2);
            if (integrationData?.length > 1) {
              for (const car of integrationData) {
                try {
                  await Car.updateOne(
                    {
                      team,
                      vin: car.vin
                    },
                    {
                      $set: {
                        vin2: car.vin.toString().substr(car.vin?.length - 6),
                        brand: car.brand,
                        denomination: car.denomination,
                        material: car.material,
                        color: car.color,
                        company: req.user.company?._id,
                        status: ChoicesStatusCar.active
                      }
                    },
                    {
                      upsert: true,
                      setDefaultsOnInsert: true
                    }
                  );
                } catch (e) {
                  console.log(e);
                }
              }
            }
          }
          if (vin2[0] === '0') {
            const vinRegex = new RegExp(
              `${vin2.substr(vin2.length - 5)}$`,
              'i'
            );
            carFilter = {
              $and: [...carFilter['$and'], { vin2: vinRegex }]
            };
          } else {
            const patentRegex = new RegExp(vin2, 'i');
            carFilter = {
              $and: [
                ...carFilter['$and'],
                { $or: [{ vin2 }, { patent: patentRegex }] }
              ]
            };
          }
        }
        logger.debug(
          `CarController.checkVIN.generic ${
            req.user.email
          } carFilter: ${JSON.stringify(carFilter)}}`
        );
        const car = await CarModel.find(carFilter, {
          vin: true,
          vin2: true,
          brand: true,
          color: true,
          patent: true,
          denomination: true
        }).lean();
        if (car && car.length) {
          res.json({
            data: vin ? car[0] : car,
            status: 200
          });
        } else {
          logger.error(
            `CarController.checkVIN  ${req.user.email} no encontrado.`
          );
          res.status(400).json({
            message: 'VIN no encontrado.',
            status: 400
          });
        }
      } catch (e) {
        /* istanbul ignore next */
        if (e) {
          /* istanbul ignore next */
          logger.error(`checkVIN: Async Error.`);
          /* istanbul ignore next */
          logger.error(
            `{user: {_id: ${req.user._id}, email: ${req.user.email}}`
          );
          /* istanbul ignore next */
          logger.error(e);
          res.status(500).send(e);
        }
      }
    }
  }

  public async apiParticipantsPerDate(
    req: IRequest,
    res: Response
  ): Promise<any> {
    const team = req.user.team._id;
    try {
      const { companies, only_controls } = req.query;
      const venuesPermissions = req.user.venuesPermissions();
      let query: any = {
        $and: [
          {
            _id: {
              $in: venuesPermissions
            }
          }
        ]
      };
      if (companies) {
        query = {
          $and: [...query['$and'], { company: { $in: [companies] } }]
        };
      }

      const venuesByCompanies = await Venue.find(query);
      const venuesPermissionsFilterByCompanies = venuesByCompanies.map(
        (venue) => venue._id
      );

      let participantQuery: any = {
        $and: [
          {
            venue: {
              $in: venuesPermissionsFilterByCompanies
            },
            // reception: true,
            createdAt: {
              $gte: moment().subtract(30, 'd').toDate()
            }
          }
        ]
      };
      if (only_controls === '1') {
        participantQuery = {
          $and: [
            ...participantQuery['$and'],
            { kind: { $ne: KindForm.transmittal } }
          ]
        };
      }

      const participantReceivedPerDay = await ParticipantModel.aggregate([
        {
          $match: {
            $and: [...participantQuery['$and'], { reception: true }]
          }
        },
        {
          $project: {
            _id: 1,
            user: 1,
            form: 1,
            car: 1,
            createdAt: {
              $subtract: ['$createdAt', 4 * 60 * 60 * 1000]
            }
          }
        },
        {
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
                  date: '$createdAt',
                  timezone: 'America/Santiago'
                }
              },
              user: '$user'
            },
            total: {
              $sum: 1
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id.user',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        {
          $unwind: '$userInfo'
        },
        {
          $project: {
            '_id.category': 1,
            '_id.user': 1,
            total: 1,
            'userInfo._id': 1,
            'userInfo.firstName': 1,
            'userInfo.lastName': 1
          }
        },
        {
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
        },
        {
          $sort: {
            _id: 1
          }
        }
      ]);

      const participantSentPerDay = await ParticipantModel.aggregate([
        {
          $match: {
            $and: [...participantQuery['$and'], { shipping: true }]
          }
        },
        {
          $project: {
            _id: 1,
            user: 1,
            form: 1,
            car: 1,
            createdAt: {
              $subtract: ['$createdAt', 4 * 60 * 60 * 1000]
            }
          }
        },
        {
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
                  date: '$createdAt',
                  timezone: 'America/Santiago'
                }
              },
              user: '$user'
            },
            total: {
              $sum: 1
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id.user',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        {
          $unwind: '$userInfo'
        },
        {
          $project: {
            '_id.category': 1,
            '_id.user': 1,
            total: 1,
            'userInfo._id': 1,
            'userInfo.firstName': 1,
            'userInfo.lastName': 1
          }
        },
        {
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
        },
        {
          $sort: {
            _id: 1
          }
        }
      ]);

      const importCarsPerDay = await CarModel.aggregate([
        {
          $match: {
            team,
            destination: { $ne: '' },
            createdAt: {
              $gte: moment().subtract(30, 'd').toDate()
            }
          }
        },
        {
          $project: {
            _id: 1,
            createdAt: {
              $subtract: ['$createdAt', 4 * 60 * 60 * 1000]
            }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
                timezone: 'America/Santiago'
              }
            },
            total: {
              $sum: 1
            }
          }
        }
      ]);

      const planningPerDay = await Planning.aggregate([
        {
          $match: {
            team,
            date: {
              $gte: moment().subtract(30, 'd').toDate()
            }
          }
        },
        {
          $project: {
            _id: 1,
            date: 1
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$date',
                timezone: 'America/Santiago'
              }
            },
            total: {
              $sum: 1
            }
          }
        }
      ]);
      const planningByProcessing = await Planning.find(
        {
          team,
          date: {
            $gte: moment().subtract(30, 'd').toDate()
          }
        },
        { car: 1, date: 1 }
      )
        .populate([
          {
            path: 'car',
            select: ['vin', 'participants'],
            populate: [
              {
                path: 'participants',
                select: ['createdAt']
              }
            ]
          }
        ])
        .lean();

      const planningByProcessingByKey: any = {};
      for (const process of planningByProcessing) {
        const key = moment(process.date).format('YYYY-MM-DD');
        if (!planningByProcessingByKey.hasOwnProperty(key)) {
          planningByProcessingByKey[key] = {
            total: 0
          };
        }
        const isChecked = process.car.participants.filter(
          (participant: any) =>
            moment(participant.createdAt).format('YYYY-MM-DD') === key
        ).length;
        planningByProcessingByKey[key].total = isChecked
          ? planningByProcessingByKey[key].total + 1
          : planningByProcessingByKey[key].total;
      }

      // normalize show last days
      const participantsReceived = [];
      const planning = [];
      const planningProcess = [];
      const participantsSent = [];
      const cars = [];
      for (let i = 29; i >= 0; i--) {
        const key = moment().subtract(i, 'd').format('YYYY-MM-DD');
        const existInplanningPerDay = planningPerDay.find(
          (day) => day._id.toString() === key
        );
        const existInParticipantReceivedPerDay = participantReceivedPerDay.find(
          (day) => day._id.toString() === key
        );
        const existInParticipantSentPerDay = participantSentPerDay.find(
          (day) => day._id.toString() === key
        );
        const existInImportCarsPerDay = importCarsPerDay.find(
          (day) => day._id.toString() === key
        );
        if (!planningByProcessingByKey.hasOwnProperty(key)) {
          planningProcess.push({
            _id: key,
            total: 0
          });
        } else {
          planningProcess.push({
            id: key,
            total: planningByProcessingByKey[key].total
          });
        }
        if (!existInplanningPerDay) {
          planning.push({
            _id: key,
            total: 0
          });
        } else {
          planning.push(existInplanningPerDay);
        }
        if (!existInParticipantReceivedPerDay) {
          participantsReceived.push({
            _id: key,
            users: [],
            total: 0
          });
        } else {
          participantsReceived.push(existInParticipantReceivedPerDay);
        }
        if (!existInParticipantSentPerDay) {
          participantsSent.push({
            _id: key,
            users: [],
            total: 0
          });
        } else {
          participantsSent.push(existInParticipantSentPerDay);
        }
        if (!existInImportCarsPerDay) {
          cars.push({
            _id: key,
            total: 0
          });
        } else {
          cars.push(existInImportCarsPerDay);
        }
      }

      /* search participant and group per range qualification */
      const proyection = [];
      const proyectionInterval = 5;
      for (let i = 0; i < 100; i += proyectionInterval) {
        const max = i + proyectionInterval;
        if (i === 0) {
          proyection.push({
            $cond: [
              {
                $and: [
                  { $gte: ['$qualification', i] },
                  { $lte: ['$qualification', max] }
                ]
              },
              `${i}-${max}`,
              ''
            ]
          });
        } else {
          proyection.push({
            $cond: [
              {
                $and: [
                  { $gt: ['$qualification', i] },
                  { $lte: ['$qualification', max] }
                ]
              },
              `${i}-${max}`,
              ''
            ]
          });
        }
      }
      const participantPerRange = await ParticipantModel.aggregate([
        {
          $match: {
            $and: [
              {
                venue: {
                  $in: venuesPermissions
                },
                createdAt: {
                  $gte: moment().subtract(14, 'd').toDate()
                }
              }
            ]
          }
        },
        {
          $project: {
            range: {
              $concat: [
                { $cond: [{ $lt: ['$qualification', 0] }, 'Unknown', ''] },
                ...proyection
              ]
            }
          }
        },
        {
          $group: {
            _id: '$range',
            count: {
              $sum: 1
            }
          }
        }
      ]);
      const venues = await Venue.find({
        _id: { $in: venuesPermissions }
      }).populate([
        {
          path: 'company',
          select: ['id', 'name']
        }
      ]);
      const companiesData = [];
      const companiesIDS: string[] = [];
      for (const venue of venues) {
        const companieID = venue.company.id.toString();
        if (!companiesIDS.includes(companieID)) {
          companiesData.push(venue.company);
          companiesIDS.push(companieID);
        }
      }
      return res.json({
        planningPerDay,
        carsByVenue: [],
        companies: companiesData,
        participantsReceived,
        participantsSent,
        participantPerRange,
        planning,
        planningProcess,
        cars,
        totalCars: await CarModel.find({ team }).countDocuments(),
        status: 200
      });
    } catch (e) {
      /* istanbul ignore next */
      console.log('e', e);
      /* istanbul ignore next */
      if (e) {
        return res.status(500).json(e);
      }
    }
  }

  public getHeadersFromForm(form: IFormModel) {
    const columns = [];
    for (const section of form.sections) {
      for (const question of section.questions) {
        if (
          ['scale', 'accessory', 'numeric-scale', 'damage', 'text'].includes(
            question.kind
          )
        ) {
          columns.push({
            header: `${form.name} - ${question.question}`,
            key: `${form._id}-${question._id.toString()}`,
            width: 30
          });
        }
      }
    }
    if (form.shippingVenue) {
      columns.push({
        header: `${form.name} - ${form.shippingVenueText}`,
        key: `${form._id.toString()}-shipping`,
        width: 30
      });
    }
    if (form.receptionVenue) {
      columns.push({
        header: `${form.name} - ${form.receptionVenueText}`,
        key: `${form._id.toString()}-reception`,
        width: 30
      });
    }
    if (form.carrier) {
      columns.push({
        header: `${form.name} - ${form.carrierText}`,
        key: `${form._id.toString()}-carrier`,
        width: 30
      });
    }
    return columns;
  }

  private createObjectFromDamages(items: any[]) {
    let dict: any = {};
    items.map((item) => {
      return (dict[item._id.toString()] = item.name);
    });
    return dict;
  }

  private createObjectFromItems(items: any[]) {
    let dict: any = {};
    items.map((item) => {
      return (dict[item._id.toString()] = item.item);
    });
    return dict;
  }

  public processAnswer(answer: IParticipantAnswerModel, formID: String) {
    let datum = {};

    if (answer.kind === 'scale') {
      if (!answer.answer) {
        return {};
      }
      const selectedChoice = answer.scale.choices.find((choice) => {
        return choice._id.toString() === answer.answer.toString();
      });
      if (selectedChoice) {
        datum = {
          [`${formID}-${answer._id.toString()}`]: selectedChoice.choice
        };
      }
    } else if (answer.kind === 'text') {
      datum = {
        [`${formID}-${answer._id.toString()}`]: answer.comment
      };
    } else if (answer.kind === 'accessory') {
      let accessories = this.createObjectFromItems(answer.accessories.items);
      datum = {
        [`${formID}-${answer._id.toString()}`]: answer.accesoriesAnswered
          .map((item) => accessories[item.item] ?? '-')
          .join(';')
      };
    } else if (answer.kind === 'numeric-scale') {
      datum = {
        [`${formID}-${answer._id.toString()}`]: answer.score
      };
    } else if (answer.kind === 'damage') {
      let parts = this.createObjectFromDamages(answer.damages.parts);
      let kinds = this.createObjectFromDamages(answer.damages.kinds);
      let positions = this.createObjectFromDamages(answer.damages.positions);

      datum = {
        [`${formID}-${answer._id.toString()}`]: answer.damagesSelected
          .map(
            (item) =>
              `${parts[item.part] ?? '-'};${positions[item.position] ?? '-'};${
                kinds[item.kind] ?? '-'
              }${answer.requireSeverity ? `;${item.severity}` : ''}`
          )
          .join(';')
      };
    }
    return datum;
  }

  public processParticipant(participant: IParticipant): any {
    try {
      const datum = {
        number: participant.number,
        created_at: moment(participant.createdAt).subtract(4, 'hours').toDate(),
        brand: participant.car?.brand ?? '',
        denomination: participant.car?.denomination ?? '',
        color: participant.car?.color ?? '',
        user: participant.user
          ? `${participant.user.firstName} ${participant.user.lastName}`
          : '',
        company: participant.company.name,
        venue: participant.venue
          ? participant.venue.name
          : participant.user
          ? participant.user.venue.name
          : '',
        vin: participant.car ? participant.car.vin : '',
        plate: participant.car ? participant.car.patent : '',
        name: participant.name,
        reception: participant.reception ? 'SI' : 'NO',
        shipping: participant.shipping ? 'SI' : 'NO'
      };

      let sectionAnswers = {};

      for (const section of participant.sections) {
        for (const answer of section.answers) {
          sectionAnswers = {
            ...sectionAnswers,
            ...this.processAnswer(answer, participant.form.toString())
          };
        }
      }

      if (participant.shippingVenue) {
        sectionAnswers = {
          ...sectionAnswers,
          [`${participant.form.toString()}-shipping`]: participant.sendTo?.name
        };
      }
      if (participant.receptionVenue) {
        sectionAnswers = {
          ...sectionAnswers,
          [`${participant.form.toString()}-reception`]:
            participant.receiveFrom?.name
        };
      }
      if (participant.carrier) {
        sectionAnswers = {
          ...sectionAnswers,
          [`${participant.form.toString()}-carrier`]:
            participant.carrierBy?.name
        };
      }

      return {
        ...datum,
        ...sectionAnswers
      };
    } catch (e) {
      console.log(e);
    }
  }

  /* istanbul ignore next */
  public async exportParticipants(req: IRequest, res: Response) {
    try {
      logger.info(`CarController.exportParticipants email: ${req.user.email}`);
      logger.info(
        `CarController.exportParticipants email: ${
          req.user.email
        } query: ${JSON.stringify(req.query)}`
      );
      const team = req.user.team._id;
      const { userForms } = req.user;
      let { search, from, to, deliveries } = req.query as Record<
        string,
        string
      >;
      let queryForms = req.query.forms as string;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${
          deliveries === '1' ? 'deliveries' : 'revisiones'
        }-${moment().format('YYYY-MM-DD')}.xlsx`
      );
      // Create Excel Stream with pipe to response object
      const options = {
        stream: res,
        useStyles: true,
        useSharedStrings: true
      };
      const workbook = new excel.stream.xlsx.WorkbookWriter(options);

      const venuesPermissions = req.user.venuesPermissions();

      // Get filters for Mongo Query
      let targetForms = userForms.map((form) => form._id.toString());
      if (queryForms) {
        const formArray = queryForms.split(',');
        targetForms = formArray.filter((f) => targetForms.includes(f));
      }
      logger.debug(queryForms);
      logger.debug(JSON.stringify(targetForms));

      const queryFilter: any = {
        car: {
          $ne: null
        },
        team: new mongoose.Types.ObjectId(team),
        venue: {
          $in: venuesPermissions
        },
        deliveryToCustomer: deliveries === '1',
        form: {
          $in: targetForms.map((f) => new mongoose.Types.ObjectId(f))
        }
      };
      if (from && to) {
        queryFilter.createdAt = {
          $gte: moment.unix(Number(from)).hour(0).minute(0).toDate(),
          $lt: moment.unix(Number(to)).hour(23).minute(59).toDate()
        };
      }
      logger.debug(JSON.stringify(queryFilter));

      // Get the forms to create columns/header of excel
      let forms = await ParticipantModel.find(queryFilter).distinct('form');
      forms = await FormModel.find({ _id: { $in: forms } });

      // Create columns/headers for excel
      let columns = [
        {
          header: '#',
          key: 'number',
          width: 30
        },
        {
          header: 'Fecha',
          key: 'created_at',
          width: 30,
          style: {
            numFmt: 'dd/mm/yyyy hh:mm'
          }
        },
        {
          header: 'Marca',
          key: 'brand',
          width: 30
        },
        {
          header: 'Denominación',
          key: 'denomination',
          width: 30
        },
        {
          header: 'Color',
          key: 'color',
          width: 30
        },
        {
          header: 'Usuario',
          key: 'user',
          width: 30
        },
        {
          header: 'Compañía',
          key: 'company',
          width: 30
        },
        {
          header: 'Sucursal',
          key: 'venue',
          width: 30
        },
        {
          header: 'VIN',
          key: 'vin',
          width: 30
        },
        {
          header: 'Formulario',
          key: 'name',
          width: 30
        },
        {
          header: 'Recepcionado',
          key: 'reception',
          width: 30
        },
        {
          header: 'Enviado',
          key: 'shipping',
          width: 30
        }
      ];

      // create additional columns/headers based of form questions
      for (const form of forms) {
        columns = columns.concat(this.getHeadersFromForm(form));
      }

      const worksheet = workbook.addWorksheet('Controles', {
        pageSetup: {
          fitToPage: true,
          fitToHeight: 100,
          fitToWidth: 1
        }
      });
      worksheet.columns = columns;

      let searchTextFilter: any = {};

      if (search?.length > 0) {
        search = search.replace(/[^a-z0-9 A-ZÀ-ú]+/g, '').trim();
        // search = search.trim().replace("*", "");
        logger.info(
          `CarController.exportParticipants: email: ${req.user.email} search: ${search}`
        );
        const searchText = new RegExp(search, 'i');
        const searchTextArray = search.split(' ');

        // User first name and last name
        const filterUser: any = {
          $and: []
        };
        //User
        if (searchTextArray.length > 3) {
          filterUser['$or'] = [
            {
              firstName: {
                $regex: new RegExp(
                  `${searchTextArray[0]} ${searchTextArray[1]}`,
                  'i'
                )
              },
              lastName: {
                $regex: new RegExp(
                  `${searchTextArray[2]} ${searchTextArray[3]}`,
                  'i'
                )
              }
            }
          ];
        } else {
          filterUser['$and'].push({
            'user.firstName': {
              $regex: new RegExp(searchTextArray[0], 'i')
            }
          });
          if (searchTextArray.length > 1) {
            filterUser['$and'].push({
              'user.lastName': {
                $regex: new RegExp(searchTextArray[1], 'i')
              }
            });
          }
        }

        //Car (VIN or Brand)
        const filterCar: any = {
          $or: [
            {
              'car.vin': {
                $regex: searchText
              }
            },
            {
              'car.patent': {
                $regex: searchText
              }
            },
            {
              'car.brand': {
                $regex: searchText
              }
            }
          ]
        };
        //Venue (name)
        const filterVenue: any = {
          'venue.name': {
            $regex: searchText
          }
        };

        searchTextFilter = {
          $or: [filterUser, filterCar, filterVenue]
        };
      }

      let aggregation: any[] = [
        {
          $project: {
            number: 1,
            createdAt: 1,
            deliveryToCustomer: 1,
            car: 1,
            user: 1,
            company: 1,
            team: 1,
            venue: 1,
            name: 1,
            receptionText: 1,
            shippingText: 1,
            sections: 1,
            form: 1,
            shippingVenue: 1,
            receptionVenue: 1,
            sendTo: 1,
            receiveFrom: 1,
            reception: 1,
            shipping: 1,
            carrier: 1,
            carrierText: 1,
            carrierBy: 1
          }
        },
        {
          $match: queryFilter
        },
        {
          $lookup: {
            from: 'cars',
            localField: 'car',
            foreignField: '_id',
            as: 'car'
          }
        },
        {
          $unwind: { path: '$car', preserveNullAndEmptyArrays: true }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: { path: '$user', preserveNullAndEmptyArrays: true }
        },
        {
          $lookup: {
            from: 'venues',
            localField: 'user.venue',
            foreignField: '_id',
            as: 'user.venue'
          }
        },
        {
          $unwind: { path: '$user.venue', preserveNullAndEmptyArrays: true }
        },
        {
          $lookup: {
            from: 'venues',
            localField: 'venue',
            foreignField: '_id',
            as: 'venue'
          }
        },
        {
          $unwind: { path: '$venue', preserveNullAndEmptyArrays: true }
        },
        {
          $lookup: {
            from: 'venues',
            localField: 'receiveFrom',
            foreignField: '_id',
            as: 'receiveFrom'
          }
        },
        {
          $unwind: { path: '$receiveFrom', preserveNullAndEmptyArrays: true }
        },
        {
          $lookup: {
            from: 'venues',
            localField: 'sendTo',
            foreignField: '_id',
            as: 'sendTo'
          }
        },
        {
          $unwind: { path: '$sendTo', preserveNullAndEmptyArrays: true }
        },
        {
          $lookup: {
            from: 'carriers',
            localField: 'carrierBy',
            foreignField: '_id',
            as: 'carrierBy'
          }
        },
        {
          $unwind: { path: '$carrierBy', preserveNullAndEmptyArrays: true }
        },
        {
          $lookup: {
            from: 'companies',
            localField: 'company',
            foreignField: '_id',
            as: 'company'
          }
        },
        {
          $unwind: { path: '$company', preserveNullAndEmptyArrays: true }
        }
      ];

      if (searchTextFilter) {
        aggregation.push({
          $match: searchTextFilter
        });
      }

      logger.debug(JSON.stringify(aggregation));

      // Create Mongo Query in Cursor/Stream Mode for all the participants/answers
      const cursor = ParticipantModel.aggregate(aggregation).cursor();

      await cursor.eachAsync(
        async (participant) => {
          const row = await this.processParticipant(participant);
          worksheet.addRow(row).commit();
        },
        { parallel: 100 }
      );

      cursor.close();
      workbook.commit();

      // code to handle connection abort or finish of data send
      req.connection.on('close', async () => {
        cursor.close();
      });
    } catch (e) {
      logger.error(e);
    }
  }

  public async apiParticipantDetail(req: IRequest, res: Response) {
    const { id } = req.params;
    const team = req.user.team._id;
    try {
      const venuesPermissions = req.user.venuesPermissions();
      const participant = await ParticipantModel.findOne(
        {
          _id: id,
          team,
          $or: [
            {
              venue: {
                $in: venuesPermissions
              }
            },
            {
              venue: {
                $exists: false
              }
            },
            {
              venue: null
            }
          ]
        },
        {
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
          createdAt: true,
          kind: true
        }
      ).populate([
        {
          path: 'carrierBy',
          select: ['name']
        },
        {
          path: 'car',
          select: ['vin', 'brand', 'denomination', 'color', 'patent']
        },
        {
          path: 'receiveFrom',
          select: ['name']
        },
        {
          path: 'sendTo',
          select: ['name']
        },
        {
          path: 'user',
          select: ['firstName', 'lastName']
        },
        {
          path: 'sections.answers.images'
        },
        {
          path: 'sections.answers.damagesSelected.images'
        },
        {
          path: 'shippingImages'
        },
        {
          path: 'receptionImages'
        },
        {
          path: 'conciliationImages'
        }
      ]);
      // validate exist participant
      if (!participant) {
        res.status(404).json({
          messsage: 'Formulario no encontrado.',
          status: 404
        });
      } else {
        res.json({
          data: participant,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      res.status(500).json(e);
    }
  }

  public async apiCarDetail(req: IRequest, res: Response) {
    const team = req.user.team._id;
    const { id } = req.params;
    try {
      const venuesPermissions = req.user.venuesPermissions();
      let car = await CarModel.findOne(
        {
          $and: [
            {
              _id: id,
              team
            }
          ]
        },
        {
          vin: true,
          brand: true,
          material: true,
          internalNumber: true,
          createdAt: true,
          patent: true,
          denomination: true,
          color: true
        }
      ).allowDiskUse(true);

      const inventoriesIDS = await InventoryModel.find(
        {
          $and: [
            {
              team,
              venues: {
                $in: venuesPermissions
              },
              createdAt: {
                $gte: car!.createdAt
              }
              // status: ChoicesStatusInventory.finalized
            }
          ]
        },
        {
          _id: true
        }
      ).distinct('_id');

      car = await CarModel.populate(car, [
        {
          path: 'inventories',
          match: {
            $and: [
              {
                inventory: {
                  $in: inventoriesIDS.map((inventory) => inventory._id)
                },
                status: {
                  $in: [
                    ChoicesStatusCarInventory.pending,
                    ChoicesStatusCarInventory.found,
                    ChoicesStatusCarInventory.missing,
                    ChoicesStatusCarInventory.leftover,
                    ChoicesStatusCarInventory.reported
                  ]
                }
              }
            ]
          },
          populate: [
            {
              path: 'venue',
              select: ['name']
            },
            {
              path: 'label'
            },
            {
              path: 'venueFound',
              select: ['name']
            },
            {
              path: 'inventory',
              select: ['name']
            },
            {
              path: 'inventoriedBy',
              select: ['firstName', 'lastName']
            },
            {
              path: 'labelBy',
              select: ['firstName', 'lastName']
            }
          ],
          options: {
            sort: {
              createdAt: -1
            }
          }
        },
        {
          // reverse populate
          path: 'participants',
          select: [
            'number',
            'name',
            'user',
            'createdAt',
            'updatedAt',
            'qualification',
            'venue',
            'shipping',
            'reception',
            'hasDamages',
            'kind',
            'imported',
            'importedFrom',
            'importedType',
            'importedAt',
            'importedID'
          ],
          match: {
            venue: {
              $in: venuesPermissions
            }
          },
          options: {
            sort: {
              createdAt: -1
            }
          },
          // deep populate user
          populate: [
            {
              path: 'company',
              select: ['name']
            },
            {
              path: 'venue',
              select: ['name']
            },
            {
              path: 'sendTo',
              select: ['name']
            },
            {
              path: 'receiveFrom',
              select: ['name']
            },
            {
              path: 'form',
              select: ['shipping', 'reception']
            },
            {
              path: 'user',
              select: ['firstName', 'lastName']
            }
          ]
        }
      ]);
      if (!car) {
        return res.status(404).json({
          messsage: 'Auto no encontrado.',
          status: 404
        });
      } else {
        return res.json({
          data: car,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      console.error(e);
      logger.error(e);
      return res.status(500).json(e);
    }
  }

  public async apiRevisions(req: IRequest, res: Response): Promise<any> {
    let {
      only_controls,
      deliveries,
      page,
      pageSize,
      search,
      delivery,
      from,
      to,
      forms
    } = req.query as Record<string, string>;
    search = search ? search.replace(/  +/g, ' ').trim() : '';
    // paginate options
    let options: PaginateOptions = {
      page: parseInt(page ? page : '1', 10),
      limit: parseInt(pageSize ? pageSize : '20', 10),
      customLabels: this.aggregateCustomLabels,
      sort: { _id: -1 },
      lean: true
    };
    try {
      logger.info(
        `CarController.apiRevisions ${req.user.email} body: ${JSON.stringify(
          req.body
        )} query: ${JSON.stringify(req.query)}`
      );
      const { user } = req;

      // filter by delivery
      const kind =
        only_controls === '1'
          ? {
              $ne: KindForm.transmittal
            }
          : { $eq: KindForm.transmittal };

      // filter by form
      const searchForms = forms
        ?.trim()
        ?.split(',')
        .filter((f) => f.trim().length);

      const formsIds = searchForms?.length
        ? user.userForms
            .filter((form) => {
              if (searchForms?.length) {
                return searchForms.includes(form._id.toString());
              }
              return true;
            })
            .map((form) => new Types.ObjectId(form._id))
        : user.userForms.map((form) => new Types.ObjectId(form._id));

      // search text in participant
      let searchParticipantText: any = {};
      if (delivery?.length > 2) {
        searchParticipantText = {
          $text: { $search: `"${delivery.split(' ').join('" ')}"` }
        };
      }

      let baseMatch: any = {
        team: new mongoose.Types.ObjectId(user.team._id),
        car: {
          $ne: null
        },
        venue: {
          $in: req.user.venuesPermissions()
        },
        deliveryToCustomer: deliveries === '1',
        kind,
        form: {
          $in: formsIds
        },
        createdAt: {
          $gte: moment(from).startOf('day').utc().toDate(),
          $lte: moment(to).endOf('day').utc().toDate()
        }
      };
      let ponderations: any = {};
      if (search?.length > 2) {
        const keys = await Participant.aggregate([
          {
            $match: baseMatch
          },
          {
            $project: {
              team: 1,
              car: 1,
              venue: 1,
              user: 1,
              cars: [],
              venues: [],
              users: []
            }
          },
          {
            $group: {
              _id: '$team',
              cars: {
                $addToSet: '$car'
              },
              venues: {
                $addToSet: '$venue'
              },
              users: {
                $addToSet: '$user'
              }
            }
          }
        ]);

        if (keys.length) {
          const users = await User.aggregate([
            {
              $match: {
                team: new mongoose.Types.ObjectId(user.team._id),
                _id: {
                  $in: keys[0].users
                },
                active: true,
                $text: { $search: `"${search.split(' ').join('" "')}"` }
                // $text: { $search: search }
              }
            },
            {
              $project: {
                _id: 1,
                email: 1,
                score: { $meta: 'textScore' }
              }
            },
            // { $match: { score: { $gte: 5.5 } } },
            { $sort: { score: { $meta: 'textScore' } } },
            { $limit: 1 }
            // { $limit: 5 }
          ]);

          if (users.length) {
            baseMatch = {
              ...baseMatch,
              user: {
                $in: users.map((user) => user._id)
              }
            };
            ponderations['users'] = users;
          }

          const venues = await Venue.aggregate([
            {
              $match: {
                team: new mongoose.Types.ObjectId(user.team._id),
                active: true,
                _id: {
                  $in: keys[0].venues
                },
                // $text: { $search: search }
                $text: { $search: `"${search.split(' ').join('" "')}"` }
              }
            },
            {
              $project: {
                _id: 1,
                name: 1,
                score: { $meta: 'textScore' }
              }
            },
            // { $match: { score: { $gte: 8 } } }
            { $sort: { score: { $meta: 'textScore' } } },
            { $limit: 1 }
          ]);
          if (venues.length) {
            baseMatch = {
              ...baseMatch,
              venue: {
                $in: venues.map((venue) => venue._id)
              }
            };
            ponderations['venues'] = venues;
          }
          const cars = await Car.aggregate([
            {
              $match: {
                team: new mongoose.Types.ObjectId(user.team._id),
                _id: {
                  $in: keys[0].cars
                },
                $text: { $search: search }
                // $text: { $search: `"${search.split(' ').join('" "')}"` }
              }
            },

            {
              $project: {
                _id: 1,
                score: { $meta: 'textScore' }
              }
            },
            { $sort: { score: { $meta: 'textScore' } } },
            { $match: { score: { $gt: 10 } } },
            { $limit: !users.length && !venues.length ? 40 : 1000 }
          ]);

          if (cars.length) {
            baseMatch = {
              ...baseMatch,
              car: {
                $in: cars.map((car) => car._id)
              }
            };
            ponderations['cars'] = cars;
          }
        }
        logger.info(
          `CarController.apiRevisions ${
            req.user.email
          } ponderations: ${JSON.stringify({
            ...ponderations,
            cars: ponderations?.cars?.slice(0, 10)
          })}`
        );
      }

      // base aggregate pipeline

      let countAggregate: PipelineStage[] = [
        {
          $match: {
            ...searchParticipantText,
            ...baseMatch
          }
        }
      ];

      let aggregate: PipelineStage[] = [
        ...countAggregate
        // {
        //   $lookup: {
        //     from: 'cars',
        //     localField: 'car',
        //     foreignField: '_id',
        //     as: 'car'
        //   }
        // },
        // {
        //   $unwind: {
        //     path: '$car',
        //     preserveNullAndEmptyArrays: true
        //   }
        // },
        // {
        //   $lookup: {
        //     from: 'users',
        //     localField: 'user',
        //     foreignField: '_id',
        //     as: 'user'
        //   }
        // },
        // {
        //   $unwind: {
        //     path: '$user',
        //     preserveNullAndEmptyArrays: true
        //   }
        // },
        // {
        //   $lookup: {
        //     from: 'venues',
        //     localField: 'venue',
        //     foreignField: '_id',
        //     as: 'venue'
        //   }
        // },
        // {
        //   $unwind: {
        //     path: '$venue',
        //     preserveNullAndEmptyArrays: true
        //   }
        // },
        // {
        //   $lookup: {
        //     from: 'companies',
        //     localField: 'company',
        //     foreignField: '_id',
        //     as: 'company'
        //   }
        // },
        // {
        //   $unwind: {
        //     path: '$company',
        //     preserveNullAndEmptyArrays: true
        //   }
        // }
      ];

      // console.log('Object.keys(searchOtherText)', Object.keys(searchOtherText))

      // sort if search text in participant
      if (delivery?.length > 2) {
        options.sort = { score: { $meta: 'textScore' } };
      } else if (ponderations?.venues?.length) {
        aggregate = [
          ...aggregate,
          {
            $lookup: {
              from: 'venues',
              localField: 'venue',
              foreignField: '_id',
              as: 'venue'
            }
          },
          {
            $unwind: {
              path: '$venue',
              preserveNullAndEmptyArrays: true
            }
          }
        ];
        options.sort = { _id: -1 };
      } else if (ponderations?.users?.length) {
        aggregate = [
          ...aggregate,
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: {
              path: '$user',
              preserveNullAndEmptyArrays: true
            }
          }
        ];
        // options.sort = { 'user.firstName': 1, _id: -1 };
        options.sort = { _id: -1 };
      } else if (ponderations?.cars?.length) {
        aggregate = [
          ...aggregate,
          {
            $lookup: {
              from: 'cars',
              localField: 'car',
              foreignField: '_id',
              as: 'car'
            }
          },
          {
            $unwind: {
              path: '$car',
              preserveNullAndEmptyArrays: true
            }
          }
        ];
        // options.sort = { _id: -1, 'car.denomination': 1 };
        options.sort = { _id: -1 };
      } else {
        options.sort = { _id: -1 };
      }

      let projects: any = {
        createdAt: true,
        number: true,

        hasDamages: true,
        qualification: true,
        deliveryInfo: true,
        name: true,
        deliveryToCustomer: true,

        // 'car._id': true,
        // 'car.vin': true,
        // 'car.brand': true,
        // 'car.patent': true,
        // 'car.denomination': true,
        // 'car.color': true,
        // 'car.lastForm': true,

        // 'user._id': true,
        // 'user.firstName': true,
        // 'user.lastName': true,

        // 'venue._id': true,
        // 'venue.name': true,

        // 'company._id': true,
        // 'company.name': true
        car: true,
        user: true,
        venue: true,
        company: true
      };
      if (delivery?.length) {
        projects['score'] = { $meta: 'textScore' };
      }
      // project only needed fields
      aggregate.push({
        $project: projects
      });

      options['countQuery'] = Participant.aggregate(countAggregate);

      const participants = await Participant.aggregatePaginate(
        Participant.aggregate(aggregate),
        options
      );

      if (
        options.page &&
        participants.pages &&
        participants.pages < options.page
      ) {
        return res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        const data = await Participant.populate(participants.docs, [
          {
            path: 'car',
            select: [
              'vin',
              'brand',
              'patent',
              'denomination',
              'color',
              'lastForm'
            ]
          },
          {
            path: 'user',
            select: ['firstName', 'lastName']
          },
          {
            path: 'venue',
            select: ['name']
          },
          {
            path: 'company',
            select: ['name']
          },
          {
            path: 'deliveryInfo.identifyCard'
          },
          {
            path: 'deliveryInfo.signature'
          },
          {
            path: 'deliveryInfo.plateEvidence'
          }
        ]);

        const hasSearch = search?.length > 0;
        const showHasResult =
          !hasSearch || (hasSearch && Object.keys(ponderations).length);
        return res.json({
          count: showHasResult ? participants.total : [],
          pages: showHasResult ? participants.pages : 0,
          hasPrevious: participants.hasPrevious,
          hasNext: participants.hasNext,
          ponderations,
          results: showHasResult ? data : [],
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(e);
      console.log(e);
      return res.status(500).json(e);
    }
  }

  public processDamagedCar(
    cache: any,
    participant: IParticipant,
    extraColums: any
  ): Promise<any> {
    return new Promise(async (resolve) => {
      const rows: any[] = [];
      const damages = [];
      let extraRow: any = {};
      for (const section of participant.sections) {
        for (const answer of section.answers) {
          if (
            answer.kind === KindQuestion.text ||
            (answer.comment && answer.comment.length)
          ) {
            const answerID = answer._id.toString();
            if (!extraColums.keys.includes(answerID)) {
              extraColums.keys.push(answerID);
              extraColums.data.push({
                header: answer.question,
                key: answerID,
                width: 50
              });
            }
            extraRow = {
              ...extraRow,
              [answerID]: answer.comment
            };
          }
          for (const damage of answer.damagesSelected) {
            const kind =
              damage.kind && cache.kinds.hasOwnProperty(damage.kind.toString())
                ? cache.kinds[damage.kind.toString()]
                : answer.damages.kinds.find((d) =>
                    Boolean(
                      d._id &&
                        damage.kind &&
                        d._id.toString() === damage.kind.toString()
                    )
                  );
            const part =
              damage.part && cache.parts.hasOwnProperty(damage.part.toString())
                ? cache.parts[damage.part.toString()]
                : answer.damages.parts.find((d) =>
                    Boolean(
                      d._id &&
                        damage.part &&
                        d._id.toString() === damage.part.toString()
                    )
                  );
            const position =
              damage.position &&
              cache.positions.hasOwnProperty(damage.position.toString())
                ? cache.positions[damage.position.toString()]
                : answer.damages.positions.find((d) =>
                    Boolean(
                      d._id &&
                        damage.position &&
                        d._id.toString() === damage.position.toString()
                    )
                  );
            if (kind && part) {
              damages.push({ kind, part, position });
            }
          }
        }
      }
      if (damages.length) {
        // tslint:disable-next-line: forin
        for (const d in damages) {
          const idx = parseInt(d, 10) + 1;
          const row = {
            vin: participant.car.vin,
            denomination: participant.car.denomination,
            color: participant.car.color,
            brand: participant.car.brand,
            venue: participant.venue.name,
            created_at: moment(participant.createdAt).toDate(),
            user: `${participant.user.firstName} ${participant.user.lastName}`,
            damages: `${damages.length}`,
            has_damages: damages.length > 0 ? 'Sí' : 'No',
            damage: idx,
            position: damages[d].position ? damages[d].position.name : '-',
            kind: damages[d].kind.name,
            part: damages[d].part.name,
            ...extraRow
          };
          rows.push(row);
        }
      } else {
        const row = {
          vin: participant.car.vin,
          denomination: participant.car.denomination,
          color: participant.car.color,
          brand: participant.car.brand,
          venue: participant.venue.name,
          created_at: moment(participant.createdAt).toDate(),
          user: `${participant.user.firstName} ${participant.user.lastName}`,
          damages: `${damages.length}`,
          has_damages: damages.length > 0 ? 'Sí' : 'No',
          damage: '-',
          position: '-',
          kind: '-',
          part: '-',
          ...extraRow
        };
        rows.push(row);
      }
      resolve(rows);
    });
  }

  public addRevisions(
    user: any,
    period: number,
    damagesCache: any,
    extraColums: any
  ): Promise<any[]> {
    return new Promise(async (resolve) => {
      const revisionsToProcess = [];
      const t0 = moment().subtract(period, 'weeks').startOf('week');
      const t1 = moment().subtract(period, 'weeks').endOf('week');
      const revisions = await ParticipantModel.aggregate([
        {
          $match: {
            $and: [
              {
                venue: {
                  $in: user.venuesPermissions()
                }
              },
              {
                createdAt: {
                  $gte: t0.toDate(),
                  $lte: t1.toDate()
                }
              } /*,{
              'sections.answers.kind': 'damage'
            }*/
            ]
          }
        },
        {
          $project: {
            createdAt: true,
            user: true,
            venue: true,
            car: true,
            'sections.answers._id': true,
            'sections.answers.kind': true,
            'sections.answers.question': true,
            'sections.answers.comment': true,
            'sections.answers.damages': true,
            'sections.answers.damagesSelected': true
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $lookup: {
            from: 'cars',
            localField: 'car',
            foreignField: '_id',
            as: 'car'
          }
        },
        {
          $unwind: '$car'
        },
        {
          $lookup: {
            from: 'venues',
            localField: 'venue',
            foreignField: '_id',
            as: 'venue'
          }
        },
        {
          $unwind: '$venue'
        }
      ]);
      for (const revision of revisions) {
        revisionsToProcess.push(
          this.processDamagedCar(damagesCache, revision, extraColums)
        );
      }
      let results: any[] = [];
      while (revisionsToProcess.length) {
        const data = [].concat.apply(
          [],
          await bluebird.all(revisionsToProcess.splice(0, 100))
        );
        results = [...results, ...data];
      }
      resolve(results);
    });
  }

  public async apiDamagesExport(req: IRequest, res: Response): Promise<any> {
    if (!req.user.hasPermission('exportDamages')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }

    try {
      const team = req.user.team._id;
      const { changeperiods } = req.query as { changeperiods: string };
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=daños-${moment().format('YYYY-MM-DD')}.xlsx`
      );
      const workbook = new excel.stream.xlsx.WorkbookWriter({
        stream: res,
        useStyles: true,
        useSharedStrings: true
      });
      const worksheet = workbook.addWorksheet('Daños', {
        properties: {
          // defaultRowHeight: 30
        },
        pageSetup: {
          fitToPage: true,
          fitToHeight: 100,
          fitToWidth: 1
        }
      });
      const extraColums = {
        keys: [],
        data: []
      };
      const columns = [
        {
          header: 'VIN',
          key: 'vin',
          width: 30
        },
        {
          header: 'Denominación',
          key: 'denomination',
          width: 30
        },
        {
          header: 'Color',
          key: 'color',
          width: 30
        },
        {
          header: 'Marca',
          key: 'brand',
          width: 30
        },
        {
          header: 'Sucursal',
          key: 'venue',
          width: 30
        },
        {
          header: 'Fecha',
          key: 'created_at',
          width: 30,
          style: {
            numFmt: 'dd/mm/yyyy hh:mm'
          }
        },
        {
          header: 'Usuario',
          key: 'user',
          width: 30
        },
        {
          header: 'Tiene daños',
          key: 'has_damages',
          width: 30
        },
        {
          header: 'Daños reportados',
          key: 'damages',
          width: 30
        }
      ];

      columns.push({ header: 'Daño', key: 'damage', width: 30 });
      columns.push({ header: 'Parte', key: 'part', width: 30 });
      columns.push({ header: 'Tipo', key: 'kind', width: 30 });
      columns.push({ header: 'Posición', key: 'position', width: 30 });

      /* headers */
      const periods: number = changeperiods ? parseInt(changeperiods, 10) : 8;
      const kinds = await Kind.find({ team }, { name: true });
      const parts = await Part.find({ team }, { name: true });
      const positions = await Position.find({ team }, { name: true });
      const damagesCache = {
        kinds: kinds.reduce((acc: any, cur: any) => {
          acc[cur._id.toString()] = cur;
          return acc;
        }, {}),
        parts: parts.reduce((acc: any, cur: any) => {
          acc[cur._id.toString()] = cur;
          return acc;
        }, {}),
        positions: positions.reduce((acc: any, cur: any) => {
          acc[cur._id.toString()] = cur;
          return acc;
        }, {})
      };

      const periodToProcess = [];
      for (let i = periods; i >= 0; i--) {
        periodToProcess.push(
          this.addRevisions(req.user, i, damagesCache, extraColums)
        );
      }

      // create titles of the table with filters
      const newColumns = [...columns, ...extraColums.data];
      worksheet.columns = newColumns;
      worksheet.autoFilter = {
        from: 'A1',
        to: { row: 1, column: newColumns.length }
      };

      // add data in excel
      while (periodToProcess.length) {
        const rows: any[] = await periodToProcess.splice(0, 1)[0];
        for (const row of rows) {
          worksheet.addRow(row).commit();
        }
      }
      await workbook.commit();
      res.status(200);
    } catch (e) {
      /* istanbul ignore next */
      if (e) {
        console.log(e);
        res.status(500).json(e);
      }
    }
  }

  public async apiRotationExport(req: IRequest, res: Response) {
    if (!req.user.hasPermission('exportRotation')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }

    try {
      const team = req.user.team._id;

      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Rotación de unidades', {
        properties: {
          // defaultRowHeight: 30
        },
        pageSetup: {
          fitToPage: true,
          fitToHeight: 100,
          fitToWidth: 1
        }
      });
      worksheet.autoFilter = { from: 'A1', to: 'F1' };

      worksheet.columns = [
        {
          header: 'VIN',
          key: 'vin',
          width: 30
        },
        {
          header: 'Denominación',
          key: 'denomination',
          width: 30
        },
        {
          header: 'Color',
          key: 'color',
          width: 30
        },
        {
          header: 'Marca',
          key: 'brand',
          width: 30
        },
        {
          header: 'Sucursal entrada',
          key: 'v0',
          width: 30
        },
        {
          header: 'Tiempo inicio',
          key: 't0',
          width: 30
        },
        {
          header: 'Sucursal salida',
          key: 'v1',
          width: 30
        },
        {
          header: 'Tiempo fin',
          key: 't1',
          width: 30
        },
        {
          header: 'Inventarios',
          key: 'inventories',
          width: 30
        },
        {
          header: 'Rotación',
          key: 'rotation',
          width: 30
        }
      ];

      let i = 12;
      while (--i > 0) {
        const ti = moment().subtract(i * 15, 'day');
        const tf = moment().subtract((i - 1) * 15, 'day');
        console.log(ti.format('YYYY-MM-DD'), tf.format('YYYY-MM-DD'));
        const cars = await CarModel.find(
          {
            team,
            isExhibition: false,
            lastForm: {
              $exists: true
            },
            createdAt: {
              $gte: ti,
              $lte: tf
            }
          },
          {
            vin: true,
            denomination: true,
            color: true,
            brand: true
          }
        ).populate({
          path: 'inventories',
          select: ['name', 'createdAt', 'venueFound', 'status'],
          match: {
            status: {
              $in: [ChoicesStatusCarInventory.found]
            }
          },
          options: {
            sort: {
              createdAt: 1
            }
          },
          populate: {
            path: 'venueFound',
            select: ['name']
          }
        });

        for (const car of cars) {
          const inventories = car.inventories!;

          if (inventories.length === 0) {
            continue;
          }

          const n = inventories.length;
          const inv0 = inventories[0];
          const inv1 = inventories[n - 1];
          const t0 = inv0.createdAt;
          const t1 = inv1.createdAt;

          const row = {
            vin: car.vin,
            denomination: car.denomination,
            color: car.color,
            brand: car.brand,
            v0: inv0.venueFound ? inv0.venueFound.name : inv0.venue.name,
            t0,
            v1: inv1.venueFound ? inv1.venueFound.name : inv1.venue.name,
            t1,
            inventories: n,
            rotation: moment(t1).diff(moment(t0), 'days', true)
          };

          worksheet.addRow(row);
        }
      }

      const tempFilePath = tempfile('.xlsx');
      await workbook.xlsx.writeFile(tempFilePath);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=usuarios-21-03-2019.xlsx'
      );
      return res.sendFile(tempFilePath);
    } catch (e) {
      /* istanbul ignore next */
      if (e) {
        console.log(e);
        res.status(500).json(e);
      }
    }
  }

  public async apiCars(req: IRequest, res: Response) {
    const { page, pageSize, search } = req.query as {
      page: string;
      pageSize: string;
      search: string;
    };
    // paginate options
    const options: PaginateOptions = {
      select: {
        vin: true,
        brand: true,
        denomination: true,
        color: true
      },
      populate: [
        {
          path: 'lastForm',
          select: ['createdAt', 'user', 'qualification', 'venue'],
          populate: [
            {
              path: 'user',
              select: ['firstName', 'lastName']
            },
            {
              path: 'venue',
              select: ['name']
            }
          ]
        }
      ],
      sort: {
        updatedAt: -1
      },
      customLabels: {
        totalDocs: 'total',
        docs: 'docs',
        limit: 'perPage',
        page: 'currentPage',
        nextPage: 'next',
        prevPage: 'prev',
        totalPages: 'pages',
        pagingCounter: 'si'
      },
      allowDiskUse: true,
      lean: true,
      page: parseInt(page ? page : '1', 10),
      limit: parseInt(pageSize ? pageSize : '20', 10)
    };
    try {
      const cars = await this.getCars(
        {
          lastForm: {
            $exists: true,
            $ne: null,
            $in: await ParticipantModel.find(
              {
                venue: {
                  $in: req.user.venuesPermissions()
                }
              },
              { _id: true }
            )
          }
        },
        options,
        search
      );

      // validate exist page
      if (options.page && cars.pages && cars.pages < options.page) {
        return res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 200
        });
      } else {
        return res.json({
          count: cars.total,
          pages: cars.pages,
          hasPrevious: cars.hasPrevious,
          hasNextPage: cars.hasNextPage,
          results: cars.docs,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      return res.status(500).json(e);
    }
  }

  // private getRevisions(
  //   filters: any,
  //   options: PaginateOptions
  // ): Promise<PaginateResult<IParticipant>> {
  //   return new Promise((resolve, reject) => {
  //     ParticipantModel.paginate!(filters, options, (err, result) => {
  //       if (err) {
  //         /* istanbul ignore next */
  //         reject(err);
  //       }
  //       resolve(result);
  //     });
  //   });
  // }

  private getCars(
    filters: any,
    options: PaginateOptions,
    search?: string
  ): Promise<PaginateResult<ICarModel>> {
    let filter: any = { ...filters };

    if (search && search.length) {
      const searchText = new RegExp(search, 'i');
      // search in vin and brand
      filter = {
        $and: [
          {
            $or: [
              {
                vin: {
                  $regex: searchText
                }
              },
              {
                brand: {
                  $regex: searchText
                }
              }
            ]
          },
          filter
        ]
      };
    }

    return new Promise((resolve, reject) => {
      CarModel.paginate!(filter, options, (err, result) => {
        if (err) {
          /* istanbul ignore next */
          return reject(err);
        }
        return resolve(result);
      });
    });
  }

  public async apiVenueRevisionStats(req: IRequest, res: Response) {
    try {
      const team = req.user.team._id;
      const { from, to } = req.query;
      const venuesPermissions = req.user.venuesPermissions();

      // Get filters for Mongo Query
      const queryFilter: any = {
        team,
        venue: {
          $in: venuesPermissions
        },
        kind: { $ne: KindForm.transmittal }
      };

      if (from && to) {
        queryFilter.createdAt = {
          $gte: moment.unix(Number(from)).hour(0).minute(0).toDate(),
          $lt: moment.unix(Number(to)).hour(23).minute(59).toDate()
        };
      }

      const activeVenues: any[] = await ParticipantModel.aggregate([
        {
          $match: queryFilter
        },
        {
          $lookup: {
            from: 'venues',
            localField: 'venue',
            foreignField: '_id',
            as: '_venue'
          }
        },
        {
          $unwind: '$_venue'
        },
        {
          $group: {
            _id: '$_venue._id',
            name: { $first: '$_venue.name' },
            total: { $sum: 1 }
          }
        }
      ]);
      const inactiveVenues: any[] = await Venue.find(
        {
          team,
          _id: {
            $in: venuesPermissions.filter(
              (vp) =>
                !activeVenues.some((v) => v._id.toString() === vp.toString())
            )
          }
        },
        { name: 1, _id: 1 }
      );
      const allVenues: any[] = activeVenues.concat(inactiveVenues);

      res.status(200).json(allVenues);
    } catch (e) {
      logger.error(e);
      res.status(500).json(e);
    }
  }

  public async apiRevisionStats(req: IRequest, res: Response) {
    try {
      const team = req.user.team._id;
      const venuesPermissions = req.user.venuesPermissions();

      // Get filters for Mongo Query
      const queryFilter: any = {
        team,
        venue: {
          $in: venuesPermissions
        },
        kind: { $ne: KindForm.transmittal }
      };

      const todayParticipants: number = await ParticipantModel.find({
        ...queryFilter,
        createdAt: {
          $gte: moment().hour(0).minute(0).toDate(),
          $lt: moment().hour(23).minute(59).toDate()
        }
      }).countDocuments();
      const yesterdayParticipants: number = await ParticipantModel.find({
        ...queryFilter,
        createdAt: {
          $gte: moment().subtract(1, 'day').startOf('day').toDate(),
          $lt: moment().subtract(1, 'day').endOf('day').toDate()
        }
      }).countDocuments();

      const lastMonthParticipants: number = await ParticipantModel.find({
        ...queryFilter,
        createdAt: {
          $gte: moment().subtract(1, 'month').startOf('month').toDate(),
          $lt: moment().subtract(1, 'month').endOf('month').toDate()
        }
      }).countDocuments();
      const currentMonthParticipants: number = await ParticipantModel.find({
        ...queryFilter,
        createdAt: {
          $gte: moment().startOf('month').toDate(),
          $lt: moment().endOf('month').toDate()
        }
      }).countDocuments();

      const totalParticipants: number = await ParticipantModel.find(
        queryFilter
      ).countDocuments();
      const sentStats: any[] = await ParticipantModel.aggregate([
        {
          $match: { ...queryFilter, shipping: true }
        },
        {
          $group: {
            _id: 1,
            accepted: {
              $sum: { $cond: [{ $eq: ['$shippingConfirmation', true] }, 1, 0] }
            },
            rejected: {
              $sum: { $cond: [{ $eq: ['$shippingConfirmation', false] }, 1, 0] }
            }
          }
        }
      ]);
      const receivedStats: any[] = await ParticipantModel.aggregate([
        {
          $match: { ...queryFilter, reception: true }
        },
        {
          $group: {
            _id: 1,
            accepted: {
              $sum: { $cond: [{ $eq: ['$receptionConfirmation', true] }, 1, 0] }
            },
            rejected: {
              $sum: {
                $cond: [{ $eq: ['$receptionConfirmation', false] }, 1, 0]
              }
            }
          }
        }
      ]);

      const activeVenues: any[] = await ParticipantModel.aggregate([
        {
          $match: {
            ...queryFilter,
            createdAt: {
              $gte: moment().startOf('month').toDate(),
              $lt: moment().endOf('month').toDate()
            }
          }
        },
        {
          $group: {
            _id: '$venue',
            total: { $sum: 1 }
          }
        }
      ]);
      const inactiveVenues: any[] = await Venue.find(
        {
          team,
          _id: {
            $in: venuesPermissions.filter(
              (vp) =>
                !activeVenues.some((v) => v._id.toString() === vp.toString())
            )
          }
        },
        { name: 1, _id: 1 }
      );

      res.status(200).json({
        revisions: {
          today: todayParticipants,
          yesterday: yesterdayParticipants,
          lastMonthTotal: lastMonthParticipants,
          currentMonthTotal: currentMonthParticipants,
          totalRevisions: totalParticipants,
          sentStats: sentStats[0],
          receivedStats: receivedStats[0]
        },
        venues: {
          activeVenues: activeVenues.length,
          inactiveVenues: inactiveVenues.length
        }
      });
    } catch (e) {
      logger.error(e);
      res.status(500).json(e);
    }
  }
}

export default new CarController();
