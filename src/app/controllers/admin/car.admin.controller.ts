import {Response} from 'express';
import {IRequest} from '../../../interfaces/global.interface';
import {io} from '../../../server';
import Car from '../../models/car.model';

class AdminCarsController {

  constructor() {
    this.index = this.index.bind(this);
    this.importCars = this.importCars.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    res.render('app/index', {token: await req.user.generateToken()});
  }

  public async importCars(req: IRequest, res: Response) {
    const company = req.user.company;
    const cars = req.body;
    if (cars && cars.length) {
      for (const car of cars) {
        setTimeout(async () => {
          const vin2 = car.vin.substr(car.vin.length - 6);
          try {
            const newCar = await Car.findOneOrCreate({
              vin: car.vin,
              company
            }, {
              vin: car.vin,
              vin2,
              bran: car.brand ? car.brand : '',
              denomination: car.denomination ? car.denomination : '',
              color: car.color ? car.color : '',
              company
            });
            // io.to(req.user._id).emit('STATUS-CARS', {newCar});
            console.log('newCar', newCar);
          } catch (e) {
            console.log(e);
          }
        }, 1000);
      }
      // cars.forEach(async (car: any) => {

      // });
      io.to(req.user._id).emit('FINISH-IMPORT', {finish: true});
    }
  }
}

export default new AdminCarsController();
