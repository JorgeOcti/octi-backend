import {ObjectID} from 'bson';
import {Response} from 'express';
import * as GraphicsMagick from 'gm';
import * as mongoose from 'mongoose';
import Car, {
  ICarModel
} from '../../app/models/car.model';
import CarModel from '../../app/models/car.model';
import VenueModel, {
  IVenueModel
} from '../../app/models/venue.model';
import {IRequest} from '../../interfaces/global.interface';
import {IInventoryCar} from '../../interfaces/inventory.interface';
import {io} from '../../server';
import InventoryModel, {
  ChoicesStatusCarInventory,
  ChoicesStatusInventory
} from '../models/inventory.model';
import InventoryFileModel from '../models/inventoryFile.model';

class InventoryController {

  constructor() {
    this.index = this.index.bind(this);
    this.detail = this.detail.bind(this);
    this.create = this.create.bind(this);
    this.list = this.list.bind(this);
    this.apiList = this.apiList.bind(this);
    this.apiDetaill = this.apiDetaill.bind(this);
    this.apiFoundCar = this.apiFoundCar.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
    this.autoRotate = this.autoRotate.bind(this);
    this.finishInventory = this.finishInventory.bind(this);
    this.deleteInventory = this.deleteInventory.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    res.render('app/index', {token: await req.user.generateToken()});
  }

