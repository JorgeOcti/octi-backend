import * as GraphicsMagick from 'gm';
import * as Joi from 'joi';
import * as archiver from 'archiver';
import * as bluebird from 'bluebird';
import * as excel from 'exceljs';
import * as fs from 'fs';
import * as https from 'https';
import * as moment from 'moment';
import * as mongoose from 'mongoose';
import * as tempfile from 'tempfile';
import puppeteer from 'puppeteer';
import * as path from 'path';

import {
  default as Car,
  default as CarModel,
  ChoicesStatusCar,
  ICarModel
} from '../../app/models/car.model';
import {
  ChoicesStatusInventory,
  default as Inventory,
  default as InventoryModel, IInventoryModel
} from '../models/inventory.model';
import {
  IVenueModel,
  default as Venue,
  default as VenueModel
} from '../../app/models/venue.model';
import InventoryCar, {
  ChoicesStatusCarInventory, choicesStatusContainer, ChoicesStatusContainer
} from '../models/inventoryCar.model';
import {
  default as InventoryFile,
  default as InventoryFileModel
} from '../models/inventoryFile.model';
import { HydratedDocument, PaginateOptions, PipelineStage, Types } from 'mongoose';

import { Alignment } from 'exceljs';
import GeneralUtils from '../../utils/general.utils';
import History from '../../app/models/history.model';
import { IInventory, IInventoryCar, MessageType } from '../interfaces/inventory.interface';
import { IRequest } from '../../interfaces/global.interface';
import { IStockCar } from '../interfaces/stock.interface';
import InventoryLabel from '../models/inventoryLabel.model';
import { Response } from 'express';
import { ModuleHistory, StatusHistory } from '../../app/models/history.types';
import Stock from '../models/stock.model';
import StockCar from '../models/stockCar.model';
import TeamSetting from '../../app/models/teamSetting.model';
import { default as User } from '../../app/models/user.model';
import historyQueue from '../../app/tasks/history.task';
import inventoryQueue from '../taks/inventory.task';
import logger from '../../services/logger.service';
import { socket } from '../../services/socket.service';
import Form, {KindForm} from "../../form/models/form.model";

import {
  IInventoryVirtualModel,
} from '../models/virtualInventory.model';
import { IUserModel } from '../../app/schemas/user.schema';
import { IUser } from '../../app/interfaces/user.interface';
import Company from '../../app/models/company.model';
import { ContainerStatus } from '../../utils/enums/containerStatus.enum';

class InventoryController {
  constructor() {
    this.index = this.index.bind(this);
    this.test = this.test.bind(this);
    this.stock = this.stock.bind(this);
    this.detail = this.detail.bind(this);
    this.create = this.create.bind(this);
    this.list = this.list.bind(this);
    this.detaill = this.detaill.bind(this);
    this.apiList = this.apiList.bind(this);
    this.apiDetail = this.apiDetail.bind(this);
    this.apiFoundCar = this.apiFoundCar.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
    this.autoRotate = this.autoRotate.bind(this);
    this.resizeImage = this.resizeImage.bind(this);
    this.setLabel = this.setLabel.bind(this);
    this.finishInventory = this.finishInventory.bind(this);
    this.deleteInventory = this.deleteInventory.bind(this);
    this.reportCar = this.reportCar.bind(this);
    this.addComment = this.addComment.bind(this);
    this.downloadFile = this.downloadFile.bind(this);
    this.downloadImages = this.downloadImages.bind(this);
    this.inventoryByCars = this.inventoryByCars.bind(this);
    this.dashboard = this.dashboard.bind(this);
    this.currentStock = this.currentStock.bind(this);
    this.loadStock = this.loadStock.bind(this);
    this.checkExistVenue = this.checkExistVenue.bind(this);
    this.listInventoryCarFiles = this.listInventoryCarFiles.bind(this);
    this.CarStatusList = this.CarStatusList.bind(this);
    this.addStatusEvidence = this.addStatusEvidence.bind(this)
    this.closeInventory = this.closeInventory.bind(this)
    this.closeVirtualInventory = this.closeVirtualInventory.bind(this)
  }

  public async index(req: IRequest, res: Response) {
    try {
      return res.render('app/index', {
        token: await req.user.generateToken()
      });
    } catch (e) {
      console.log(e);
    }
  }

  public test(req: IRequest, res: Response) {
    const { user, body } = req;
    const schema = Joi.object({
      username: Joi.string().alphanum().min(3).max(30).required(),
      password: Joi.string() /*.pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))*/,
      access_token: [Joi.string(), Joi.number()]
    }).xor('password', 'access_token');
    res.json({
      status: 'ok',
      user,
      validate: schema.validate(body)
    });
  }

  public async stock(req: IRequest, res: Response) {
    try {
      res.render('app/index', {
        token: await req.user.generateToken()
      });
    } catch (e) {
      console.log(e);
    }
  }

