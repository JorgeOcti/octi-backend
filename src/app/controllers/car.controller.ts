import {Response} from 'express';
import * as moment from 'moment';
import * as mongoose from 'mongoose';
import {PaginateOptions, PaginateResult} from 'mongoose';
import app from '../../app';
import ParticipantModel from '../../form/models/participant.model';
import {IRequest} from '../../interfaces/global.interface';
import InventoryModel, {ChoicesStatusInventory} from '../../inventory/models/inventory.model';
import {ChoicesStatusCarInventory} from '../../inventory/models/inventoryCar.model';
import logger from '../../services/logger.service';
import VINService from '../../services/vin.service';
import CarModel, {ChoicesStatusCar, ICarModel} from '../models/car.model';

class CarController {
  protected carBrands: any = {
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

  constructor() {
    this.generalDashboard = this.generalDashboard.bind(this);
    this.vinDashboard = this.vinDashboard.bind(this);
    this.vinDashboardDetail = this.vinDashboardDetail.bind(this);
    this.checkVIN = this.checkVIN.bind(this);
    this.apiCars = this.apiCars.bind(this);
    this.apiCarDetail = this.apiCarDetail.bind(this);
    this.getCars = this.getCars.bind(this);
    this.apiParticipantDetail = this.apiParticipantDetail.bind(this);
    this.apiParticipantsPerDate = this.apiParticipantsPerDate.bind(this);
  }

  public async generalDashboard(req: IRequest, res: Response) {
    res.render('app/index', {token: await req.user.generateToken()});
  }

  public async vinDashboard(req: IRequest, res: Response) {
    res.render('app/index', {token: await req.user.generateToken()});
  }

  public async vinDashboardDetail(req: IRequest, res: Response) {
    const {id} = req.params;
    const {team} = req.user;
    // validate params
    /* istanbul ignore next */
    if (!mongoose.Types.ObjectId.isValid(id) || !await CarModel.find({_id: id, team}).count()) {
      return res.redirect('/cars/');
      // return res.status(404).render('404');
    }
    try {
      // validate car exist
      const car = await CarModel.findOne({
        _id: id,
        lastForm: {
          $exists: true,
          $ne: null,
          $in: await ParticipantModel.find(
          {
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
      } else {
        res.render('app/index', {token: await req.user.generateToken()});
      }
    } catch (e) {
      /* istanbul ignore next */
      if (e) {
        res.status(500).send(e);
      }
    }
  }

  public async checkVIN(req: IRequest, res: Response) {
    let {vin, vin2} = req.body;
    const {inventory} = req.body;
    // const {multi} = req.query;
    const {team, company} = req.user;
    logger.info(`checkVIN`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}}`);
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
      logger.info(`VIN fixed: ${vin}`);
    }
    if (inventory) {
      try {
        const inventoryStatus = await InventoryModel.findOne({
            _id: inventory
        }, {status: true});
        if (inventoryStatus && inventoryStatus.status !== ChoicesStatusInventory.inProcess) {
          logger.error(`checkVIN: Este inventario ya no se encuentra disponible.`);
          logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
          res.status(404).json({
            message: 'Este inventario ya no se encuentra disponible.',
            status: 404
          });
        } else {
          const inventoryQuery: any = {
            team
          };
          if (vin) {
            inventoryQuery.vin = vin;
          }
          if (vin2) {
            if (vin2[0] === '0') {
              const vinRegex = new RegExp( vin2.substr(vin2.length - 5), 'i');
              inventoryQuery.vin2 = {$regex: vinRegex};
            } else {
              const patentRegex = new RegExp(vin2, 'i');
              inventoryQuery.$or = [{vin2}, {patent: patentRegex}];
            }
          }
          const cars = await CarModel.find(inventoryQuery, {
            vin: true,
            vin2: true,
            brand: true,
            color: true,
            patent: true,
            denomination: true
          });
          if (cars.length) {
            const carsByID = cars.reduce((acc: any, cur: any) => {
              acc[cur._id.toString()] = cur;
              return acc;
            }, {});
            const inventoriedCar = await InventoryModel.findOne({
              _id: inventory,
              team,
              status: ChoicesStatusInventory.inProcess
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
              const carsInInventory: any[] = [];
              for (const car of inventoriedCar.cars) {
                if (carsByID.hasOwnProperty(car.car)) {
                  const carToAdd: any = cars.find((ci) => {
                    return ci._id.toString() === car.car.toString();
                  });
                  if (carToAdd && car.status !== ChoicesStatusCarInventory.leftover) {
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
              } else {
                logger.error(`checkVIN: VIN no válido 1.`);
                logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
                res.status(400).json({
                  message: 'VIN no válido.',
                  status: 400
                });
              }
            } else {
              logger.error(`checkVIN: Este inventario ya no se encuentra disponible.`);
              logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
              res.status(404).json({
                message: 'Este inventario ya no se encuentra disponible.',
                status: 404
              });
            }
          } else {
            logger.error(`checkVIN: VIN no válido 2.`);
            logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
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
          logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
          /* istanbul ignore next */
          logger.error(e);
          res.status(500).json(e);
        }
      }
    } else {
      if (vin) {
        try {
          /* istanbul ignore next */
          if (app.get('env') !== 'testing') {
            const testDecode = VINService.decode(vin);
            logger.info(`vin decode ${JSON.stringify(testDecode)}`);
          }
          const indexBrand: string = vin.slice(0, 3);
          vin2 = vin.substr(vin.length - 6);
          const brand = this.carBrands.hasOwnProperty(indexBrand) ? this.carBrands[indexBrand] : null;
          const car = await CarModel.findOneOrCreate({
            vin,
            team
          }, {
            vin,
            vin2,
            company,
            team,
            brand,
            status: ChoicesStatusCar.active
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
        } catch (e) {
          /* istanbul ignore next */
          console.log(e);
          /* istanbul ignore next */
          if (e) {
            res.status(500).send(e);
          }
        }
      } else if (vin2) {
        // vin2 = vin2.replace(/[\W_]+/g, '');
        try {
          const vinRegex = new RegExp('[a-zA-Z0]' + vin2.substr(vin2.length - 5), 'i');
          const patentRegex = new RegExp(vin2, 'i');
          const car = await CarModel.find({
            $or: [{vin2: vin2 && vin2[0] === '0' ? {$regex: vinRegex} : vin2}, {patent: patentRegex}],
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
          } else {
            logger.error(`checkVIN: VIN no encontrado.`);
            logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
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
            logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            /* istanbul ignore next */
            logger.error(e);
            res.status(500).send(e);
          }
        }
      } else {
        logger.error(`checkVIN: VIN no encontrado.`);
        logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
        res.status(400).json({
          message: 'VIN no encontrado.',
          status: 400
        });
      }
    }
  }

  public async apiParticipantsPerDate(req: IRequest, res: Response) {
    const {company} = req.user;
    try {
      const participantPerDay = await ParticipantModel
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
            total: {$sum: '$total'}
          }
        }, {
          $sort: {
            _id: 1
          }
        }]);

      const importCarsPerDay = await CarModel
        .aggregate([{
          $match: {
            company,
            createdAt: {
              $gte: moment().subtract(14, 'd').toDate()
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
        } else {
          participants.push(existInParticipantPerDay);
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
          proyection.push({$cond: [{$and: [{$gte: ['$qualification', i]}, {$lte: ['$qualification', max]}]}, `${i}-${max}`, '']});
        } else {
          proyection.push({$cond: [{$and: [{$gt: ['$qualification', i]}, {$lte: ['$qualification', max]}]}, `${i}-${max}`, '']});
        }
      }
      // get data
      const participantPerRange = await ParticipantModel
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
                {$cond: [{$lt: ['$qualification', 0]}, 'Unknown', '']},
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
        totalCars: await CarModel.count({company}),
        status: 200
      });
    } catch (e) {
      /* istanbul ignore next */
      console.log('e', e);
      /* istanbul ignore next */
      if (e) {
        res.status(500).json(e);
      }
    }
  }

  /* istanbul ignore next */
  public async apiParticipantCSV(req: IRequest, res: Response) {
    try {
      const participants = await ParticipantModel.find({}).populate([{
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
    } catch (e) {
      console.log(e);
    }
  }

  public async apiParticipantDetail(req: IRequest, res: Response) {
    const {id} = req.params;
    const {team} = req.user;
    try {
      const venuesPermissions = req.user.venuesPermissions();
      const participant = await ParticipantModel
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
          conciliation: true,
          conciliationText: true,
          conciliationImages: true,
          createdAt: true
        })
        .populate([{
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
      } else {
        res.json({
          data: participant,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      if (e) {
        res.status(500).json(e);
      }
    }
  }

  public async apiCarDetail(req: IRequest, res: Response) {
    const {team} = req.user;
    const {id} = req.params;
    try {
      const venuesPermissions = req.user.venuesPermissions();
      const car = await CarModel
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
              $in: await InventoryModel.find({
                team,
                venues: {
                  $in: venuesPermissions
                },
                status: ChoicesStatusInventory.finalized
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
          select: ['name', 'user', 'createdAt', 'updatedAt', 'qualification', 'venue', 'shipping', 'reception'],
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
      } else {
        res.json({
          data: car,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      if (e) {
        res.status(500).json(e);
      }
    }
  }

  public async apiCars(req: IRequest, res: Response) {
    const {page, pageSize, search} = req.query;

    // paginate options
    const options: PaginateOptions = {
      select: {
        vin: true,
        brand: true,
        denomination: true,
        color: true
      },
      populate: [{
        path: 'lastForm',
        select: ['createdAt', 'user', 'qualification', 'venue'],
        // options: {
        //   sort: {
        //     updatedAt: -1
        //   }
        // }
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
          $in: await ParticipantModel.find(
          {
            venue: {
              $in: req.user.venuesPermissions()
            }
          }, {_id: true})
        }
      }, options, search);

      // validate exist page
      if (options.page && cars.pages && cars.pages < options.page) {
        res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 200
        });
      } else {
        res.json({
          count: cars.total,
          pages: cars.pages,
          hasPrevious: options.page && options.page > 1 && cars.pages && cars.pages >= options.page,
          hasNext: options.page && cars.pages && cars.pages > options.page,
          results: cars.docs,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      if (e) {
        res.status(500).json(e);
      }
    }
  }

  private getCars(filters: any, options: PaginateOptions, search?: string): Promise<PaginateResult<ICarModel>> {
    let filter: any = {...filters};

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
      CarModel.paginate(filter, options, (err, result) => {
        if (err) {
          /* istanbul ignore next */
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new CarController();
