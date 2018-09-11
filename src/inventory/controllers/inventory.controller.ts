import {Response} from 'express';
import CarModel, {ICarModel} from '../../app/models/car.model';
import VenueModel, {IVenueModel} from '../../app/models/venue.model';
import {IRequest} from '../../interfaces/global.interface';
import {IInventoryCar} from '../../interfaces/inventory.interface';
import InventoryModel from '../models/inventory.model';

class InventoryController {

  constructor() {
    this.index = this.index.bind(this);
    this.create = this.create.bind(this);
  }
  public async index(req: IRequest, res: Response) {
    res.render('app/index', {token: await req.user.generateToken()});
  }

  public async create(req: IRequest, res: Response) {
    const company = req.user.company;
    const {carsByVenue} = req.body;
    try {
      const inventoryCars: IInventoryCar[] = [];
      const venuesIDs: string[] = [];
      for (const venue of carsByVenue) {
        if (venue.name && venue.name.length) {
          let currentVenue: IVenueModel | null = await VenueModel.findOne({company, name: venue.name});
          if (currentVenue === null) {
            currentVenue = new VenueModel({
              name: venue.name,
              company
            });
            await currentVenue.save();
          }
          venuesIDs.push(currentVenue._id.toString());
          if (venue.cars && venue.cars.length) {
            for (const car of venue.cars) {
              let currentCar: ICarModel | null = await CarModel.findOne({
                company,
                vin: car.vin
              });
              if (currentCar === null && car.vin && car.vin.length) {
                currentCar = new CarModel({
                  company,
                  vin: car.vin,
                  vin2: car.vin.substr(car.vin.length - 6),
                  color: car.color,
                  denomination: car.denomination,
                  brand: car.brand,
                  patent: car.patent
                });
                await currentCar.save();
              }
              if (currentVenue && currentCar) {
                inventoryCars.push({
                  venue: currentVenue._id,
                  car: currentCar._id
                });
              }
            }
          }
        }
      }
      const inventory = new InventoryModel({
        name: 'prueba',
        company,
        cars: inventoryCars,
        venues: venuesIDs
      });
      inventory.save();
      res.json({});
    } catch (e) {
      res.status(400).json({
        message: e,
        status: 400
      });
    }
  }

  public async list(req: IRequest, res: Response) {
    const {company, venue} = req.user;
    try {
      const inventories = await InventoryModel.find({
        company,
        venues: venue._id
      }, {
        _id: true,
        name: true
      });
      res.json({
        data: inventories,
        status: 200
      });
    } catch (e) {
      res.status(400).json({
        message: e,
        status: 400
      });
    }
  }
}
export default new InventoryController();
