import {Response} from 'express';
import CarModel from '../../app/models/car.model';
import Car, {ICarModel} from '../../app/models/car.model';
import VenueModel, {IVenueModel} from '../../app/models/venue.model';
import {IRequest} from '../../interfaces/global.interface';
import {IInventoryCar} from '../../interfaces/inventory.interface';
import {io} from '../../server';
import InventoryModel, {ChoicesStatusCarInventory, ChoicesStatusInventory} from '../models/inventory.model';

class InventoryController {

  constructor() {
    this.index = this.index.bind(this);
    this.create = this.create.bind(this);
    this.list = this.list.bind(this);
    this.apiList = this.apiList.bind(this);
    this.apiFoundCar = this.apiFoundCar.bind(this);
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
        venues: venuesIDs,
        createdBy: req.user._id,
        status: ChoicesStatusInventory.inProcess
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
    const {company} = req.user;
    try {
      const response: any[] = [];
      const inventories = await InventoryModel.aggregate([{
        $match: {
          company
        }
      }, {
        $unwind: '$cars'
      }, {
        $group: {
          _id: {
            category: '$_id',
            status: '$status',
            carStatus: '$cars.status',
            name: '$name',
            createdBy: '$createdBy',
            createdAt: '$createdAt'
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
        $unwind: '$userInfo'
      }, {
        $project: {
          '_id': 1,
          'name': 1,
          'results': 1,
          'userInfo.firstName': 1,
          'userInfo.lastName': 1,
          'status': 1,
          'createdAt': 1
        }
      }, {
        $sort : {
          createdAt : -1
        }
      }]);
      for (const inventory of inventories) {
        const defaultResults = {
          [ChoicesStatusCarInventory.pending]: 0,
          [ChoicesStatusCarInventory.found]: 0,
          [ChoicesStatusCarInventory.leftover]: 0
        };
        response.push({
          _id: inventory._id,
          name: inventory.name,
          createdBy: inventory.userInfo ? {
            ...inventory.userInfo,
            fullName: `${inventory.userInfo.firstName} ${inventory.userInfo.lastName}`
          } : {},
          results: inventory.results.reduce((acc: any, cur: any) => {
            acc[cur.status] = cur.total;
            return acc;
          }, {
            ...defaultResults
          }),
          status: inventory.status,
          createdAt: inventory.createdAt
        });
      }
      res.json({
        inventories: response,
        status: 200
      });
    } catch (e) {
      console.log(e);
      res.status(400).json({
        message: e,
        status: 400
      });
    }
  }

  public async apiFoundCar(req: IRequest, res: Response) {
    const {company, venue} = req.user;
    const {id} = req.params;
    const {vin} = req.body;
    try {
      const car = await Car.findOne({
        vin,
        company
      });
      // if car exist
      if (car) {
        const inventoryCar = await InventoryModel.findOne({
          _id: id,
          ['cars.car']: car._id,
          company
        }, {'cars.$': 1});
        // if car in inventory
        if (inventoryCar && inventoryCar.cars.length) {
          await InventoryModel.update({
            _id: id,
            ['cars.car']: car._id,
            company
          }, {
            $set: {
              'cars.$.venueFound': venue._id,
              'cars.$.status': ChoicesStatusCarInventory.found
            }
          }, {
            upsert: true
          });
          // send socket messsage
          io.to(`inventory-list-${company._id}`).emit('REFRESH', {
            update: true
          });
          res.json({
            id
          });
        } else {
          const inventory = await InventoryModel.findOne({
            _id: id,
            company
          });
          if (inventory) {
            inventory.cars.push({
              car: car._id,
              venue: venue._id,
              venueFound: venue._id,
              status: ChoicesStatusCarInventory.leftover
            });
            await inventory.save();
            // send socket messsage
            io.to(`inventory-list-${company._id}`).emit('REFRESH', {
              update: true
            });
            res.json({
              id
          });
          } else {
            // if inventory no exist
            res.status(400).json({
              message: 'Este inventario ya no se encuentra activo',
              status: 400
            });
          }
        }
      } else {
        // if car no exist
        const inventory = await InventoryModel.findOne({
          _id: id,
          company
        });
        if (inventory) {
          const newCar = new CarModel({
            vin,
            vin2: vin.substr(vin.length - 6),
            company
          });
          await newCar.save();
          inventory.cars.push({
            car: newCar._id,
            venue: venue._id,
            venueFound: venue._id,
            status: ChoicesStatusCarInventory.leftover
          });
          await inventory.save();
          // send socket messsage
          io.to(`inventory-list-${company._id}`).emit('REFRESH', {
            update: true
          });
          res.json({
            id
          });
        } else {
          // if inventory no exist
          res.status(400).json({
            message: 'Este inventario ya no se encuentra activo',
            status: 400
          });
        }
      }
    } catch (e) {
      res.status(400).json({
        message: e,
        status: 400
      });
    }
  }

  public async apiList(req: IRequest, res: Response) {
    const {company, venue} = req.user;
    try {
      const inventories = await InventoryModel.find({
        company,
        venues: venue._id,
        status: {
          $in: [ChoicesStatusInventory.inProcess]
        }
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