  public async detail(req: IRequest, res: Response) {
    const team = req.user.team._id;
    const { id } = req.params;
    try {
      const inventory = await InventoryModel.findOne({ _id: id, team });
      if (!inventory) {
        return res.status(404).render('404');
      } else {
        return res.render('app/index', {
          token: await req.user.generateToken()
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      if (e) {
        return res.status(500).send(e);
      }
    }
  }

  public async listInventoryCarFiles(req: IRequest, res: Response) {
    try {
      const { id: inventoryCarId } = req.params;
      const inventoryCar = await InventoryCar.findOne({
        _id: inventoryCarId
      }).populate({ path: 'files' });
      if (!inventoryCar) {
        return res.status(404).json({ message: 'No encontrado' });
      } else {
        return res.json(inventoryCar);
      }
    } catch (e) {
      /* istanbul ignore next */
      return res.status(500).send(e);
    }
  }

  private async checkExistVenue(
    name: string,
    team: any,
    company: any
  ): Promise<IVenueModel> {
    const venueRegExp = new RegExp(`^${name.trim()}$`, 'i');
    let venue: IVenueModel | null = await Venue.findOne({
      team,
      company,
      $or: [
        {
          name: venueRegExp
        },
        {
          name: { $regex: venueRegExp }
        },
        {
          name: name
        }
      ]
    });
    // if you are not in the company, try in the team
    if (!venue) {
      venue = await Venue.findOne({
        team,
        $or: [
          {
            name: venueRegExp
          },
          {
            name: { $regex: venueRegExp }
          },
          {
            name: name
          }
        ]
      });
    }
    // if you are not in the company or in the team, it will be created
    if (!venue) {
      venue = new Venue({
        name: name.trim(),
        team,
        company
      });
      await venue.save();
    }
    return venue;
  }

  public async createContainerInventory(req: IRequest, res: Response) {
    let { name, carsByContainer, manualPhoto, reportPhoto } = req.body;
    carsByContainer = JSON.parse(carsByContainer);
    try {
      const { company, team, venue } = req.user;
      const inventory = new Inventory({
        name,
        company: company._id,
        team: team._id,
        venues: [venue._id],
        createdBy: req.user._id,
        status: ChoicesStatusInventory.pending,
        containerInventory: true,
        settings: {
          photos: {
            manual: parseInt(manualPhoto, 10),
            report: parseInt(reportPhoto, 10)
          }
        }
      });

      const file: any = GeneralUtils.getFileFromRequest(req.files, 'file');
      if (file) {
        file.team = team;
        await inventory.attach('file', file);
      }
      const backup: any = GeneralUtils.getFileFromRequest(req.files, 'backup');
      if (backup) {
        backup.team = team;
        await inventory.attach('backup', backup);
      }

      await inventory.save();
      inventoryQueue.queue.add(
        'createContainerInventory',
        {
          inventoryID: inventory._id,
          userID: req.user._id,
          venueID: venue._id,
          name,
          carsByContainer
        },
        { removeOnComplete: true }
      );

      return res.json({
        message: 'Inventario de contenedores creado satisfactoriamente',
        status: 200
      });

    } catch (e) {
      logger.error(`createContainerInventory: Async Error.`);
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      logger.error(e);
      return res.status(500).json({
        message: e,
        status: 500
      });
    }
  }

  public async create(req: IRequest, res: Response) {
    const { name, manualPhoto, reportPhoto } = req.body;
    let { carsByVenue, notification } = req.body;
    carsByVenue = JSON.parse(carsByVenue);
    notification = notification === 'true';
    try {
      const { company, team } = req.user;

      const venuesIDs: string[] = await Promise.all(
        carsByVenue.map(async (venue: any) => {
          const { name } = venue;
          const currentVenue = await this.checkExistVenue(name, team, company);
          return currentVenue._id.toString();
        })
      );
      const inventory = new Inventory({
        name,
        company: company._id,
        team: team._id,
        venues: venuesIDs,
        createdBy: req.user._id,
        status: ChoicesStatusInventory.pending,
        settings: {
          photos: {
            manual: 3,
            report: 3
          }
        }
      });
      const file: any = GeneralUtils.getFileFromRequest(req.files, 'file');
      if (file) {
        file.team = team;
        await inventory.attach('file', file);
      }
      const backup: any = GeneralUtils.getFileFromRequest(req.files, 'backup');
      if (backup) {
        backup.team = team;
        await inventory.attach('backup', backup);
      }
      await inventory.save();
      inventoryQueue.queue.add(
        'create',
        {
          inventoryID: inventory._id,
          userID: req.user._id,
          name,
          manualPhoto,
          reportPhoto,
          carsByVenue,
          notification
        },
        { removeOnComplete: true }
      );

      //   const inventoryCars: Partial<IInventoryCar>[] = [];
      //   const activityHistories: IActivityHistoryInterface[] = [];
      //   const venuesIDs: string[] = [];

      //   for (const venue of carsByVenue) {
      //     if (venue.name && venue.name.trim().length) {
      //       const venueRegExp = new RegExp(`^${venue.name.trim()}$`, 'i');
      //       let currentVenue: IVenueModel | null = await VenueModel.findOne({
      //         team,
      //         company,
      //         $or: [
      //           {
      //             name: venueRegExp
      //           },
      //           {
      //             name: { $regex: venueRegExp }
      //           },
      //           {
      //             name: venue.name
      //           }
      //         ]
      //       });
      //       // if you are not in the company, try in the team
      //       if (!currentVenue) {
      //         currentVenue = await VenueModel.findOne({
      //           team,
      //           $or: [
      //             {
      //               name: venueRegExp
      //             },
      //             {
      //               name: { $regex: venueRegExp }
      //             },
      //             {
      //               name: venue.name
      //             }
      //           ]
      //         });
      //       }
      //       // if you are not in the company or in the team, it will be created
      //       if (!currentVenue) {
      //         currentVenue = new VenueModel({
      //           name: venue.name.trim(),
      //           team,
      //           company
      //         });
      //         await currentVenue.save();
      //       }
      //       venuesIDs.push(currentVenue._id.toString());

      //       if (venue.cars && venue.cars.length) {
      //         for (const car of venue.cars) {
      //           let currentCar: ICarModel | null = await CarModel.findOne({
      //             team,
      //             vin: car.vin.trim()
      //           });
      //           if (currentCar === null && car.vin && car.vin.trim().length) {
      //             currentCar = new CarModel({
      //               team,
      //               company,
      //               vin: car.vin,
      //               vin2: car.vin.substr(car.vin.length - 6),
      //               color: car.color,
      //               type: car.type,
      //               property: car.property,
      //               denomination: car.denomination,
      //               brand: car.brand,
      //               patent: car.patent,
      //               createdBy: req.user,
      //               status: ChoicesStatusCar.active
      //             });
      //             await currentCar.save();
      //           }
      //           if (currentVenue && currentCar) {
      //             inventoryCars.push({
      //               venue: currentVenue._id,
      //               car: currentCar._id,
      //               comments: [],
      //               images: []
      //             });
      //             activityHistories.push({
      //               team,
      //               company,
      //               user: req.user._id,
      //               type: ChoicesTypeActivity.inventory,
      //               car: {
      //                 _id: currentCar._id,
      //                 vin: currentCar.vin
      //               }
      //             });
      //             inventoryQueue.queue.add(
      //               'updateCar',
      //               {
      //                 title: `updateCar ${car.vin}`,
      //                 currentCar: currentCar._id,
      //                 car
      //               },
      //               { attempts: 3, backoff: 1000 }
      //             );
      //           }
      //         }
      //       }
      //     }
      //   }
      //   const inventory = new InventoryModel({
      //     name,
      //     company,
      //     team,
      //     venues: venuesIDs,
      //     createdBy: req.user._id,
      //     status: ChoicesStatusInventory.inProcess,
      //     settings: {
      //       photos: {
      //         manual: manualPhoto,
      //         report: reportPhoto
      //       }
      //     }
      //   });
      //   const file: any = GeneralUtils.getFileFromRequest(req.files, 'file');
      //   if (file) {
      //     file.team = team;
      //     await inventory.attach('file', file);
      //   }
      //   const backup: any = GeneralUtils.getFileFromRequest(req.files, 'backup');
      //   if (backup) {
      //     backup.team = team;
      //     await inventory.attach('backup', backup);
      //   }

      //   await inventory.save();
      //   inventoryCars.map((i) => {
      //     i.inventory = inventory._id;
      //     return i;
      //   });
      //   activityHistories.map((a) => {
      //     a.inventory = {
      //       _id: inventory._id,
      //       name: inventory.name
      //     };
      //     return a;
      //   });
      //   await ActivityHistory.insertMany(activityHistories);
      //   await InventoryCar.insertMany(inventoryCars);

      //   if (process.env.ENV === 'production' && notification) {
      //     const usersIDs = await UserModel.find(
      //       {
      //         venue: {
      //           $in: venuesIDs
      //         },
      //         team
      //       },
      //       {
      //         _id: true
      //       }
      //     );
      //     PushService.massiveSend(
      //       'Nuevo inventario',
      //       `Se ha iniciado el inventario "${inventory.name}"`,
      //       'Ya puedes empezar a escanear',
      //       usersIDs.map((user) => user._id.toString())
      //     );
      //   }
      //   socket().to(`inventory-list-${team}`).emit('REFRESH', {
      //     update: true
      //   });
      //   socket().to(`stock-${team}`).emit('REFRESH', {
      //     update: true
      //   });
      //   if(process.env.ENV === 'production'){
      //     const currentTeam = await Team.findById(req.user.team._id);
      //     emailQueue.queue.add(
      //       'email',
      //       {
      //         from: '',
      //         title: `Inventory Notification`,
      //         to: `"Soporte"<soporte@osacontrol.com>`,
      //         subject: `${req.user.firstName} ha creado un inventario en ${
      //           currentTeam!.name
      //         }`,
      //         text: `Hola Soporte

      //         Se ha creado un nuevo inventario.

      //         Team: ${team.name}
      //         Usuario: ${req.user.firstName} ${req.user.lastName}
      //         ENV: ${process.env.ENV}

      //         En caso de dudas o consultas puedes contactarte a soporte@osacontrol.com o a nuestro twitter@TaskforceOSA.`,
      //         view: 'alerts/inventoryNotification',
      //         context: {
      //           team: currentTeam,
      //           user: req.user,
      //           env: process.env.ENV
      //         }
      //       },
      //       { attempts: 3, backoff: 1000 }
      //     );
      //   }
      return res.json({
        // _id: inventory._id.toString(),
        message: 'Inventario creado satisfactoriamente',
        status: 200
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`create: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      return res.status(500).json({
        message: e,
        status: 500
      });
    }
  }

  public async list(req: IRequest, res: Response) {
    const team = req.user.team._id;
    const { page, pageSize, containers } = req.query as { page: string; pageSize: string, containers?: string };
    const venuesPermissions = req.user.venuesPermissions();
    // paginate options
    const options: PaginateOptions = {
      select: {
        _id: true
      },
      sort: {
        createdAt: -1
      },
      customLabels: {
        totalDocs: 'total',
        docs: 'docs',
        limit: 'perPage',
        page: 'currentPage',
        nextPage: 'next',
        prevPage: 'prev',
        totalPages: 'pages',
        pagingCounter: 'si'
      },
      allowDiskUse: true,
      lean: true,
      page: parseInt(page ? page : '1', 10),
      limit: parseInt(pageSize ? pageSize : '10', 10)
    };

    let match : any[] = [
      {
        team,
        venues: {
          $in: venuesPermissions
        }
      }
    ]
    if (containers !== undefined) {
      match.push({ containerInventory: parseInt(containers) > 0 });
    }
    try {
      const paginatedInventories = await InventoryModel.paginate(
        {
          $and: match
        },
        options
      );
      const aggregate: PipelineStage[] = [
        {
          $match: {
            _id: {
              $in: paginatedInventories.docs.map((v) => v._id)
            }
          }
        },
        {
          $lookup: {
            from: 'inventorycars',
            localField: '_id',
            foreignField: 'inventory',
            as: 'cars'
          }
        },
        {
          $unwind: {
            path: '$cars',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $match: {
            $or: [
              {
                'cars.venue': {
                  $in: venuesPermissions
                },
                'cars.status': {
                  $in: [
                    ChoicesStatusCarInventory.pending,
                    ChoicesStatusCarInventory.found,
                    ChoicesStatusCarInventory.missing,
                    ChoicesStatusCarInventory.leftover,
                    ChoicesStatusCarInventory.reported
                  ]
                }
              },
              {
                createdBy: req.user._id
              }
            ]
          }
        },
        {
          $group: {
            _id: {
              category: '$_id',
              status: '$status',
              containers: "$containers",
              carStatus: '$cars.status',
              name: '$name',
              file: '$file',
              backup: '$backup',
              createdBy: '$createdBy',
              createdAt: '$createdAt',
              finalizedBy: '$finalizedBy',
              finalizedAt: '$finalizedAt'
            },
            total: {
              $sum: 1
            }
          }
        },
        {
          $group: {
            _id: '$_id.category',
            name: {
              $first: '$_id.name'
            },
            containers: {
              $first: '$_id.containers'
            },
            createdAt: {
              $first: '$_id.createdAt'
            },
            file: {
              $first: '$_id.file'
            },
            backup: {
              $first: '$_id.backup'
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
        },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'createdBy'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'finalizedBy',
            foreignField: '_id',
            as: 'finalizedBy'
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            results: 1,
            file: 1,
            backup: 1,
            containers: 1,
            'createdBy.firstName': 1,
            'createdBy.lastName': 1,
            'finalizedBy.firstName': 1,
            'finalizedBy.lastName': 1,
            status: 1,
            createdAt: 1,
            finalizedAt: 1
          }
        },
        {
          $sort: {
            createdAt: -1
          }
        }
      ];

      if (
        options.page &&
        paginatedInventories?.pages &&
        (paginatedInventories?.pages as number) < options.page
      ) {
        return res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 200
        });
      } else {
        logger.info(
          `InventoryController.apiList email: ${
            req.user.email
          }, query: ${JSON.stringify(req.query)}`
        );
        logger.debug(
          `InventoryController.apiList email: ${
            req.user.email
          }, aggregate: ${JSON.stringify(aggregate)}`
        );
        logger.debug(
          `InventoryController.apiList email: ${
            req.user.email
          }, options: ${JSON.stringify(options)}`
        );
        const response: any[] = [];
        const [inventories, teamSettings] = await Promise.all([
          InventoryModel.aggregate(aggregate),
          TeamSetting.findOne({ team })
        ]);
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
            file: req.user.hasPermission('viewFilesInventory')
              ? inventory.file
              : null,
            backup: req.user.hasPermission('viewFilesInventory')
              ? inventory.backup
              : null,
            createdBy: inventory.createdBy.length
              ? {
                  fullName: `${inventory.createdBy[0].firstName} ${inventory.createdBy[0].lastName}`
                }
              : {},
            finalizedBy: inventory.finalizedBy.length
              ? {
                  fullName: `${inventory.finalizedBy[0].firstName} ${inventory.finalizedBy[0].lastName}`
                }
              : {},
            containers: inventory.containers,
            results: inventory.results.reduce(
              (acc: any, cur: any) => {
                acc[cur.status] = cur.total;
                return acc;
              },
              {
                ...defaultResults
              }
            ),
            status: inventory.status,
            createdAt: inventory.createdAt,
            finalizedAt: inventory.finalizedAt ? inventory.finalizedAt : null
          });
        }
        return res.json({
          inventories: response,
          inventorySettings: teamSettings!.inventory,
          count: paginatedInventories.total,
          pages: paginatedInventories.pages,
          hasPrevious: paginatedInventories.hasPrevious,
          hasNextPage: paginatedInventories.hasNextPage,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`list: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      return res.status(500).json({
        message: e,
        status: 500
      });
    }
  }

  public async apiDetail(req: IRequest, res: Response) {
    const team = req.user.team._id;
    const { id } = req.params;
    const { virtual } = req.query as { virtual?: string };
    logger.info(`apiDetail Inventory`);
    logger.info(
      `{user: {_id: ${req.user._id}, email: ${req.user.email}, inventory: ${id}}`
    );
    try {
      const updatedUser = await User.findById(req.user._id, { venue: true });
      if (!updatedUser) {
        res.status(404).json({
          message: 'No se ha encontrado el inventario solicitado.',
          status: 404
        });
      } else {
        // const venuesPermissions = req.user.venuesPermissions();
        let inventoryMatch: any = {
          venues: updatedUser.venue,
          status: {
            $in: [ChoicesStatusInventory.inProcess]
          },
          team
        }
        let inventoryCarsMatch: any = {
          status: {
            $in: [
              ChoicesStatusCarInventory.pending,
              ChoicesStatusCarInventory.found,
              ChoicesStatusCarInventory.reported,
            ]
          }
        }
        if (virtual === '1') {
          logger.info(`apiDetail Inventory: Virtual Inventory`);
          inventoryMatch["virtualInventories"] = new mongoose.Types.ObjectId(id)
          inventoryCarsMatch["virtualInventory"] = new mongoose.Types.ObjectId(id)
        } else {
          inventoryMatch["_id"] = new mongoose.Types.ObjectId(id)
        }

        const inventory = await (Inventory as any)
          .findOne(inventoryMatch)
          .populate([
            {
              path: 'cars',
              match: inventoryCarsMatch,
              populate: [
                {
                  path: 'car',
                  select: [
                    'vin',
                    'vin2',
                    'color',
                    'denomination',
                    'brand',
                    'patent',
                    'isContainer',
                  ]
                },
                {
                  path: 'venue',
                  select: ['name']
                }
              ]
            }
          ])
          .lean();
        if (inventory) {
          res.status(200).json({
            data: {
              cars: inventory.cars.map((car: IInventoryCar) => {
                return {
                  ...car.car,
                  _id: (car as any)._id,
                  car_id: car.car._id,
                  venue: car.venue,
                  status: car.status,
                  container: car.container,
                  containerFound: car.containerFound,
                  extra: car.extra,
                  evidenceStatus: car.evidenceStatus,
                  containerStatus: car.containerStatus,
                  inventoryRef: car.inventory
                };
              }),
              reasons: []
            },
            status: 200
          });
        } else {
          logger.error(
            `apiDetail: No se ha encontrado el inventario solicitado.`
          );
          logger.error(
            `{user: {_id: ${req.user._id}, email: ${req.user.email}}`
          );
          res.status(404).json({
            message: 'No se ha encontrado el inventario solicitado.',
            status: 404
          });
        }
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`apiDetail: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      res.status(500).json(e);
    }
  }

  public async downloadFile(url: string, dest: string): Promise<number> {
    return new Promise(async (resolve, reject) => {
      try {
        // generate directory name from dest var
        const directories: string[] = dest.split('/');
        directories.pop();

        // validate that the directory exist and create recursive if it does not exist
        const directoyName = directories.join('/');
        if (!fs.existsSync(directoyName)) {
          fs.mkdirSync(directoyName, { recursive: true });
        }
        const file = fs.createWriteStream(dest);
        // download file
        https.get(url, (response) => {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(
              response.headers['content-length']
                ? parseInt(response.headers['content-length'], 10)
                : 0
            );
          });
        });
      } catch (e) {
        // Validate that the file exists and delete it if it exists.
        if (fs.existsSync(dest)) {
          fs.unlink(dest, (err) => {
            if (err) {
              reject(err);
            }
          });
        } else {
          console.log(url);
          reject(e);
        }
      }
    });
  }

  public async uploadFile(req: IRequest, res: Response) {
    const { id } = req.params;
    const { company, venue, team } = req.user;
    const { inventoryCardId } = req.body;
    const file: any = GeneralUtils.getFileFromRequest(req.files, 'file');
    if (file) {
      try {
        logger.info(
          `InventoryController.uploadFile email: ${
            req.user.email
          } inventory: ${id} file: ${JSON.stringify(file)}`
        );
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
        file.headers = {
          'Content-Type': file.mimetype
        };
        file.team = team._id;
        file.venue = venue._id;
        file.inventory = id;
        inventoryFile.inventory = id;
        inventoryFile.user = req.user._id;
        inventoryFile.company = company._id;
        // fix exif
        if (new RegExp('\\bimage\\b').test(file.mimetype)) {
          await this.autoRotate(file.path);
        }
        await inventoryFile.attach('file', file);
        if (new RegExp('\\bimage\\b').test(file.mimetype)) {
          await this.resizeImage(file.path);
          await inventoryFile.attach('thumbnail', file);
        }
        await inventoryFile.save();
        if (inventoryCardId) {
          const inventoryCar = await InventoryCar.findById(inventoryCardId);
          if (inventoryCar) {
            await InventoryCar.updateOne(
              {
                _id: inventoryCar._id,
                inventory: inventoryCar.inventory
              },
              {
                $push: { files: inventoryFile._id }
              },
              {
                upsert: true
              }
            );
            socket()
              .to(`inventory-detail-${inventoryCar.inventory}`)
              .emit('REFRESH', {
                update: true,
                venue: inventoryCar.venue
              });
          }
          console.log('**************', inventoryCardId);
        }
        return res.status(201).json({
          data: {
            _id: inventoryFile._id,
            file: inventoryFile.file
          },
          status: 201
        });
      } catch (e) {
        /* istanbul ignore next */
        logger.error(`uploadFile: Async Error.`);
        /* istanbul ignore next */
        logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
        /* istanbul ignore next */
        logger.error(e);
        /* istanbul ignore next */
        return res.status(400).json(e);
      }
    } else {
      logger.error(`uploadFile: La imagen es obligatoria.`);
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      return res.status(400).json({
        message: 'La imagen es obligatoria.',
        status: 400
      });
    }
  }

  public async removeInventoryCarFile(
    req: IRequest,
    res: Response
  ): Promise<any> {
    try {
      const { id } = req.params;
      const inventoryFile = await InventoryFile.findOneAndRemove({ _id: id });
      if (inventoryFile) {
        socket()
          .to(`inventory-detail-${inventoryFile.inventory}`)
          .emit('REFRESH', {
            update: true,
            venue: req.user.venue._id
          });
      }
      res.json({});
    } catch (e) {
      logger.error(`removeInventoryCarFile: La imagen es obligatoria.`);
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      res.status(400).json({
        message: 'La imagen es obligatoria.',
        status: 400
      });
    }
  }

  private async closeVirtualInventory(virtualInventory: IInventoryVirtualModel) {
    const virtualInventoryCars = await InventoryCar.find({
      virtualInventory: virtualInventory._id,
      $or: [
        {status: ChoicesStatusCarInventory.pending, container: {$exists: true}},
        {containerStatus: {$ne: ChoicesStatusContainer.empty}, container: {$exists: false}}
      ]
    });
    logger.info(`apiFoundCar: virtualInventoryCars: ${virtualInventoryCars.length}`);
    if (virtualInventoryCars.length === 0) {
      virtualInventory.status = ChoicesStatusInventory.finalized;
      await virtualInventory.save();
    }
  }

  private async closeInventory(inventory: IInventoryModel, user: IUserModel | IUser) {
    const inventoryCars = await InventoryCar.find({
      inventory: inventory._id,
      $or: [
        {status: ChoicesStatusCarInventory.pending, container: {$exists: true}},
        {containerStatus: {$ne: ChoicesStatusContainer.empty}, container: {$exists: false}}
      ]
    });
    if (inventoryCars.length === 0) {
      inventory.status = ChoicesStatusInventory.finalized;
      inventory.finalizedAt = new Date();
      inventory.finalizedBy = user._id;
      await inventory.save();
    }
  }

  public async apiFoundCar(req: IRequest, res: Response): Promise<any> {
    const { team } = req.user;
    const { id } = req.params;
    const { vin, images, containerFound } = req.body;
    logger.info(`apiFoundCar`);
    logger.info(
      `{user: {_id: ${req.user._id}, email: ${
        req.user.email
      }, body: ${JSON.stringify(req.body)}}`
    );
    try {

      const updatedUser = await User.findById(req.user._id).populate([{
          path: 'venue',
          select: ['name']
      }]);

      if (!updatedUser) {
        return res.status(404).json({
          message: 'No se ha encontrado el inventario solicitado.',
          status: 404
        });
      }

      const teamSettings = await TeamSetting.findOne({ team });

      const venueId = updatedUser.venue._id;

      const inventory = await InventoryModel.findOne({
        _id: id,
        team,
        status: ChoicesStatusInventory.inProcess
      });

      if (inventory) {

        let carFilter = req.user.company.handler ?
          { vin, $or: [{company: req.user.company._id }, {companyHandler: req.user.company._id }] } :
          { vin, team };

        const car = await Car.findOne(carFilter);

        if (car) {

          const inventoriedCar = await InventoryCar.findOne({
            inventory: id,
            car: car._id,
            status: {
              $in: [
                ChoicesStatusCarInventory.found,
                ChoicesStatusCarInventory.leftover
              ]
            }
          });
          if (inventoriedCar) {
            logger.error(`apiFoundCar: Este vehículo ya ha sido inventariado`);
            logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
            return res.status(200).json({
              message: 'Este vehículo ya ha sido inventariado',
              status: 200
            });
          } else {
            let inventoryCar = await InventoryCar.findOne({
              inventory: id,
              car: car._id
            });
            // if car in inventory
            if (inventoryCar) {
              inventoryCar.venueFound = venueId;
              if (containerFound){
                let inventoryContainer = await InventoryCar.findOne({
                  _id: new mongoose.Types.ObjectId(containerFound),
                  inventory: id
                });
                if (inventoryContainer) {
                  inventoryCar.containerFound = inventoryContainer._id;
                  inventoryContainer.containerStatus = ContainerStatus.CHECK;
                  inventoryContainer = await inventoryContainer.save();
                }
              }

              if (
                teamSettings!.inventory.leftoverDifferentVenue &&
                inventoryCar.venue.toString() !== venueId.toString()
              ) {
                inventoryCar.status = ChoicesStatusCarInventory.leftover;
                socket()
                  .to(`inventory-detail-${inventory._id}`)
                  .emit('REFRESH', {
                    title: 'Vehículo encontrado',
                    text: `${req.user.firstName} ${req.user.lastName} encontró ${car.brand} (${car.denomination}) en ${updatedUser.venue.name}.`,
                    status: ChoicesStatusCarInventory.leftover,
                    venue: venueId,
                    update: true
                  });
              } else {
                inventoryCar.status = ChoicesStatusCarInventory.found;
                socket()
                  .to(`inventory-detail-${inventory._id}`)
                  .emit('REFRESH', {
                    title: 'Vehículo encontrado',
                    text: `${req.user.firstName} ${req.user.lastName} encontró ${car.brand} (${car.denomination}) en ${updatedUser.venue.name}.`,
                    status: ChoicesStatusCarInventory.found,
                    venue: venueId,
                    update: true
                  });
              }
              if (car.isContainer){
                inventoryCar.evidenceStatus = [
                  {status: ChoicesStatusContainer.open, images, date: new Date()},
                ]
                inventoryCar.containerStatus = ChoicesStatusContainer.open;
              }

              inventoryCar.images = images
                ? images.map(
                    (image: string) => new mongoose.Types.ObjectId(image)
                  )
                : [];

              inventoryCar.inventoriedBy = req.user._id;
              inventoryCar = await inventoryCar.save();
              inventoryCar = await inventoryCar.populate([
                {path: 'car'},
                {path: 'venue'},
                {path: 'venueFound'},
                {path: 'evidenceStatus'},
                {path: 'evidenceStatus.images'},
                {path: 'images'}
              ]);
              socket().to(`inventory-list-${team._id}`).emit('REFRESH', {
                update: true
              });

              // Check if the inventory is inventoryContainer and if there's any inventoryCar pending to be found
              if (inventory.containerInventory) {
                await this.closeInventory(inventory, req.user);

                if (inventoryCar.virtualInventory) {
                  const virtualInventory = await InventoryModel.findOne({
                    _id: inventoryCar.virtualInventory
                  });
                  if (virtualInventory) {
                    await this.closeVirtualInventory(virtualInventory)
                    logger.info(`apiFoundCar: virtualInventory: ${virtualInventory}`);
                  }
                }
              }

              await this.sendUpdateNotification("VEHICLE_FOUND", venueId, team._id, inventoryCar, ChoicesStatusCarInventory.found, req, updatedUser);
              return res.status(200).json({
                vin: car.vin,
                status: 200
              });
            } else {
              logger.error(
                `apiFoundCar: Este vehículo no se encuentra en el inventario.`
              );
              logger.error(
                `{user: {_id: ${req.user._id}, email: ${req.user.email}}`
              );
              return res.status(400).json({
                message: 'Este vehículo no se encuentra en el inventario.',
                status: 400
              });
            }
          }
        } else {
          // if car no exist
          logger.error(
            `apiFoundCar: Este vehículo no se encuentra en el inventario.`
          );
          logger.error(
            `{user: {_id: ${req.user._id}, email: ${req.user.email}}`
          );
          return res.status(400).json({
            message: 'Este vehículo no se encuentra en el inventario.',
            status: 400
          });
        }
      } else {
        // if inventory no exist
        logger.error(
          `apiFoundCar: Este inventario no existe o ya no se encuentra activo.`
        );
        logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
        return res.status(404).json({
          message: 'Este inventario no existe o ya no se encuentra activo.',
          status: 404
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`apiFoundCar: Async Error.`);
      /* istanbul ignore next */
      logger.error(
        `{user: {_id: ${req.user._id}, email: ${req.user.email}, error: ${e}}`
      );
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      return res.status(400).json({
        message: e,
        status: 400
      });
    }
  }

  /*private async addCarToHistory(inventoryCar: IInventoryCar, inventory:IInventory, status: StatusHistory) {

    const {car} = inventoryCar;
    logger.info(`inventory.addCarToHistory ${ JSON.stringify(car)}`);

    await History.updateMany(
      {
        car: car,
        team: car.team,
        company: car.company
      },
      { $set: { current: false } }
    );

    const history = await new History({
      status: status,
      module: ModuleHistory.inventory,
      car: car,
      team: car.team,
      company: car.company,
      handlerCompany: car.handlerCompany,
      venue: inventoryCar.venue,
      inventoryCar: inventoryCar,
      inventory: inventory,
      createdBy: car.createdBy,
      executedAt: car.createdAt,
      current: true
    }).save();

    await Car.updateOne(  // es necesario actualizar el car con el id del history?
      {_id: car},
      {$set: {event: history._id}}
    );

  }*/

  private async sendUpdateNotification(notificationType: MessageType, venueId: string, teamId: string, inventory: any, status: string, req: IRequest, updatedUser:any): Promise<void> {

    const statusMap: Record<string, string> = {
      found: 'Encontrado',
      pending: 'Pendiente',
      open: 'Abierto',
      check: 'En descarga',
      empty: 'Vacío',
      missing: 'Faltante'
    };

    const messageStatus = statusMap[`${status}`];

    let title = `${req.user.firstName} ${req.user.lastName} agregó evidencia al contenedor ${inventory.car.vin} en ${updatedUser.venue.name}.`;
    let message = `Ahora el contenedor está ${ messageStatus }.`;

    if(notificationType === "VEHICLE_FOUND" || notificationType === "CONTAINER_FOUND"){

      title = `Vehículo encontrado`;
      message = `${req.user.firstName} ${req.user.lastName} encontró ${inventory.car.brand} (${inventory.car.denomination}) en ${updatedUser.venue.name}.`;

      if (inventory.car.isContainer) {
        title = `Contenedor encontrado`;
        message = `${req.user.firstName} ${req.user.lastName} encontró ${inventory.car.vin} en ${updatedUser.venue.name}.`;
      }
    }

    socket()
      .to(`dashboard-container-vin-view-${teamId}`)
      .emit('REFRESH', {
        title: title,
        text: message,
        status: status,
        venue: venueId,
        update: true,
        metadata: {
          inventory: inventory
        }
      } );
  }


  public async finishInventory(req: IRequest, res: Response): Promise<any> {
    const team = req.user.team._id;
    const { id } = req.params;
    if (!req.user.hasPermission('finishInventory')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    try {
      const inventory = await InventoryModel.findOne({ _id: id, team });
      if (inventory) {
        inventory.status = ChoicesStatusInventory.finalized;
        inventory.finalizedAt = new Date();
        inventory.finalizedBy = req.user._id;
        await inventory.save();

        historyQueue.queue.add(
          'finishInventory',
          {
            inventory: inventory._id
          },
          { attempts: 3, backoff: 1000, removeOnComplete: true }
        );
        socket().to(`inventory-list-${team}`).emit('REFRESH', {
          update: true
        });
        socket().to(`stock-${team}`).emit('REFRESH', {
          update: true
        });
        return res.json({
          message: 'Se ha finalizado correctamente el inventario.',
          status: 200
        });
      } else {
        logger.error(`finishInventory: No se ha encontrado el inventario`);
        logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
        return res.status(400).json({
          message: 'No se ha encontrado el inventario',
          status: 400
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`finishInventory: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      return res.status(400).json({
        message: 'Ha ocurrido un error',
        status: 400
      });
    }
  }

  public async deleteInventory(req: IRequest, res: Response): Promise<any> {
    const team = req.user.team._id;
    const { id } = req.params;
    if (!req.user.hasPermission('deleteInventory')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    try {
      const inventory = await InventoryModel.findOne({
        _id: id,
        team
      });
      if (inventory) {
        await InventoryCar.deleteMany({ inventory });
        await inventory.deleteOne({
          _id: id,
          team
        });
        socket().to(`inventory-list-${team}`).emit('REFRESH', {
          update: true
        });
        socket().to(`stock-${team}`).emit('REFRESH', {
          update: true
        });
        return res.json({
          message: 'Se ha eliminado correctamente el inventario.',
          status: 200
        });
      } else {
        logger.error(`deleteInventory: No se ha encontrado el inventario`);
        logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
        return res.status(400).json({
          message: 'No se ha encontrado el inventario',
          status: 400
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`deleteInventory: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      res.status(400).json({
        message: 'Ha ocurrido un error',
        status: 400
      });
    }
  }

  public async addComment(req: IRequest, res: Response) {
    const { inventory } = req.params;
    const { _id, comment } = req.body;
    try {
      await InventoryCar.updateOne(
        {
          inventory,
          _id
        },
        {
          $push: {
            comments: {
              user: req.user._id,
              comment,
              createdAt: new Date()
            }
          }
        },
        {
          upsert: true
        }
      );
      socket().to(`inventory-detail-${inventory}`).emit('REFRESH', {
        update: true
      });
      socket()
        .to(`inventory-comment-${_id}`)
        .emit('NEW_COMMENT', {
          _id: new mongoose.Types.ObjectId(),
          user: {
            _id: req.user._id,
            firstName: req.user.firstName,
            lastName: req.user.lastName
          },
          comment
        });
      return res.status(200).json({
        message: 'Comentario agregado satisfactoriamente.',
        status: 200
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`addComment: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      return res.status(400).json({
        message: 'Ha ocurrido un error',
        status: 400
      });
    }
  }

  public async downloadImages(req: IRequest, res: Response) {
    const { id } = req.params;
    const { cars } = req.body;
    const team = req.user.team._id;
    try {
      const inventory = await InventoryModel.findOne(
        {
          _id: id,
          team
        },
        {
          name: true
        }
      );
      if (inventory) {
        const inventoriesCars = await InventoryCar.aggregate([
          {
            $match: {
              inventory: new mongoose.Types.ObjectId(id),
              _id: {
                $in: cars.map((car: string) => new mongoose.Types.ObjectId(car))
              }
            }
          },
          {
            $lookup: {
              from: 'inventoryfiles',
              localField: 'images',
              foreignField: '_id',
              as: 'images'
            }
          },
          {
            $project: {
              images: 1,
              venue: 1,
              car: 1
            }
          }
        ]);
        const archive = archiver('zip', {
          zlib: {
            level: 0
          }
        });

        archive.on('error', (err) => {
          res.status(500).send({
            error: err.message
          });
        });

        const filename = `${inventory.name}.zip`;

        archive.on('end', () => {
          console.log(
            `${filename}: Archive wrote ${(
              archive.pointer() /
              (1024 * 1024)
            ).toFixed(2)}MB`
          );
        });

        res.attachment(filename);
        const imagesToDownload: any = [];
        const imagesToCompress: any = [];
        for (const car of inventoriesCars) {
          for (const image of car.images) {
            const destDirectory = `/tmp/${car._id}${image._id}.${
              image.file.name.split('.')[image.file.name.split('.').length - 1]
            }`;
            imagesToDownload.push(() =>
              this.downloadFile(image.file.url, destDirectory)
            );
            imagesToCompress.push({
              destDirectory,
              name: `${car.car.vin}/IMAGE${image._id
                .toString()
                .substr(image._id.length - 10, 10)
                .toUpperCase()}.${
                image.file.name.split('.')[
                  image.file.name.split('.').length - 1
                ]
              }`
            });
          }
        }
        // download images
        console.log('EXECUTE PROMISES');
        let results: any[] = [];
        let numb = 1;
        while (imagesToDownload.length) {
          console.log('promise', numb);
          results = [
            ...results,
            ...(await bluebird.all(
              imagesToDownload.splice(0, 20).map((promise: any) => promise())
            ))
          ];
          numb++;
        }
        // compress images
        console.log('EXECUTE COMPRESS');
        imagesToCompress.map((image: any) => {
          archive.file(image.destDirectory, {
            name: image.name
          });
          setTimeout(() => {
            if (fs.existsSync(image.destDirectory)) {
              console.log(`clear ${image.destDirectory}`);
              fs.unlink(image.destDirectory, (err) => {
                if (err) {
                  console.log(err);
                }
              });
            }
          }, 7200000);
        });
        res.setHeader(
          'size',
          results.reduce((a: number, b: number) => a + b, 0)
        );
        archive.pipe(res);
        archive.finalize();
      } else {
        logger.error(`downloadImages: 'No se ha encontrado el inventario.`);
        logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
        res.status(404).json({
          message: 'No se ha encontrado el inventario.',
          status: 404
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`downloadImages: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      res.status(400).json({
        message: e,
        status: 400
      });
    }
  }

  public async reportCar(req: IRequest, res: Response): Promise<any> {
    const { company, team } = req.user;
    const { id } = req.params;
    const { vin, patent, denomination, brand, color, images, containerFound } = req.body;
    logger.info(`reportCar`);
    logger.info(
      `{user: {_id: ${req.user._id}, email: ${
        req.user.email
      }, body: ${JSON.stringify(req.body)}}`
    );
    try {
      const updatedUser = await User.findById(req.user._id).populate([
        {
          path: 'venue',
          select: ['name']
        }
      ]);
      if (!updatedUser) {
        return res.status(404).json({
          message: 'No se ha encontrado el inventario solicitado.',
          status: 404
        });
      }
      const venueId = updatedUser.venue._id;
      const inventory = await InventoryModel.findOne({
        _id: id,
        status: ChoicesStatusInventory.inProcess,
        team
      });

      let findCOnditions: any = {};
      let isVinAvailable = vin && vin.length > 0;
      if (vin) findCOnditions = { vin, team };
      if (!isVinAvailable && patent && patent.length > 0)
        findCOnditions = { patent, team };

      if (inventory) {
        const car = await CarModel.findOneOrCreate(findCOnditions, {
          vin,
          vin2: vin.substr(vin.length - 6),
          isContainer: false,
          patent,
          brand,
          denomination,
          color,
          team,
          company,
          createdBy: req.user,
          status: ChoicesStatusCar.inventory
        });
        const inventoryCar = new InventoryCar({
          car,
          inventory,
          venue: venueId,
          venueFound: venueId,
          comments: [],
          inventoriedBy: req.user._id,
          images: images
            ? images.map((image: string) => new mongoose.Types.ObjectId(image))
            : [],
          status: ChoicesStatusCarInventory.reported
        });
        if (containerFound){
          let inventoryContainer = await InventoryCar.findOne({
            _id: new mongoose.Types.ObjectId(containerFound),
            inventory
          });
          if (inventoryContainer) {
            inventoryCar.container = inventoryContainer._id;
            inventoryCar.containerFound = inventoryContainer._id;
          }
        }
        await inventoryCar.save();
        const textNotification = `${req.user.firstName} ${req.user.lastName} encontró ${car.brand} (${car.denomination}) en ${updatedUser.venue.name}.`;
        socket().to(`inventory-detail-${inventory._id}`).emit('REFRESH', {
          title: 'Vehículo reportado',
          text: textNotification,
          status: ChoicesStatusCarInventory.reported,
          venue: venueId,
          update: true
        });
        socket().to(`inventory-list-${team._id}`).emit('REFRESH', {
          update: true
        });
        return res.json({
          message: 'Se ha generado el reporte correctamente.',
          vin,
          status: 200
        });
      } else {
        logger.error(
          `reportCar: Este inventario ya no se encuentra disponible.`
        );
        logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
        return res.status(404).json({
          message: 'Este inventario ya no se encuentra disponible.',
          status: 404
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`reportCar: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      res.status(400).json({
        message: e,
        status: 400
      });
    }
  }

  public async setLabel(req: IRequest, res: Response) {
    const team = req.user.team._id;
    const { id } = req.params;
    const { car, label, custom, carID } = req.body;
    logger.info(`setLabel`);
    logger.info(
      `{user: {_id: ${req.user._id}, email: ${
        req.user.email
      }, body: ${JSON.stringify(req.body)}, params: ${JSON.stringify(
        req.params
      )}}`
    );
    try {
      if (label === 'deleted') {
        const inventoryCar = await InventoryCar.findById(car, { venue: true });
        if (inventoryCar) {
          await InventoryCar.updateOne(
            {
              _id: car,
              inventory: id
            },
            {
              status: ChoicesStatusCarInventory.deleted,
              deletedBy: req.user._id
            },
            {
              upsert: true
            }
          );
          socket().to(`inventory-detail-${id}`).emit('REFRESH', {
            update: true,
            venue: inventoryCar.venue
          });
          socket().to(`inventory-list-${team}`).emit('REFRESH', {
            update: true
          });
        }
        return res.json({
          message: 'Opción procesada correctamente.',
          status: 200
        });
      } else {
        const newLabel = await InventoryLabel.findOne({
          _id: label,
          team
        });
        if (newLabel) {
          const inventoryCar = await InventoryCar.findById(car, {
            venue: true
          });
          if (inventoryCar) {
            await InventoryCar.updateOne(
              {
                _id: car,
                inventory: id
              },
              {
                status: newLabel.sendTo,
                label: newLabel._id,
                labelBy: req.user._id,
                labelText: custom
              },
              {
                upsert: true
              }
            );
            if (newLabel.isExhibition) {
              await CarModel.findOneAndUpdate(
                {
                  _id: carID,
                  team
                },
                {
                  isExhibition: true
                }
              );
            }
            socket().to(`inventory-detail-${id}`).emit('REFRESH', {
              update: true,
              venue: inventoryCar.venue
            });
            socket().to(`inventory-list-${team}`).emit('REFRESH', {
              update: true
            });
          }
        }
        return res.json({
          message: 'Opción procesada correctamente.',
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`setLabel: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      return res.status(500).json({
        message: e,
        status: 500
      });
    }
  }

  public async apiList(req: IRequest, res: Response) {
    try {
      const team = req.user.team._id;
      logger.info(`InventoryController.apiList {email: ${req.user.email} }`);
      const updatedUser = await User.findById(req.user._id);
      if (updatedUser) {
        const inventories: IInventory[] = await InventoryModel.find(
          {
            team,
            venues: updatedUser.venue,
            status: {
              $in: [ChoicesStatusInventory.inProcess]
            }
          },
          {
            _id: true,
            name: true,
            settings: true,
            containerInventory: true,
            virtual: true,
            virtualInventories: true,
          }
        ).populate({path: "virtualInventories", match: { status: ChoicesStatusInventory.inProcess }}).lean();

        let dataInventories: any = {};

        inventories.map((inventory:  HydratedDocument<IInventory>)  => {
          if (inventory.virtual) {
            inventory.virtualInventories = inventory.virtualInventories.map((virtualInventory: any ) => {
              if (!Object.hasOwn(dataInventories, virtualInventory._id.toString())) {
                dataInventories[virtualInventory._id.toString()] = {
                  ...inventory,
                  ...virtualInventory
                }
              }
              return virtualInventory
            })
          } else {
            dataInventories[inventory._id.toString()] = inventory
          }
        })

        return res.json({
          data: Object.values(dataInventories),
          status: 200
        });
      } else {
        logger.error(`apiList: Usuario no encontrado`);
        logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
        /* istanbul ignore next */
        return res.status(400).json({
          message: 'Usuario no encontrado',
          status: 400
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`apiList: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      return res.status(400).json({
        message: e,
        status: 400
      });
    }
  }

  public async detaill(req: IRequest, res: Response) {
    try {
      const { id } = req.params;
      logger.info(
        `InventoryController.detail {email: ${req.user.email}, inventory: ${id} }`
      );
      const team = req.user.team._id;
      const venuesPermissions = req.user.venuesPermissions();

      let carFilter = {
          $or: [
            {
              'cars.venue': {
                $in: venuesPermissions
              }
            },
            {
              'cars.venueFound': {
                $in: venuesPermissions
              }
            }
          ],
          'cars.status': {
            $in: [
              ChoicesStatusCarInventory.pending,
              ChoicesStatusCarInventory.found,
              ChoicesStatusCarInventory.missing,
              ChoicesStatusCarInventory.leftover,
              ChoicesStatusCarInventory.reported
            ]
          }
        }

      const [
        inventory,
        detailByVenues,
        detailByBrands,
        teamSettings,
        labels,
        detailInventory
      ] = await Promise.all([
        InventoryModel.aggregate(
          [
            {
              $match: {
                $and: [
                  {
                    team: new mongoose.Types.ObjectId(team),
                    _id: new mongoose.Types.ObjectId(id)
                  }
                ]
              }
            },
            {
              $lookup: {
                from: 'inventorycars',
                localField: '_id',
                foreignField: 'inventory',
                as: 'cars'
              }
            },
            {
              $unwind: { path: '$cars', preserveNullAndEmptyArrays: true }
            },
            {
              $match: carFilter
            },
            {
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
            },
            {
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
            },
            {
              $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userInfo'
              }
            },
            {
              $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true }
            },
            {
              $project: {
                _id: 1,
                name: 1,
                results: 1,
                'userInfo.firstName': 1,
                'userInfo.lastName': 1,
                status: 1,
                createdAt: 1,
                finalizedAt: 1
              }
            },
            {
              $sort: {
                createdAt: -1
              }
            }
          ],
          {
            allowDiskUse: true
          }
        ),
        InventoryModel.aggregate(
          [
            {
              $match: {
                $and: [
                  {
                    team: new mongoose.Types.ObjectId(team),
                    _id: new mongoose.Types.ObjectId(id)
                  }
                ]
              }
            },
            {
              $lookup: {
                from: 'inventorycars',
                localField: '_id',
                foreignField: 'inventory',
                as: 'cars'
              }
            },
            {
              $unwind: '$cars'
            },
            {
              $match: carFilter
            },
            {
              $group: {
                _id: {
                  category: {
                    $cond: {
                      if: {
                        $gt: ['$cars.venueFound', null]
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
            },
            {
              $group: {
                _id: '$_id.category',
                status: {
                  $push: {
                    name: '$_id.status',
                    total: '$total'
                  }
                }
              }
            },
            {
              $lookup: {
                from: 'venues',
                localField: '_id',
                foreignField: '_id',
                as: 'info'
              }
            },
            {
              $unwind: '$info'
            }
          ],
          {
            allowDiskUse: true
          }
        ),
        InventoryModel.aggregate(
          [
            {
              $match: {
                $and: [
                  {
                    team: new mongoose.Types.ObjectId(team),
                    _id: new mongoose.Types.ObjectId(id)
                  }
                ]
              }
            },
            {
              $lookup: {
                from: 'inventorycars',
                localField: '_id',
                foreignField: 'inventory',
                as: 'cars'
              }
            },
            {
              $unwind: '$cars'
            },
            {
              $match: carFilter
            },
            {
              $lookup: {
                from: 'cars',
                localField: 'cars.car',
                foreignField: '_id',
                as: 'car'
              }
            },
            {
              $unwind: '$car'
            },
            {
              $group: {
                _id: {
                  car: '$car.brand',
                  status: '$cars.status'
                },
                total: {
                  $sum: 1
                }
              }
            },
            {
              $group: {
                _id: '$_id.car',
                status: {
                  $push: {
                    name: '$_id.status',
                    total: '$total'
                  }
                }
              }
            },
            {
              $lookup: {
                from: 'venues',
                localField: '_id',
                foreignField: '_id',
                as: 'info'
              }
            }
          ],
          {
            allowDiskUse: true
          }
        ),
        TeamSetting.findOne({ team }).lean(true),
        InventoryLabel.find(
          {
            team,
            active: true
          },
          {
            name: true,
            color: true,
            affected: true,
            sendTo: true,
            isExhibition: true,
            requireCustomText: true,
            isForContainer: true,
          }
        ),
        InventoryModel.findById(id, {
          name: true,
          status: true,
          cars: true,
          venues: true,
          company: true,
          team: true
        })
          .populate([
            {
              path: 'cars',
              match: carFilter,
              populate: [
                {
                  path: 'car',
                  select: [
                    'vin',
                    'vin2',
                    'internalNumber',
                    'color',
                    'denomination',
                    'brand',
                    'venue',
                    'patent',
                    'internalNumber',
                    'property',
                    'type',
                    'isContainer',
                    'company'
                  ],
                  populate: [
                    {
                      path: 'company'
                    }
                    ]
                },
                {
                  path: 'label'
                },
                {
                  path: 'venue',
                  select: ['name']
                },
                {
                  path: 'images'
                },
                {
                  path: "evidenceStatus.images",
                },
                {
                  path: 'files'
                },
                {
                  path: 'venueFound',
                  select: ['name']
                },
                {
                  path: 'inventoriedBy',
                  select: ['firstName', 'lastName']
                },
                {
                  path: 'comments.user',
                  select: ['_id', 'firstName', 'lastName']
                },
              ],
              select: { meta: false }
            },
            {
              path: 'venues',
              select: ['_id', 'name'],
              match: {
                _id: {
                  $in: venuesPermissions
                }
              },
              options: {
                sort: {
                  name: 1
                }
              }
            }
          ])
          .lean()
      ]);

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
          results: db.status.reduce(
            (acc: any, cur: any) => {
              acc[cur.name] = cur.total;
              return acc;
            },
            {
              ...defaultResults
            }
          )
        });
      }
      for (const dv of detailByVenues) {
        detailByVenue.push({
          _id: dv.info._id,
          name: dv.info.name,
          results: dv.status.reduce(
            (acc: any, cur: any) => {
              acc[cur.name] = cur.total;
              return acc;
            },
            {
              ...defaultResults
            }
          )
        });
      }
      if (inventory && inventory.length) {
        const currentInventory = inventory[0];
        const response = {
          _id: currentInventory._id,
          name: currentInventory.name,
          createdBy: currentInventory.userInfo
            ? {
                ...currentInventory.userInfo,
                fullName: `${currentInventory.userInfo.firstName} ${currentInventory.userInfo.lastName}`
              }
            : {},
          results: currentInventory.results.reduce(
            (acc: any, cur: any) => {
              acc[cur.status] = cur.total;
              return acc;
            },
            {
              ...defaultResults
            }
          ),
          status: currentInventory.status,
          createdAt: currentInventory.createdAt,
          finalizedAt: currentInventory.finalizedAt
            ? currentInventory.finalizedAt
            : null
        };

        return res.json({
          summary: response,
          inventorySettings: teamSettings!.inventory,
          labels,
          detailByVenue,
          detailByBrand,
          detail: detailInventory,
          status: 200
        });
      } else {
        return res.status(404).json({
          message: 'Inventario no encontrado',
          status: 404
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`detaill: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e, true, {
        user: req.user,
        extra: {
          body: req.body
        }
      });
      /* istanbul ignore next */
      return res.status(400).json({
        message: e,
        status: 400
      });
    }
  }

  public async pdf(req: IRequest, res: Response) {
    const { inventoryId, carId } = req.params;
    const inventorySettings: { [key: string]: any } = {
      "pending": "Pendientes",
      "found": "Encontrados",
      "missing": "Faltantes",
      "leftover": "Encontrados*",
      "reported": "Reportados",
      "empty": "Vacio",
      "check": "Descarga",
      "open": "Abierto",
    }

    const foundStatusContainer = (container: any) => {
      let status = container.status;
      if(container.evidenceStatus && container.evidenceStatus.length > 0) {
        const statusList = container.evidenceStatus.map((evidence: any) => evidence.status);
        if(statusList.includes('empty')) {
          status = 'empty';
        } else if(statusList.includes('check')) {
          status = 'check';
        } else if(statusList.includes('open')) {
          status = 'open';
        } else {
          status = container.status;
        }
      }
      return status;
    }

    try{
      const container = await InventoryCar.findOne({
        car: new mongoose.Types.ObjectId(carId),
        inventory: new mongoose.Types.ObjectId(inventoryId)
      }).populate([
        { path: 'inventoriedBy' },
        { path: 'images'},
        { path: 'venueFound'},
        { path: 'car' },
        { path: 'evidenceStatus.images' },
        { path: 'files' }
      ]);

      if (!container) {
        return res.status(404).json({
          message: 'No se ha encontrado el contenedor',
          status: 404
        });
      }

      let evidences = container.evidenceStatus.length ? container.evidenceStatus.map((e: any) => {
        return e.images;
      }).flat() : container.images;

      let statusContainer = inventorySettings[foundStatusContainer(container)];
      container.status = statusContainer;


      let cars = await InventoryCar.find({
        container: container._id
      }).populate([
        { path: 'inventoriedBy' },
        { path: 'images'},
        { path: 'venueFound'},
        { path: 'car' },
        { path: 'evidenceStatus.images' },
        { path: 'files' }
      ]).lean();

      cars = cars.map((tmp: any) => {
        let status = inventorySettings[foundStatusContainer(tmp)];
        return {
          ...tmp,
          status
        }
      })

      let template: string =
        path.join(__dirname, '../../../views/') + 'container/pdf/index.pug';
      const css = fs.readFileSync(
        path.join(__dirname, '../../../views/') + 'container/pdf/styles.css',
        'utf8'
      );

      const html = GeneralUtils.generateHtmlFromPugFile(template, {
        css: css.replace(/(\r\n|\n|\r)/gm, ''),
        moment,
        cars,
        container,
        evidences,
        userName: `${GeneralUtils.capitalizeFirstLetter(req.user.firstName)} ${GeneralUtils.capitalizeFirstLetter(req.user.lastName)}`
      })
      if (0) {
        return res.send(html);
      } else {
        // launch a new chrome instance
        const browser = await puppeteer.launch({
          executablePath: '/usr/bin/chromium',
          args: [
            '--no-sandbox',
            '--allow-file-access-from-files',
            '--enable-local-file-accesses'
          ], // Required.
          headless: true
        });
        // create a new page
        const page = await browser.newPage();

        await page.setContent(html, {
          waitUntil: 'networkidle0'
        });

        const pdfBuffer = await page.pdf({
          format: 'A4',
          displayHeaderFooter: true,

        //   headerTemplate: `
        //  <div style="width: 100%; font-size: 9px; display: flex; align-items: center; justify-content: space-between; margin: 10px 50px;">
        //   <img src="data:image/png;base64,${imageBase64}" style="width: 80px; height: auto; object-fit: contain;"/>
        //   <h3 style="margin: 0; flex: 1; text-align: center;">CIBU 782725-9</h3>
        //   <h3 style="margin: 0; text-align: right;">24/01/2025 10:25 hrs</h3>
        // </div>
        //     `,
          footerTemplate: `
            <div style="width: 100%; font-size: 10px; text-align: center; padding: 10px;">
              Página <span class="pageNumber"></span> / <span class="totalPages"></span>
            </div>`,
          // this is needed to prevent content from being placed over the footer
          margin: {
            top: '70px',
            left: '30px',
            right: '30px',
            bottom: '70px'
          },
        });

        await browser.close();

        // Return Buffer
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-disposition',
          `inline; filename=Tarja-${container.car.vin}.pdf`
        );
        return res.send(pdfBuffer);
      }

    } catch (e) {
      /* istanbul ignore next */
      logger.error(`pdf: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      return res.status(400).json({
        message: e,
        status: 400
      });
    }
  }


  public async dashboard(req: IRequest, res: Response): Promise<any> {
    let venuesPermissions: any = req.user.venuesPermissions();
    const { venues } = req.body;
    const team = req.user.team._id;
    if (venues && venues.length) {
      venuesPermissions = venuesPermissions.filter((v: any) =>
        venues.includes(v.toString())
      );
    }
    const total = 18;
    try {
      const inventory: any = await InventoryCar.aggregate([
        {
          $match: {
            $and: [
              {
                createdAt: {
                  $gte: moment()
                    .subtract(total, 'months')
                    .startOf('month')
                    .toDate()
                },
                venue: {
                  $in: venuesPermissions
                }
              }
            ]
          }
        },
        {
          $group: {
            _id: {
              status: '$status',
              // car: '$car',
              month: {
                $dateToString: { format: '%Y-%m', date: '$createdAt' }
              }
            },
            total: {
              $sum: 1
            }
          }
        },
        {
          $group: {
            _id: '$_id.month',
            results: {
              $push: {
                status: '$_id.status',
                total: '$total'
              }
            }
          }
        }
      ]);
      const data: any = {};
      const defaultResults = {
        [ChoicesStatusCarInventory.pending]: 0,
        [ChoicesStatusCarInventory.found]: 0,
        [ChoicesStatusCarInventory.missing]: 0,
        [ChoicesStatusCarInventory.reported]: 0,
        [ChoicesStatusCarInventory.leftover]: 0
      };
      for (let i = 0; i <= total; i++) {
        const month = moment()
          .subtract(total - i, 'months')
          .format('YYYY-MM');
        data[month] = { ...defaultResults };
      }
      for (const item of inventory) {
        data[item._id] = item.results.reduce(
          (acc: any, cur: any) => {
            acc[cur.status] = cur.total;
            return acc;
          },
          {
            ...defaultResults
          }
        );
      }
      const teamSettings = await TeamSetting.findOne({ team });
      res.json({
        data,
        inventorySettings: teamSettings!.inventory
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`inventory dashboard: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      // Raven.captureException(e, {req});
      /* istanbul ignore next */
      res.status(500).json({
        message: JSON.stringify(e),
        status: 500
      });
    }
  }

  public async inventoryByCars(req: IRequest, res: Response): Promise<any> {
    const team = req.user.team._id;
    try {
      /* generate file */
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Detalle', {
        properties: {
          // defaultRowHeight: 30
        },
        pageSetup: {
          fitToPage: true,
          fitToHeight: 100,
          fitToWidth: 1
        }
      });
      worksheet.views = [
        {
          state: 'frozen',
          xSplit: 3,
          ySplit: 1,
          topLeftCell: 'D2',
          activeCell: 'D2'
        }
      ];
      const columns: any[] = [
        {
          header: 'VIN',
          key: 'vin',
          width: 30,
          alignment: {
            wrapText: true
          }
        },
        {
          header: 'MARCA',
          key: 'marca',
          width: 30,
          alignment: {
            wrapText: true
          }
        },
        {
          header: 'MODELO',
          key: 'modelo',
          width: 40,
          alignment: {
            wrapText: true
          }
        }
      ];
      const venues = await Venue.find({ team, deleted: false }).sort('name');
      for (const venue of venues) {
        columns.push({
          header: venue.name,
          key: venue._id.toString(),
          width: 5,
          style: {
            alignment: {
              vertical: 'middle',
              horizontal: 'center'
            }
          }
        });
      }
      worksheet.columns = columns;
      worksheet.autoFilter = {
        from: 'A1',
        to: {
          row: 1,
          column: columns.length
        }
      };
      worksheet.getColumn(1).eachCell((cell) => {
        cell.alignment = {
          vertical: 'middle',
          textRotation: 0,
          wrapText: true
        };
        cell.font = {
          bold: true
        };
      });
      worksheet.getRow(1).eachCell((cell) => {
        const alignment: Partial<Alignment> = {
          vertical: 'middle',
          horizontal: 'center',
          textRotation: 0,
          wrapText: true
        };
        if (parseInt(cell.col, 10) > 3) {
          alignment.textRotation = 90;
        }
        cell.alignment = alignment;
        cell.font = {
          bold: true
        };
      });
      const cars = await CarModel.find(
        {
          team,
          isExhibition: false,
          createdAt: {
            $gte: moment().subtract(6, 'months')
            //   $lte: tf,
          }
        },
        {
          vin: true,
          denomination: true,
          color: true,
          brand: true
        }
      ).populate({
        path: 'inventories',
        select: ['name', 'createdAt', 'venueFound', 'status'],
        match: {
          status: {
            $in: [ChoicesStatusCarInventory.found]
          }
        },
        options: {
          sort: {
            createdAt: 1
          }
        }
      });
      for (const car of cars) {
        const inventories: any[] = car.inventories!;
        if (inventories.length) {
          const carData: any = {
            vin: car.vin,
            marca: car.brand,
            modelo: car.denomination
          };
          for (const inventory of inventories) {
            carData[inventory.venueFound] = carData.hasOwnProperty(
              inventory.venueFound
            )
              ? carData[inventory.venueFound] + 1
              : 1;
          }
          worksheet.addRow(carData);
        }
      }
      const tempFilePath = tempfile('.xlsx');
      await workbook.xlsx.writeFile(tempFilePath);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=detalle-inventarios.xlsx'
      );
      return res.sendFile(tempFilePath);
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message:
          'Ha ocurrido un error. Comunicate con soporte para que te ayudemos a solucionarlo.'
      });
    }
  }

  public async loadStock(req: IRequest, res: Response): Promise<any> {
    const { company } = req.user;
    const team = req.user.team._id;
    const { carsByVenue } = req.body;
    try {
      const stockCars: IStockCar[] = [];
      for (const venue of carsByVenue) {
        const venueRegExp = new RegExp(`^${venue.name.trim()}$`, 'i');
        let currentVenue: IVenueModel | null = await VenueModel.findOne({
          team,
          name: venueRegExp
        });
        // create venue if no existe
        if (currentVenue === null) {
          currentVenue = new VenueModel({
            name: venue.name.trim(),
            team,
            company
          });
          await currentVenue.save();
        }
        for (const car of venue.cars) {
          let currentCar: ICarModel | null = await CarModel.findOne({
            team,
            vin: car.vin.trim()
          });
          if (currentCar === null && car.vin && car.vin.trim().length) {
            currentCar = new CarModel({
              team,
              company,
              vin: car.vin,
              vin2: car.vin.substr(car.vin.length - 6),
              color: car.color,
              type: car.type,
              property: car.property,
              denomination: car.denomination,
              brand: car.brand,
              patent: car.patent,
              createdBy: req.user,
              status: ChoicesStatusCar.active
            });
            await currentCar.save();
          }
          if (currentVenue && currentCar) {
            stockCars.push({
              venue: currentVenue._id,
              car: currentCar._id
            });
            inventoryQueue.queue.add(
              'updateCar',
              {
                title: `updateCar ${car.vin}`,
                currentCar: currentCar._id,
                car
              },
              { attempts: 3, backoff: 1000, removeOnComplete: true }
            );
          }
        }
      }
      const stock = new Stock({
        company,
        team,
        createdBy: req.user._id
      });
      await stock.save();
      stockCars.map((s) => {
        s.stock = stock._id;
        return s;
      });
      await StockCar.insertMany(stockCars);
      socket().to(`stock-${team}`).emit('REFRESH', {
        update: true
      });
      res.json({
        message: 'Stock creado satisfactoriamente',
        status: 200
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`loadStock: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      res.status(500).json({
        message: e,
        status: 500
      });
    }
  }


  public async currentCompanyStock(req: IRequest, res: Response): Promise<any> {
    try {
      logger.info(`InventoryController.currentCompanyStock {email: ${req.user.email}}`);

      const { company } = req.user; // user request company
      let { companyId } = req.params; //filter param company

      let filterCompanies: any = null;
      let historyCarsResult: any[] = [];

      let userCompany = await Company.findById(company._id);

      if (userCompany?.handler && userCompany.clientCompanies?.includes(companyId)) {

        filterCompanies = {
          $and: [{
            company: new Types.ObjectId(companyId),
            handlerCompany: new Types.ObjectId(company._id),
            status: {
              $in: [
                StatusHistory.inTransit,
                StatusHistory.readyToClient
              ]
            },
          }]
        }

      } else {
        //for clients
        filterCompanies = {
          company: new Types.ObjectId(company._id),
          handlerCompany: {$exists: true},
          status: {
            $in: [
              StatusHistory.inTransit,
              StatusHistory.readyToClient
            ]
          }
        }
      }

      if(filterCompanies){
        historyCarsResult = await History.aggregate([
          {$match: filterCompanies},
          // get the inventory cars with the inventory id and the car id
          {
            $lookup: {
              from: 'inventorycars',
              let: { car: '$car', inventory: '$inventory' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$car', '$$car'] },
                        { $eq: ['$inventory', '$$inventory'] }
                      ]
                    }
                  }
                }
              ],
              as: 'inventoryCar'
            }
          },
          {$unwind: {
              path: '$inventoryCar',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: 'inventorycars',
              localField: 'inventoryCar.containerFound',
              foreignField: '_id',
              as: 'inventoryCar.containerFound'
            }
          },
          {
            $unwind: {
              path: '$inventoryCar.containerFound',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: 'venues',
              localField: 'inventoryCar.venue',
              foreignField: '_id',
              as: 'inventoryCar.venue' // Sobreescribimos el campo inventoryCar.venue con la info de la tabla venues
            }
          },
          {
            $unwind: {
              path: '$inventoryCar.venue',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $group: {
              _id: "$car",
              histories: {
                $push: {
                  status: '$status',
                  from: '$from',
                  to: '$to',
                  participant: '$participant',
                  createdAt: '$createdAt',
                  inventoryCar: '$inventoryCar',
                  current: "$current"
                }
              }
            }
          }
        ])

        let cars = await CarModel.find({
          _id: {$in: historyCarsResult.map((h: any) => h._id)}
        }).lean();

        historyCarsResult = historyCarsResult.map(hc =>{
          let car = cars.find((c: any) => c._id.toString() === hc._id.toString());
          return {
            car,
            histories: hc.histories
          }
        })
      }

      return res.status(200).json({
        cars: historyCarsResult
      });

    } catch (e) {
      logger.error(`InventoryController.currentCompanyStock: Error.`);
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      logger.error(e);
      return res.status(500).json({
        message: JSON.stringify(e),
        status: 500
      });
    }
  }


  public async currentStock(req: IRequest, res: Response): Promise<any> {
    try {
      const { company } = req.user;

      const historyCars = await History.find(
        {
          $and: [
            {
              company,
              current: true,
              status: {
                $in: [
                  StatusHistory.available,
                  StatusHistory.inTransit,
                  StatusHistory.sale
                ]
              },
              createdAt: {
                $gt: moment().subtract(45, 'days')
              }
            }
          ]
        },
        {
          status: true,
          from: true,
          to: true,
          participant: true,
          createdAt: true
        }
      )
        .allowDiskUse(true)
        .populate([
          {
            path: 'participant',
            select: ['name']
          },
          {
            path: 'car',
            select: [
              'vin',
              'vin2',
              'internalNumber',
              'color',
              'denomination',
              'brand',
              'venue',
              'patent',
              'internalNumber',
              'property',
              'type',
              'meta',
              'createdAt'
            ],
            populate: [
              {
                path: 'events',
                select: ['_id', 'module'],
                match: {
                  changeLocation: true
                }
              }
            ]
          },
          {
            path: 'from',
            select: ['name'],
            populate: [
              /*{
          path: 'region',
          select: ['code', 'name']
        }*/
            ]
          },
          {
            path: 'to',
            select: ['name'],
            populate: [
              /*{
          path: 'region',
          select: ['code', 'name']
        }*/
            ]
          }
        ])
        .lean();
      const inventories = await Inventory.find(
        {
          $and: [
            {
              company,
              status: ChoicesStatusInventory.finalized
            }
          ]
        },
        {
          createdAt: true,
          finalizedAt: true
        }
      )
        .allowDiskUse(true)
        .sort({ createdAt: -1 })
        .limit(2);
      return res.status(200).json({
        message: '',
        cars: historyCars,
        inventories
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`inventory currentStock: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      // Raven.captureException(e, {req});
      /* istanbul ignore next */
      return res.status(500).json({
        message: JSON.stringify(e),
        status: 500
      });
    }
  }

  public async CarStatusList(req: IRequest, res: Response): Promise<any> {
    try {
      const { team } = req.user;

      let handOutForm = await Form.find({team: team._id, kind: KindForm.final})

      let pipeline: any = [
        {$match: {
            team: new mongoose.Types.ObjectId(team._id),
            lastForm: {$nin: handOutForm.map(f => f._id)},
            vin: {"$exists" : true, "$ne" : ""},
            createdAt: {
              $gte: moment().subtract(12, 'months').toDate()
            },
            event: {"$exists" : true, $ne: {type: null}},
            "meta.location.venue" : {"$exists" : true, "$ne" : null},
          }
        },
        // {$project: {
        //     _id: 1,
        //     vin: 1,
        //     vin2: 1,
        //     internalNumber: 1,
        //     color: 1,
        //     denomination: 1,
        //     brand: 1,
        //     event: 1,
        //     createdAt: 1,
        //     venue: 1,
        //     meta: 1
        //   }},
      ]

      const cars = await CarModel
        .aggregate(pipeline)
        .allowDiskUse(true);

      return res.status(200).json({
        message: '',
        cars: cars
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`inventory currentStock: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      // Raven.captureException(e, {req});
      /* istanbul ignore next */
      return res.status(500).json({
        message: JSON.stringify(e),
        status: 500
      });
    }
  }

  public async addStatusEvidence(req: IRequest, res: Response): Promise<any> {
    logger.info(`InventoryController.addStatusEvidence {email: ${req.user.email} }`);
    let { vin, status, images } = req.body;
    const { id } = req.params;

    try {
      // Check if sent status is valid
      if (!Object.values(choicesStatusContainer).includes(status)) {
        return res.status(400).json({
          message: 'El estado enviado no es válido.',
          status: 400
        });
      }


      let car = await CarModel.findOne({vin: vin});
      if (!car) {
        return res.status(404).json({
          message: 'El vehículo no se encuentra en el sistema.',
          status: 404
        });
      }
      let inventory = await InventoryModel.findById(id);
      if (!inventory) {
        return res.status(404).json({
          message: 'El inventario no se encuentra en el sistema.',
          status: 404
        });
      }

      let inventoryCar = await InventoryCar.findOne({car: car._id, inventory: inventory._id});
      if (!inventoryCar) {
        return res.status(404).json({
          message: 'El vehículo no se encuentra en el inventario.',
          status: 404
        });
      }

      let evidenceStatus = inventoryCar.evidenceStatus
      if (evidenceStatus && evidenceStatus.find(e => e.status === status)) {
        evidenceStatus = evidenceStatus.map(e => {
          if (e.status === status) {
            e.images = e.images.concat(images.map((img: string) => new mongoose.Types.ObjectId(img)))
            e.date = new Date()
          }
          return e
        })
      } else {
        evidenceStatus = evidenceStatus.concat({
          status,
          date: new Date(),
          images: images.map((img: string) => new mongoose.Types.ObjectId(img))})
      }
      inventoryCar.containerStatus = status;
      inventoryCar.evidenceStatus = evidenceStatus
      inventoryCar = await inventoryCar.save()

      // Check if the inventory is inventoryContainer and if there's any inventoryCar pending to be found
      if (inventory.containerInventory) {
        await this.closeInventory(inventory, req.user);
        if (inventoryCar.virtualInventory) {
          const virtualInventory = await InventoryModel.findOne({
            _id: inventoryCar.virtualInventory
          });
          if (virtualInventory) {
            await this.closeVirtualInventory(virtualInventory)
            logger.info(`apiFoundCar: virtualInventory: ${virtualInventory}`);
          }
        }
      }

      if(car.isContainer) {

        const { user } = req;
        const venueId = user.venue._id;
        const { team } = req.user;

        inventoryCar = await inventoryCar.populate([
          { path: 'car' },
          { path: 'venue' },
          { path: 'venueFound' },
          { path: 'evidenceStatus' },
          { path: 'evidenceStatus.images' },
          { path: 'images' }
        ]);

        if(status === ChoicesStatusContainer.empty && inventoryCar.inventory){
          await this.addHistoryToCarOfEmptyContainer(inventoryCar);
        }

        await this.sendUpdateNotification("EVIDENCE_ADDED", venueId, team._id, inventoryCar, status, req, user);
      }

      return res.status(200).json({
        message: 'Se ha registrado la evidencia correctamente.',
        status: 200
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`addStatusEvidence: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      return res.status(500).json({
        message: e,
        status: 500
      });
    }
  }

  private async addHistoryToCarOfEmptyContainer(container: IInventoryCar): Promise<void> {

    const inventoryCarList = await InventoryCar.find({
      containerFound: container,
      status: ChoicesStatusCarInventory.found
    }).populate([{path: 'car'}]);

    let carsId : any[] = [];

    const histories: any[] = [];
    inventoryCarList.forEach(inventoryCar => {
      carsId.push(inventoryCar.car._id);
      if (!inventoryCar.car.isContainer) {
        histories.push({
          status: StatusHistory.readyToClient,
          module: ModuleHistory.inventory,
          car: inventoryCar.car,
          team: inventoryCar.car.team,
          company: inventoryCar.car.company,
          handlerCompany: inventoryCar.car.handlerCompany,
          venue: inventoryCar.venue,
          inventoryCar,
          inventory: inventoryCar.inventory,
          createdBy: inventoryCar.car.createdBy,
          executedAt: inventoryCar.car.createdAt,
          current: true
        });
      }
    });

    await History.updateMany(
      { _id: {$in: carsId} },
      { $set: {current: false}}
    );

    await History.insertMany(histories);
  }

  private autoRotate(path: string): Promise<any> {
    // doc http://aheckmann.github.io/gm/docs.html
    /**** REQUIRE *****
     brew install imagemagick
     brew install graphicsmagick
     * */
    return new Promise((resolve, reject) => {
      try {
        GraphicsMagick(path)
          .autoOrient()
          .write(path, (err) => {
            if (err) {
              /* istanbul ignore next */
              resolve({});
            } else {
              resolve({});
            }
          });
      } catch {
        resolve({});
      }
    });
  }

  private resizeImage(path: string): Promise<boolean> {
    // doc http://aheckmann.github.io/gm/docs.html
    /**** REQUIRE *****
     brew install imagemagick
     brew install graphicsmagick
     * */
    return new Promise((resolve, reject) => {
      try {
        GraphicsMagick(path)
          .resize(100, 100)
          .write(path, (err) => {
            if (err) {
              /* istanbul ignore next */
              resolve(true);
            } else {
              resolve(true);
            }
          });
      } catch {
        resolve(true);
      }
    });
  }

}

export default new InventoryController();
