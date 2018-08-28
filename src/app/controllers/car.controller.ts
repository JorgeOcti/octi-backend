import {ObjectID} from 'bson';
import {Response} from 'express';
import * as moment from 'moment';
import * as mongoose from 'mongoose';
import {PaginateOptions, PaginateResult} from 'mongoose';
import ParticipantModel from '../../form/models/participant.model';
import {IRequest} from '../../interfaces/global.interface';
import CarModel, {ICarModel} from '../models/car.model';

class CarController {

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
    const company = req.user.company;
    // validate params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).render('404');
    }
    try {
      // validate car exist
      const car = await CarModel.findOne({
        _id: id, company
      });
      if (!car) {
        return res.status(404).render('404');
      } else {
        res.render('app/index', {token: await req.user.generateToken()});
      }
    } catch (e) {
      if (e) {
        res.status(500).send(e);
      }
    }
  }

  public async checkVIN(req: IRequest, res: Response) {
    let {vin, vin2} = req.body;
    const {multi} = req.query;
    const company = req.user.company;

    const carBrands: any = {
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
      try {
        const indexBrand: string = vin.slice(0, 3);
        vin2 = vin.substr(vin.length - 6);
        const brand = carBrands.hasOwnProperty(indexBrand) ? carBrands[indexBrand] : null;
        const car = await CarModel.findOneOrCreate({
          vin,
          company
        }, {
          vin,
          vin2,
          company,
          brand
        });
        res.json({
          data: {
            _id: car._id,
            vin: car.vin,
            vin2: car.vin2,
            brand: car.brand,
            color: car.color,
            denomination: car.denomination
          },
          status: 200
        });
      } catch (e) {
        if (e) {
          res.status(500).send(e);
        }
      }
    } else if (vin2) {
      // vin2 = vin2.replace(/[\W_]+/g, '');
      try {
        if (multi === 'true') {
          const vinRegex = new RegExp('[a-zA-Z0]' + vin2.substr(vin2.length - 5), 'i');
          const car = await CarModel.find({
            vin2: vin2 && vin2[0] === '0' ? {$regex: vinRegex} : vin2,
            company
          }, {
            vin: true,
            vin2: true,
            brand: true,
            color: true,
            denomination: true
          });
          if (car.length) {
            res.json({
              data: car,
              status: 200
            });
          } else {
            res.status(400).json({
              message: 'VIN no encontrado.',
              status: 400
            });
          }
        } else {
          const car = await CarModel.findOne({
            vin2,
            company
          }, {
            vin: true,
            vin2: true,
            brand: true,
            color: true,
            denomination: true
          });
          if (car) {
            res.json({
              data: car,
              status: 200
            });
          } else {
            res.status(400).json({
              message: 'VIN no encontrado.',
              status: 400
            });
          }
        }
      } catch (e) {
        if (e) {
          res.status(500).send(e);
        }
      }
    } else {
      res.status(400).json({
        message: 'VIN no encontrado.',
        status: 400
      });
    }
  }

  public async apiParticipantsPerDate(req: IRequest, res: Response) {
    const company = req.user.company;
    try {
      const participantPerDay = await ParticipantModel
        .aggregate([{
          $match: {
            company,
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

      res.json({
          participants,
          cars,
          status: 200
        });
    } catch (e) {
      if (e) {
        res.status(500).json(e);
      }
    }
  }

  public async apiParticipantDetail(req: IRequest, res: Response) {
    const {id} = req.params;
    const company = req.user.company;
    try {
      const participant = await ParticipantModel
        .findOne({
          _id: id, company
        }, {
          name: true,
          user: true,
          sections: true,
          qualification: true,
          createdAt: true
        })
        .populate([{
          path: 'user',
          select: ['firstName', 'lastName']
        }, {
          path: 'sections.answers.images'
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
      if (e) {
        res.status(500).json(e);
      }
    }
  }

  public async apiCarDetail(req: IRequest, res: Response) {
    const company = req.user.company;
    const {id} = req.params;
    try {
      const car = await CarModel
        .findOne({
          _id: id,
          company
        }, {
          vin: true,
          brand: true,
          denomination: true,
          color: true
        })
        .populate([{
          // reverse populate
          path: 'participants',
          select: ['name', 'user', 'createdAt', 'qualification'],
          options: {
            sort: {
              createdAt: -1
            }
          },
          // deep populate user
          populate: [{
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
      if (e) {
        res.status(500).json(e);
      }
    }
  }

  public async apiCars(req: IRequest, res: Response) {
    const company = req.user.company;
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
        select: ['createdAt', 'user', 'qualification'],
        populate: [{
          path: 'user',
          select: ['firstName', 'lastName']
        }]
      }],
      sort: {
        updatedAt: -1
      },
      page: parseInt(page ? page : 1, 10),
      limit: parseInt(pageSize ? pageSize : 20, 10)
    };
    try {
      const cars = await this.getCars(company, options, search);

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
      if (e) {
        res.status(500).json(e);
      }
    }
  }

  private getCars(company: ObjectID, options: PaginateOptions, search?: string): Promise<PaginateResult<ICarModel>> {
    let filter: any = {company, lastForm: {$exists: true, $ne: null}};

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
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new CarController();
