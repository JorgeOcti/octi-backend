import {ObjectID} from 'bson';
import {Response} from 'express';
import * as GraphicsMagick from 'gm';
import * as mongoose from 'mongoose';
import CarModel, {ChoicesStatusCar} from '../../app/models/car.model';
import Car, {
  ICarModel
} from '../../app/models/car.model';
import UserModel from '../../app/models/user.model';
import User from '../../app/models/user.model';
import VenueModel, {
  IVenueModel
} from '../../app/models/venue.model';
import {IRequest} from '../../interfaces/global.interface';
import {IInventoryCar} from '../../interfaces/inventory.interface';
import {io} from '../../server';
import PushService from '../../services/push.service';
import InventoryModel, {
  ChoicesStatusCarInventory,
  ChoicesStatusInventory
} from '../models/inventory.model';
import Inventory from '../models/inventory.model';
import InventoryFileModel from '../models/inventoryFile.model';

class InventoryController {

  constructor() {
    this.index = this.index.bind(this);
    this.detail = this.detail.bind(this);
    this.create = this.create.bind(this);
    this.list = this.list.bind(this);
    this.detaill = this.detaill.bind(this);
    this.apiList = this.apiList.bind(this);
    this.apiDetail = this.apiDetail.bind(this);
    this.apiFoundCar = this.apiFoundCar.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
    this.autoRotate = this.autoRotate.bind(this);
    this.finishInventory = this.finishInventory.bind(this);
    this.deleteInventory = this.deleteInventory.bind(this);
    this.reportCar = this.reportCar.bind(this);
    this.addComment = this.addComment.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    res.render('app/index', {token: await req.user.generateToken()});
  }

