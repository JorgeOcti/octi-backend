import {ObjectID} from 'bson';
import {Response} from 'express';
import {PaginateOptions, PaginateResult} from 'mongoose';
import {IRequest} from '../../../interfaces/global.interface';
import {io} from '../../../server';
import Car, {ICarModel} from '../../models/car.model';

class AdminCarsController {

  constructor() {
    this.index = this.index.bind(this);
    this.importCars = this.importCars.bind(this);
    this.apiListCars = this.apiListCars.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    res.render('app/index', {token: await req.user.generateToken()});
  }

  public async importCars(req: IRequest, res: Response) {
    const company = req.user.company;
    const cars = req.body;
    if (cars && cars.length) {
      for (const car of cars) {
          if (car.vin && car.vin.length) {
            const vin2 = car.vin.substr(car.vin.length - 6);
            try {
              const newCar = await Car.findOne({
                vin: car.vin,
                company
              });
              if (newCar) {
                newCar.vin2 = vin2;
                newCar.brand = car.marca ? car.marca : newCar.brand;
                newCar.denomination = car.denominacion ? car.denominacion : newCar.denomination;
                newCar.color = car.denominacion ? car.color : newCar.color;
                newCar.internalNumber = car.NInterno ? car.NInterno : newCar.internalNumber;
                newCar.destination = car.destino ? car.destino : newCar.destination;
                await newCar.save();
              } else {
                await Car.create({
                  vin: car.vin,
                  vin2,
                  brand: car.marca ? car.marca : '',
                  denomination: car.denominacion ? car.denominacion : '',
                  color: car.color ? car.color : '',
                  internalNumber: car.NInterno ? car.NInterno : '',
                  destination: car.destino ? car.destino : '',
                  company
                });
              }
              // io.to(req.user._id).emit('STATUS-CARS', {newCar});
            } catch (e) {
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

  public async apiListCars(req: IRequest, res: Response) {
    const {page, pageSize} = req.query;
    const company = req.user.company;
    // paginate options
    const options: PaginateOptions = {
      select: {
        vin: true,
        vin2: true,
        brand: true,
        denomination: true,
        color: true,
        internalNumber: true
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
      const cars = await this.getCars(company, options);
      // validate exist page
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
      if (e) {
        res.status(500).json(e);
      }
    }
  }

  private getCars(company: ObjectID, options: PaginateOptions): Promise<PaginateResult<ICarModel>> {
    return new Promise((resolve, reject) => {
      Car.paginate({company}, options, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new AdminCarsController();
