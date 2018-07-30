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
}

export default new AdminCarsController();