  public async detail(req: IRequest, res: Response) {
    const {team} = req.user;
    const {id} = req.params;
    try {
      const inventory = await InventoryModel.findOne({_id: id, team});
      if (!inventory) {
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

  public async create(req: IRequest, res: Response) {
    const {company, team} = req.user;
    const {carsByVenue, name, notification} = req.body;
    try {
      const inventoryCars: IInventoryCar[] = [];
      const venuesIDs: string[] = [];
      for (const venue of carsByVenue) {
        if (venue.name && venue.name.length) {
          const venueRegExp = new RegExp(venue.name, 'i');
          let currentVenue: IVenueModel | null = await VenueModel.findOne({team, name: venueRegExp});
          // create venue if no existe
          if (currentVenue === null) {
            currentVenue = new VenueModel({
              name: venue.name,
              team,
              company
            });
            await currentVenue.save();
          }
          venuesIDs.push(currentVenue._id.toString());
          if (venue.cars && venue.cars.length) {
            for (const car of venue.cars) {
              let currentCar: ICarModel | null = await CarModel.findOne({
                team,
                vin: car.vin
              });
              if (currentCar === null && car.vin && car.vin.trim().length) {
                currentCar = new CarModel({
                  team,
                  company,
                  vin: car.vin,
                  vin2: car.vin.substr(car.vin.length - 6),
                  color: car.color,
                  denomination: car.denomination,
                  brand: car.brand,
                  patent: car.patent,
                  status: ChoicesStatusCar.active
                });
                await currentCar.save();
              }
              if (currentVenue && currentCar) {
                inventoryCars.push({
                  venue: currentVenue._id,
                  car: currentCar._id,
                  comments: [],
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
        team,
        cars: inventoryCars,
        venues: venuesIDs,
        createdBy: req.user._id,
        status: ChoicesStatusInventory.inProcess
      });
      await inventory.save();
      if (notification) {
        const usersIDs = await UserModel.find({
          venue: {
            $in: venuesIDs
          },
          company
        }, {
          _id: true
        });
        PushService.massiveSend(
          'Nuevo inventario',
          `Se ha iniciado el inventario "${inventory.name}"`,
          'Ya puedes empezar a escanear',
           usersIDs.map((user) => user._id.toString())
        );
      }
      io.to(`inventory-list-${company}`).emit('REFRESH', {
        update: true
      });
      res.json({
        _id: inventory._id.toString(),
        message: 'Inventario creado satisfactoriamente',
        status: 200
      });
    } catch (e) {
      /* istanbul ignore next */
      res.status(400).json({
        message: e,
        status: 400
      });
    }
  }

  public async list(req: IRequest, res: Response) {
    const {team} = req.user;
    const venuesPermissions = req.user.venuesPermissions();
    try {
      const response: any[] = [];
      const inventories = await InventoryModel.aggregate([{
        $match: {
          team,
          venues: {
            $in: venuesPermissions
          }
        }
      }, {
        $unwind: '$cars'
      }, {
        $match: {
          'cars.venue': {
            $in: venuesPermissions
          }
        }
      }, {
        $group: {
          _id: {
            category: '$_id',
            status: '$status',
            carStatus: '$cars.status',
            name: '$name',
            createdBy: '$createdBy',
            createdAt: '$createdAt',
            finalizedBy: '$finalizedBy',
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
          createdBy: {
            $first: '$_id.createdBy'
          },
          finalizedBy: {
            $first: '$_id.finalizedBy'
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
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdBy'
        }
      }, {
        $lookup: {
          from: 'users',
          localField: 'finalizedBy',
          foreignField: '_id',
          as: 'finalizedBy'
        }
      }, {
        $project: {
          '_id': 1,
          'name': 1,
          'results': 1,
          'createdBy.firstName': 1,
          'createdBy.lastName': 1,
          'finalizedBy.firstName': 1,
          'finalizedBy.lastName': 1,
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
          [ChoicesStatusCarInventory.missing]: 0,
          [ChoicesStatusCarInventory.reported]: 0,
          [ChoicesStatusCarInventory.leftover]: 0
        };
        response.push({
          _id: inventory._id,
          name: inventory.name,
          createdBy: inventory.createdBy.length ? {
            fullName: `${inventory.createdBy[0].firstName} ${inventory.createdBy[0].lastName}`
          } : {},
          finalizedBy: inventory.finalizedBy.length ? {
            fullName: `${inventory.finalizedBy[0].firstName} ${inventory.finalizedBy[0].lastName}`
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
      /* istanbul ignore next */
      console.log(e);
      /* istanbul ignore next */
      res.status(400).json({
        message: e,
        status: 400
      });
    }
  }

  public async apiDetail(req: IRequest, res: Response) {
    const {team} = req.user;
    const {id} = req.params;
    try {
      const updatedUser = await User.findById(req.user._id);
      if (!updatedUser) {
        res.status(404).json({
          message: 'No se ha encontrado el inventario solicitado.',
          status: 404
        });
      } else {
        const inventory = await Inventory
          .findOne({
            _id: id,
            venues: updatedUser.venue,
            status: {
              $in: [ChoicesStatusInventory.inProcess]
            },
            team
          })
          .populate([{
            path: 'cars.car',
            select: ['vin', 'vin2', 'color', 'denomination', 'brand', 'patent']
          }, {
            path: 'cars.venue',
            select: ['name']
          }]).lean();
        if (inventory) {
          res.status(200).json({
            data: {
              cars: inventory.cars
                .filter((car: IInventoryCar) => (car.status !== ChoicesStatusCarInventory.reported))
                .map((car: IInventoryCar) => {
                return {
                  ...car.car,
                  venue: car.venue,
                  status: car.status
                };
              }),
              reasons: []
            },
            status: 200
          });
        } else {
          res.status(404).json({
            message: 'No se ha encontrado el inventario solicitado.',
            status: 404
          });
        }
      }
    } catch (e) {
      /* istanbul ignore next */
      res.status(400).json(e);
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
            /* istanbul ignore next */
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
        /* istanbul ignore next */
        res.status(400).json(e);
      }
    } else {
      /* istanbul ignore next */
      res.status(400).json({
        message: 'La imagen es obligatoria.',
        status: 400
      });
    }
  }

  public async apiFoundCar(req: IRequest, res: Response) {
    const {team, venue} = req.user;
    const {id} = req.params;
    const {vin, images} = req.body;
    try {
      const car = await Car.findOne({
        vin,
        team
      });
      // if car exist
      let textNotification = '';
      if (car) {
        textNotification = `${req.user.firstName} ${req.user.lastName} encontró ${car.brand} (${car.denomination}) en ${venue.name}.`;
        const inventoriedCar = await InventoryModel.findOne({
          $and: [{
            _id: id
          }, {
            team
          }, {
            cars: {
              $elemMatch: {
                $or: [{
                  car: car._id,
                  status: ChoicesStatusCarInventory.found
                }, {
                  car: car._id,
                  venueFound: venue._id,
                  status: ChoicesStatusCarInventory.leftover
                }]
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
            team
          }, {
            'cars.$': 1
          });
          // if car in inventory
          if (inventoryCar && inventoryCar.cars.length) {
            if (inventoryCar.cars[0].venue.toString() === req.user.venue._id.toString()) {
              await InventoryModel.update({
                _id: id,
                ['cars.car']: car._id,
                team
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
                team
              });
              if (inventory) {
                inventory.cars.push({
                  car: car._id,
                  comments: [],
                  venue: inventoryCar.cars[0].venue ? inventoryCar.cars[0].venue : req.user.venue._id,
                  venueFound: req.user.venue._id,
                  images: images ? images.map((image: string) => (new ObjectID(image))) : [],
                  status: ChoicesStatusCarInventory.leftover,
                  inventoriedBy: req.user._id
                });
                await inventory.save();
              }
              io.to(`inventory-detail-${inventoryCar._id}`).emit('REFRESH', {
                title: 'Vehículo encontrado',
                text: textNotification,
                status: ChoicesStatusCarInventory.leftover,
                update: true
              });
            }
            // send socket messsage
            io.to(`inventory-list-${team._id}`).emit('REFRESH', {
              update: true
            });
            res.json({
              vin: car.vin,
              status: 200
            });
          } else {
            const inventory = await InventoryModel.findOne({
              _id: id,
              team
            });
            if (inventory) {
              inventory.cars.push({
                car: car._id,
                venue: venue._id,
                comments: [],
                venueFound: venue._id,
                status: ChoicesStatusCarInventory.leftover,
                inventoriedBy: req.user._id,
                images: images ? images.map((image: string) => (new ObjectID(image))) : []
              });
              await inventory.save();
              // send socket messsage
              io.to(`inventory-list-${team._id}`).emit('REFRESH', {
                update: true
              });
              io.to(`inventory-detail-${inventory._id}`).emit('REFRESH', {
                title: 'Vehículo encontrado',
                text: textNotification,
                status: ChoicesStatusCarInventory.leftover,
                update: true
              });
              res.status(200).json({
                vin: car.vin,
                status: 200
              });
            } else {
              // if inventory no exist
              res.status(400).json({
                message: 'Este inventario ya no se encuentra activo.',
                status: 400
              });
            }
          }
        }
      } else {
        // if car no exist
        const inventory = await InventoryModel.findOne({
          _id: id,
          team
        });
        if (inventory) {
          const newCar = new CarModel({
            vin,
            vin2: vin.substr(vin.length - 6),
            team,
            status: ChoicesStatusCar.active
          });
          await newCar.save();
          textNotification = `${req.user.firstName} ${req.user.lastName} encontró ${vin} en ${venue.name}.`;
          inventory.cars.push({
            car: newCar._id,
            comments: [],
            venue: venue._id,
            venueFound: venue._id,
            status: ChoicesStatusCarInventory.leftover,
            inventoriedBy: req.user._id,
            images: images ? images.map((image: string) => (new ObjectID(image))) : []
          });
          await inventory.save();
          // send socket messsage
          io.to(`inventory-list-${team._id}`).emit('REFRESH', {
            update: true
          });
          io.to(`inventory-detail-${inventory._id}`).emit('REFRESH', {
              title: 'Vehiculo encontrado',
              text: textNotification,
              update: true
            });
          res.status(200).json({
            id,
            status: 200
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
      /* istanbul ignore next */
      console.log(e);
      /* istanbul ignore next */
      res.status(400).json({
        message: e,
        status: 400
      });
    }
  }

  public async finishInventory(req: IRequest, res: Response) {
    const {team} = req.user;
    const {id} = req.params;
    try {
      const inventory = await InventoryModel.findOne({_id: id, team});
      if (inventory) {
        await inventory.update({
          status: ChoicesStatusInventory.finalized,
          finalizedAt: new Date(),
          finalizedBy: req.user._id
        });
        io.to(`inventory-list-${team}`).emit('REFRESH', {
          update: true
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
      /* istanbul ignore next */
      console.log('e', e);
      /* istanbul ignore next */
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
        io.to(`inventory-list-${company}`).emit('REFRESH', {
          update: true
        });
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
      /* istanbul ignore next */
      console.log('e', e);
      /* istanbul ignore next */
      res.status(400).json({
        message: 'Ha ocurrido un error',
        status: 400
      });
    }
  }

  public async addComment(req: IRequest, res: Response) {
    const {team} = req.user;
    const {id} = req.params;
    const {_id, comment} = req.body;
    try {

      await InventoryModel.update({
        _id: id,
        ['cars._id']: _id,
        team
      }, {
        $push: {
          'cars.$.comments': {
            user: req.user._id,
            comment,
            createdAt: new Date()
          }
        }
      }, {
        upsert: true
      });
      io.to(`inventory-detail-${id}`).emit('REFRESH', {
        update: true
      });
      io.to(`inventory-comment-${_id}`).emit('NEW_COMMENT', {
        _id: new ObjectID(),
        user: {
          _id: req.user._id,
          firstName: req.user.firstName,
          lastName: req.user.lastName
        },
        comment
      });
      res.status(200).json({
        message: 'Comentario agregado satisfactoriamente.',
        status: 200
      });
    } catch (e) {
      /* istanbul ignore next */
      console.log('e', e);
      /* istanbul ignore next */
      res.status(400).json({
        message: 'Ha ocurrido un error',
        status: 400
      });
    }
  }

  public async reportCar(req: IRequest, res: Response) {
    const {team, company, venue} = req.user;
    const {id} = req.params;
    const {vin, denomination, brand, color, images} = req.body;
    try {
      const inventory = await InventoryModel.findOne({
        _id: id,
        team
      });
      if (inventory) {
        const car = await CarModel.findOneOrCreate({
          vin,
          team
        }, {
          vin,
          vin2: vin.substr(vin.length - 6),
          brand,
          denomination,
          color,
          team,
          company,
          status: ChoicesStatusCar.inventory
        });
        inventory.cars.push({
          car,
          venue,
          venueFound: venue,
          comments: [],
          inventoriedBy: req.user._id,
          images:  images ? images.map((image: string) => (new ObjectID(image))) : [],
          status: ChoicesStatusCarInventory.reported
        });
        await inventory.save();
        const textNotification = `${req.user.firstName} ${req.user.lastName} encontró ${car.brand} (${car.denomination}) en ${venue.name}.`;
        io.to(`inventory-detail-${inventory._id}`).emit('REFRESH', {
          title: 'Vehículo reportado',
          text: textNotification,
          status: ChoicesStatusCarInventory.reported,
          update: true
        });
        io.to(`inventory-list-${team._id}`).emit('REFRESH', {
          update: true
        });
        res.json({
          message: 'Se ha generado el reporte correctamente.',
          vin,
          status: 200
        });
      } else {
        res.status(400).json({
          message: 'Este inventario ya no se encuentra disponible.',
          status: 400
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      console.log(e);
      /* istanbul ignore next */
      res.status(400).json({
        message: e,
        status: 400
      });
    }
  }

  public async apiList(req: IRequest, res: Response) {
    const {team} = req.user;
    try {
      const updatedUser = await User.findById(req.user._id);
      if (updatedUser) {
        const inventories = await InventoryModel.find({
          team,
          venues: updatedUser.venue,
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
      } else {
        /* istanbul ignore next */
        res.status(400).json({
          message: 'Usuario no encontrado',
          status: 400
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      res.status(400).json({
        message: e,
        status: 400
      });
    }
  }

  public async detaill(req: IRequest, res: Response) {
    const {id} = req.params;
    const {team} = req.user;
    let venuesPermissions = req.user.venuesPermissions();
    try {
      // summary
      const inventory = await InventoryModel.aggregate([
        {
          $match: {
            team,
            _id: {$in: [mongoose.Types.ObjectId(id)]}
          }
        }, {
          $unwind: '$cars'
        }, {
          $match: {
            'cars.venue': {
              $in: venuesPermissions
            }
          }
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
            team,
            _id: {$in: [mongoose.Types.ObjectId(id)]}
          }
        }, {
          $unwind: '$cars'
        }, {
          $match: {
            'cars.venue': {
              $in: venuesPermissions
            }
          }
        }, {
          $group: {
            _id: {
              category: {
                $cond: {
                  if: {
                    $eq: ['$cars.status', 'leftover']
                  },
                  then: '$cars.venueFound',
                  else: '$cars.venue'
                }
              },
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
            team,
            _id: {$in: [mongoose.Types.ObjectId(id)]}
          }
        }, {
          $unwind: '$cars'
        }, {
          $match: {
            'cars.venue': {
              $in: venuesPermissions
            }
          }
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
        [ChoicesStatusCarInventory.leftover]: 0,
        [ChoicesStatusCarInventory.missing]: 0,
        [ChoicesStatusCarInventory.reported]: 0
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
        const detailInventory = await InventoryModel.findById(id, {
          name: true,
          status: true,
          cars: true
        }).populate([{
          path: 'cars.car',
          select: ['vin', 'vin2', 'color', 'denomination', 'brand', 'venue', 'patent']
        }, {
          path: 'cars.venue',
          select: ['name']
        }, {
          path: 'cars.images'
        }, {
          path: 'cars.venueFound',
          select: ['name']
        }, {
          path: 'cars.inventoriedBy',
          select: ['firstName', 'lastName']
        }, {
          path: 'cars.comments.user',
          select: ['_id', 'firstName', 'lastName']
        }]);
        venuesPermissions = venuesPermissions.map((ve) => ve.toString());
        res.json({
          summary: response,
          detailByVenue,
          detailByBrand,
          detail: {
            _id: detailInventory ? detailInventory._id : '',
            name: detailInventory ? detailInventory.name : '',
            status: detailInventory ? detailInventory.status : '',
            cars: detailInventory ? detailInventory.cars.filter((car) => {
              return car.venue && venuesPermissions.includes(car.venue._id.toString()) || (car.venueFound && venuesPermissions.includes(car.venueFound._id.toString()));
            }) : []
          },
          status: 200
        });
      } else {
        res.status(404).json({
          message: 'Inventario no encontrado',
          status: 404
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      console.log(e);
      /* istanbul ignore next */
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
            /* istanbul ignore next */
            reject(err);
          } else {
            resolve();
          }
        });
    });
  }

}
export default new InventoryController();
