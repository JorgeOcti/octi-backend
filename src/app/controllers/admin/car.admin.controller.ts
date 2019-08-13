import {Response} from 'express';
import {PaginateOptions, PaginateResult} from 'mongoose';
import {Types} from 'mongoose';
import {IRequest} from '../../../interfaces/global.interface';
import {io} from '../../../server';
import Car, {ChoicesStatusCar, ICarModel} from '../../models/car.model';

class AdminCarController {

  constructor() {
    this.index = this.index.bind(this);
    this.indexDetail = this.indexDetail.bind(this);
    this.imports = this.imports.bind(this);
    this.importCars = this.importCars.bind(this);
    this.apiListCars = this.apiListCars.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    /* istanbul ignore else */
    if (req.user.hasPermission('viewCar')) {
      res.render('app/index', {token: await req.user.generateToken()});
    } else {
      res.status(403).render('403');
    }
  }

  public async indexDetail(req: IRequest, res: Response) {
    const {id} = req.params;
    const {team} = req.user;
    /* istanbul ignore else */
    if (req.user.hasPermission('viewCar') && Types.ObjectId.isValid(id) && await Car.find({_id: id, team}).count()) {
      res.render('app/index', {token: await req.user.generateToken()});
    } else {
      res.redirect('/settings/cars/');
    }
  }

  public async imports(req: IRequest, res: Response): Promise<any> {
    /* istanbul ignore else */
    if (req.user.hasPermission('addCar')) {
      res.render('app/index', {
        token: await req.user.generateToken()
      });
    } else {
      res.status(403).render('403');
    }
  }

  public async importCars(req: IRequest, res: Response): Promise<any> {
    /* istanbul ignore next  */
    if (!req.user.hasPermission('addCar')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    const {company, team} = req.user;
    const {cars} = req.body;
    if (cars && cars.length) {
      for (const car of cars) {
        if (car.vin && car.vin.length) {
          const vin2 = car.vin.substr(car.vin.length - 6);
          try {
            const newCar = await Car.findOne({
              vin: car.vin,
              team
            });
            if (newCar) {
              newCar.vin2 = vin2;
              newCar.brand = car.marca ? car.marca : newCar.brand;
              newCar.denomination = car.denominacion ? car.denominacion : newCar.denomination;
              newCar.engineNumber = car.motor ? car.motor : newCar.engineNumber;
              newCar.color = car.color ? car.color : newCar.color;
              newCar.patent = car.patente ? car.patente : newCar.patent;
              newCar.internalNumber = car.NInterno ? car.NInterno : newCar.internalNumber;
              newCar.destination = car.destino ? car.destino : newCar.destination;
              newCar.createdBy = req.user;
              newCar.status = ChoicesStatusCar.active;
              await newCar.save();
            } else {
              await Car.create({
                vin: car.vin,
                vin2,
                brand: car.marca ? car.marca : '',
                denomination: car.denominacion ? car.denominacion : '',
                engineNumber: car.motor ? car.motor : car.engineNumber,
                color: car.color ? car.color : '',
                internalNumber: car.NInterno ? car.NInterno : '',
                destination: car.destino ? car.destino : '',
                patent: car.patente ? car.patente : '',
                company,
                team,
                createdBy: req.user,
                status: ChoicesStatusCar.active
              });
            }
            // io.to(req.user._id).emit('STATUS-CARS', {newCar});
          } catch (e) {
            /* istanbul ignore next */
            console.log(e);
          }
        }
      }
      io.to(req.user._id).emit('FINISH-IMPORT', {finish: true});
    }
    res.json({
      status: 200
    });
  }

  public async apiListCars(req: IRequest, res: Response): Promise<any> {
    /* istanbul ignore next */
    if (!req.user.hasPermission('viewCar')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    const {page, pageSize, search} = req.query;
    const {team} = req.user;
    // paginate options
    const options: PaginateOptions = {
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
      page: parseInt(page ? page : 1, 10),
      limit: parseInt(pageSize ? pageSize : 20, 10)
    };
    try {
      const cars = await this.getCars({
        team,
        status: {
          $eq: ChoicesStatusCar.active
        }
      }, options, search);
      // validate exist page
      /* istanbul ignore if  */
      if (options.page && cars.pages && cars.pages < options.page) {
        res.status(400).json({
          error: 'La página solicitada no existe.',
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
      /* istanbul ignore next  */
      if (e) {
        console.log('e', e);
        res.status(500).json(e);
      }
    }
  }

  private getCars(filter: any, options: PaginateOptions, search?: string): Promise<PaginateResult<ICarModel>> {
    if (search && search.length) {
      const searchText = new RegExp(search, 'i');
      filter = {
        $and: [{
          $or: [{
            vin: {$regex: searchText}
          }, {
            brand: {$regex: searchText}
          }, {
            denomination: {$regex: searchText}
          }, {
            color: {$regex: searchText}
          }]
        }, filter]
      };
    }

    return new Promise((resolve, reject) => {
      Car.paginate(filter, options, (err, result) => {
        /* istanbul ignore if */
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new AdminCarController();