  public async detail(req: IRequest, res: Response) {
    const {company} = req.user;
    const {id} = req.params;
    try {
      const inventory = await InventoryModel.findOne({_id: id, company});
      if (!inventory) {
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

  public async create(req: IRequest, res: Response) {
    const company = req.user.company;
    const {carsByVenue, name} = req.body;
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
                  car: currentCar._id,
                  images: []
                });
              }
            }
          }
        }
      }
      const inventory = new InventoryModel({
        name,
        company,
        cars: inventoryCars,
        venues: venuesIDs,
        createdBy: req.user._id,
        status: ChoicesStatusInventory.inProcess
      });
      await inventory.save();
      res.json({
        message: 'Inventario creado satisfactoriamente',
        status: 200
      });
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
            createdAt: '$createdAt',
            finalizedAt: '$finalizedAt'
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
          finalizedAt: {
            $first: '$_id.finalizedAt'
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
          'createdAt': 1,
          'finalizedAt': 1
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
          createdAt: inventory.createdAt,
          finalizedAt: inventory.finalizedAt ? inventory.finalizedAt : null
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

  public async uploadFile(req: IRequest, res: Response) {
    const {id} = req.params;
    const {company} = req.user;
    if (req.file) {
      const file: any = req.file;
      try {
        const inventoryFile = new InventoryFileModel();
        /*
          {
            fieldname: 'file',
            originalname: 'Captura de pantalla 2018-06-28 a la(s) 11.59.58.png',
            encoding: '7bit',
            mimetype: 'image/png',
            destination: '/tmp/',
            filename: 'Captura de pantalla 2018-06-28 a la(s) 11.59.58.png',
            path: '/tmp/Captura de pantalla 2018-06-28 a la(s) 11.59.58.png',
            size: 794429
          }
        */
        // fix exif
        if (new RegExp('\\bimage\\b').test(file.mimetype)) {
          await this.autoRotate(file.path);
        }
        file.headers = {
          'Content-Type': file.mimetype
        };
        file.company = company._id;
        file.inventory = id;

        inventoryFile.user = req.user._id;
        inventoryFile.company = company._id;
        inventoryFile.attach('file', file, async (error: any) => {
          if (error) {
            res.status(400).json(error);
          } else {
            await inventoryFile.save();
            res.status(201).json({
              data: {
                _id: inventoryFile._id,
                file: inventoryFile.file
              },
              status: 201
            });
          }
        });
      } catch (e) {
        res.status(400).json(e);
      }
    } else {
      res.status(400).json({
        message: 'La imagen es obligatoria.',
        status: 400
      });
    }
  }

  public async apiFoundCar(req: IRequest, res: Response) {
    const {company, venue} = req.user;
    const {id} = req.params;
    const {vin, images} = req.body;
    try {
      const car = await Car.findOne({
        vin,
        company
      });
      // if car exist
      let textNotification = '';
      if (car) {
        textNotification = `${req.user.firstName} ${req.user.lastName} encontró ${car.brand} (${car.denomination}) en ${venue.name}.`;
        const inventoriedCar = await InventoryModel.findOne({
          $and: [{
            _id: id
          }, {
            company
          }, {
            cars: {
              $elemMatch: {
                car: car._id,
                status: {
                  $ne: ChoicesStatusCarInventory.pending
                }
              }
            }
          }]
        }, {
          'cars.$': 1
        });
        if (inventoriedCar) {
          res.status(400).json({
            message: 'Este auto ya ha sido inventariado',
            status: 400
          });
        } else {
          const inventoryCar = await InventoryModel.findOne({
            _id: id,
            ['cars.car']: car._id,
            company
          }, {
            'cars.$': 1
          });
          // if car in inventory
          if (inventoryCar && inventoryCar.cars.length) {
            if (inventoryCar.cars[0].venue.toString() === req.user.venue._id.toString()) {
              await InventoryModel.update({
                _id: id,
                ['cars.car']: car._id,
                company
              }, {
                $set: {
                  'cars.$.venueFound': venue._id,
                  'cars.$.status': ChoicesStatusCarInventory.found,
                  'cars.$.images': images ? images.map((image: string) => (new ObjectID(image))) : [],
                  'cars.$.inventoriedBy': req.user._id
                }
              }, {
                upsert: true
              });
              io.to(`inventory-detail-${inventoryCar._id}`).emit('REFRESH', {
                title: 'Vehiculo encontrado',
                text: textNotification,
                status: ChoicesStatusCarInventory.found,
                update: true
              });
            } else {
              const inventory = await InventoryModel.findOne({
                _id: id,
                company
              });
              if (inventory) {
                inventory.cars.push({
                  car: car._id,
                  venue: req.user.venue._id,
                  venueFound: req.user.venue._id,
                  images: images ? images.map((image: string) => (new ObjectID(image))) : [],
                  status: ChoicesStatusCarInventory.leftover,
                  inventoriedBy: req.user._id
                });
                await inventory.save();
              }
              io.to(`inventory-detail-${inventoryCar._id}`).emit('REFRESH', {
                title: 'Vehiculo encontrado',
                text: textNotification,
                status: ChoicesStatusCarInventory.leftover,
                update: true
              });
            }
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
                status: ChoicesStatusCarInventory.leftover,
                inventoriedBy: req.user._id,
                images: images ? images.map((image: string) => (new ObjectID(image))) : []
              });
              await inventory.save();
              // send socket messsage
              io.to(`inventory-list-${company._id}`).emit('REFRESH', {
                update: true
              });
              io.to(`inventory-detail-${inventory._id}`).emit('REFRESH', {
                title: 'Vehiculo encontrado',
                text: textNotification,
                status: ChoicesStatusCarInventory.leftover,
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
          textNotification = `${req.user.firstName} ${req.user.lastName} encontró ${vin} en ${venue.name}.`;
          inventory.cars.push({
            car: newCar._id,
            venue: venue._id,
            venueFound: venue._id,
            status: ChoicesStatusCarInventory.leftover,
            inventoriedBy: req.user._id,
            images: images ? images.map((image: string) => (new ObjectID(image))) : []
          });
          await inventory.save();
          // send socket messsage
          io.to(`inventory-list-${company._id}`).emit('REFRESH', {
            update: true
          });
          io.to(`inventory-detail-${inventory._id}`).emit('REFRESH', {
              title: 'Vehiculo encontrado',
              text: textNotification,
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
      console.log(e);
      res.status(400).json({
        message: e,
        status: 400
      });
    }
  }

  public async finishInventory(req: IRequest, res: Response) {
    const {company} = req.user;
    const {id} = req.params;
    try {
      const inventory = await InventoryModel.findOne({_id: id, company});
      if (inventory) {
        await inventory.update({
          status: ChoicesStatusInventory.finalized,
          finalizedAt: new Date(),
          finalizedBy: req.user._id
        });
        res.json({
          message: 'Se ha finalizado correctamente el inventario.',
          status: 200
        });
      } else {
        res.status(400).json({
          message: 'No se ha encontrado el inventario',
          status: 400
        });
      }

    } catch (e) {
      console.log('e', e);
      res.status(400).json({
        message: 'Ha ocurrido un error',
        status: 400
      });
    }
  }

  public async deleteInventory(req: IRequest, res: Response) {
    const {company} = req.user;
    const {id} = req.params;
    try {
      const inventory = await InventoryModel.findOne({
        _id: id,
        company
      });
      if (inventory) {
        await inventory.remove();
        res.json({
          message: 'Se ha eliminado correctamente el inventario.',
          status: 200
        });
      } else {
        res.status(400).json({
          message: 'No se ha encontrado el inventario',
          status: 400
        });
      }

    } catch (e) {
      console.log('e', e);
      res.status(400).json({
        message: 'Ha ocurrido un error',
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

  public async apiDetaill(req: IRequest, res: Response) {
    const {id} = req.params;
    const {company} = req.user;
    try {
      // summary
      const inventory = await InventoryModel.aggregate([
        {
          $match: {
            company,
            _id: {$in: [mongoose.Types.ObjectId(id)]}
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
              createdAt: '$createdAt',
              finalizedAt: '$finalizedAt'
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
            finalizedAt: {
              $first: '$_id.finalizedAt'
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
            'createdAt': 1,
            'finalizedAt': 1
          }
        }, {
          $sort: {
            createdAt: -1
          }
        }]);
      // detail by venue
      const detailByVenues = await InventoryModel.aggregate([
        {
          $match: {
            company,
            _id: {$in: [mongoose.Types.ObjectId(id)]}
          }
        }, {
          $unwind: '$cars'
        }, {
          $group: {
            _id: {
              category: '$cars.venue',
              status: '$cars.status'
            },
            total: {
              $sum: 1
            }
          }
        }, {
          $group: {
            _id: '$_id.category',
            status: {
              $push: {
                name: '$_id.status',
                total: '$total'
              }
            }
          }
        }, {
          $lookup: {
            from: 'venues',
            localField: '_id',
            foreignField: '_id',
            as: 'info'
          }
        }, {
          $unwind: '$info'
        }]);
      // detail by brands
      const detailByBrands = await InventoryModel.aggregate([
        {
          $match: {
            company,
            _id: {$in: [mongoose.Types.ObjectId(id)]}
          }
        }, {
          $unwind: '$cars'
        }, {
          $lookup: {
            from: 'cars',
            localField: 'cars.car',
            foreignField: '_id',
            as: 'car'
          }
        }, {
          $unwind: '$car'
        }, {
          $group: {
            _id: {
              car: '$car.brand',
              status: '$cars.status'
            },
            total: {
              $sum: 1
            }
          }
        }, {
          $group: {
            _id: '$_id.car',
            status: {
              $push: {
                name: '$_id.status',
                total: '$total'
              }
            }
          }
        }, {
          $lookup: {
            from: 'venues',
            localField: '_id',
            foreignField: '_id',
            as: 'info'
          }
        }]);

      const detailByBrand: any[] = [];
      const detailByVenue: any[] = [];

      const defaultResults = {
        [ChoicesStatusCarInventory.pending]: 0,
        [ChoicesStatusCarInventory.found]: 0,
        [ChoicesStatusCarInventory.leftover]: 0
      };

      for (const db of detailByBrands) {
        detailByBrand.push({
          name: db._id ? db._id : 'Sin Marca',
          results: db.status.reduce((acc: any, cur: any) => {
            acc[cur.name] = cur.total;
            return acc;
          }, {
            ...defaultResults
          })
        });
      }
      for (const dv of detailByVenues) {
        detailByVenue.push({
          name: dv.info.name,
          results: dv.status.reduce((acc: any, cur: any) => {
            acc[cur.name] = cur.total;
            return acc;
          }, {
            ...defaultResults
          })
        });
      }
      if (inventory && inventory.length) {
        const currentInventory = inventory[0];
        const response = {
          _id: currentInventory._id,
          name: currentInventory.name,
          createdBy: currentInventory.userInfo ? {
            ...currentInventory.userInfo,
            fullName: `${currentInventory.userInfo.firstName} ${currentInventory.userInfo.lastName}`
          } : {},
          results: currentInventory.results.reduce((acc: any, cur: any) => {
            acc[cur.status] = cur.total;
            return acc;
          }, {
            ...defaultResults
          }),
          status: currentInventory.status,
          createdAt: currentInventory.createdAt,
          finalizedAt: currentInventory.finalizedAt ? currentInventory.finalizedAt : null
        };
        // console.log('detailByVenue', detailByVenue);
        res.json({
          summary: response,
          detailByVenue,
          detailByBrand,
          status: 200
        });
      } else {
        res.status(404).json({
          message: 'Inventario no encontrado',
          status: 404
        });
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({
        message: e,
        status: 400
      });
    }
  }

  private autoRotate(path: string) {
    // doc http://aheckmann.github.io/gm/docs.html
    /**** REQUIRE *****
      brew install imagemagick
      brew install graphicsmagick
    * */
    return new Promise((resolve, reject) => {
      GraphicsMagick(path)
        .autoOrient()
        .write(path, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
    });
  }
}
export default new InventoryController();
