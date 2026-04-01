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
  default as InventoryModel, IInventoryModel,
  ContainerInventoryContentType
} from '../models/inventory.model';
import {
  IVenueModel,
  default as Venue,
  default as VenueModel
} from '../../app/models/venue.model';
import InventoryCar, {
  choicesStatusContainer, ChoicesStatusContainer, IInventoryCarModel
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
import Form, { KindForm, KindQuestion } from '../../form/models/form.model';

import VirtualInventoryModel, {
  IInventoryVirtualModel,
} from '../models/virtualInventory.model';
import { IUserModel } from '../../app/schemas/user.schema';
import { IUser } from '../../app/interfaces/user.interface';
import Company from '../../app/models/company.model';
import { ContainerStatus } from '../../utils/enums/containerStatus.enum';
import { IInventoryFile } from '../interfaces/inventoryFile.interface';
import { ChoicesStatusCarInventory } from '../../app/models/inventoryCar.types';
import Participant from '../../form/models/participant.model';
import { IParticipant } from '../../form/interfaces/participant.interface';
import { OSA_LOGO_SVG } from "../../utils/svg";
import Inventory from '../models/inventory.model';

const statusMap: Record<string, string> = {
  found: 'Encontrado',
  pending: 'Pendiente',
  open: 'Abierto',
  check: 'En descarga',
  empty: 'Vacío',
  missing: 'Faltante'
};


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
    this.checkCarToInventory = this.checkCarToInventory.bind(this)
    this.inventoryCar = this.inventoryCar.bind(this)
    this.containerInventoryDetail = this.containerInventoryDetail.bind(this);
    this.containerInventoryDetailExport = this.containerInventoryDetailExport.bind(this);
    this.processContainerBatch = this.processContainerBatch.bind(this);
    this.containerInventorySummary = this.containerInventorySummary.bind(this);
    this.currentCompanyStockExport = this.currentCompanyStockExport.bind(this);
    this.createContainerInventory = this.createContainerInventory.bind(this);
    this.getInventoryForms = this.getInventoryForms.bind(this);
    this.uploadInventoryCarFile = this.uploadInventoryCarFile.bind(this);
    this.apiListInventoryCarFiles = this.apiListInventoryCarFiles.bind(this);
    this.addInventoryCarLink = this.addInventoryCarLink.bind(this);
    this.addInventoryCarLinkWeb = this.addInventoryCarLinkWeb.bind(this);
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

  private async getInventoryForms(type: string, user: IUser) {
    const unitFormKind = type === ContainerInventoryContentType.coded_items ? KindForm.codedUnitType : KindForm.generalUnitType;
    const closeFormKind = type === ContainerInventoryContentType.coded_items ? KindForm.closeCodedContainer : KindForm.closeGeneralContainer;

    let unitForm = await Form.findOne({ kind: unitFormKind, team: user.team._id, company: user.company._id });
    let openForm = await Form.findOne({ kind: KindForm.openContainer, team: user.team._id, company: user.company._id });
    let finishForm = await Form.findOne({ kind: closeFormKind, team: user.team._id, company: user.company._id });

    return {
      unitForm: unitForm?._id || null,
      openForm: openForm?._id || null,
      finishForm: finishForm?._id || null
    }
  }


  public async createContainerInventory(req: IRequest, res: Response) {
    let { name, carsByContainer, manualPhoto, reportPhoto, contentType } = req.body;
    carsByContainer = JSON.parse(carsByContainer);
    let inventoryForms: any = await this.getInventoryForms(contentType, req.user);
    try {
      const { company, team, venue } = req.user;
      const rutsByCompany = new Map<string, string>();
      Object.keys(carsByContainer).forEach((BIC: string) => {
        const container = carsByContainer[BIC]?.container;
        const rut = container?.extra?.['RUT Cliente']?.trim();
        const name = container?.extra?.['Cliente Razón Social']?.trim();
        if (rut && !rutsByCompany.has(rut)) {
          rutsByCompany.set(rut, name || '');
        }
      });

      const ruts = Array.from(rutsByCompany.keys());
      const existingCompanies = ruts.length
        ? await Company.find({ rut: { $in: ruts } }, { rut: 1, name: 1 }).lean()
        : [];
      const existingRuts = new Set(
        existingCompanies
          .map((c: any) => (c.rut ? c.rut.trim() : ''))
          .filter((rut: string) => rut.length)
      );
      const newCompanies = ruts
        .filter((rut) => !existingRuts.has(rut))
        .map((rut) => ({
          rut,
          name: rutsByCompany.get(rut) || ''
        }));
      const inventory = new Inventory({
        ...inventoryForms,
        name,
        company: company._id,
        team: team._id,
        venues: [venue._id],
        createdBy: req.user._id,
        status: ChoicesStatusInventory.pending,
        containerInventory: true,
        contentType: contentType || 'general-items',
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
        inventoryId: inventory._id,
        newCompanies,
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


  public async summary(req: IRequest, res: Response) {

    const { inventory } = req.params;

    try {

      const inventoryResult = await InventoryCar.find({
        inventory
      }).populate([
        {
          path: 'car'
        },
        {
          path: 'virtualInventory',
          select: ['name']
        },
        {
          path: 'participant',
          select: ['hasDamages']
        }
      ]);


      const inventoryMap: any = {};
      const containers = new Map(); //contenedores por _id
      const unitsByContainer = new Map(); //Agrupa unidades por container
      const clientsSet = new Set();
      const shipsSet = new Set();

      // Primero: clasificamos contenedores y unidades
      inventoryResult.forEach(item => {

        const inventoryId: string = item.inventory?.toString() || '';

        if (!inventoryMap[inventoryId]) {
          inventoryMap[inventoryId] = {
            names: '',
            nave: item.extra.Nave,
            trip: item.extra['N° Viaje'],
            location: item.extra['Ubicación'],
            client: item.extra['Cliente Razón Social'],
            units: { pending: 0, found: 0, hasDamages: 0 },
            containers: {
              pending: 0,
              found: 0,
              open: 0,
              check: 0,
              empty: 0,
              'empty(*)': 0
            }
          };

          if (item.virtualInventory !== undefined) {
            const virtualInventory: any = item.virtualInventory
            const { name } = virtualInventory;
            if (inventoryMap[inventoryId].names !== '' && !inventoryMap[inventoryId].names.includes(name)) {
              inventoryMap[inventoryId].names = `${inventoryMap[inventoryId].names}, ${name}`;
            } else {
              inventoryMap[inventoryId].names = `${name}`;
            }
          }
        }

        // Recolectar metadata
        if (item.extra) {
          if (item.extra['Cliente Razón Social']) clientsSet.add(item.extra['Cliente Razón Social']);
          if (item.extra.Nave) shipsSet.add(item.extra.Nave);
        }

        if (item.car.isContainer) {
          containers.set(item._id, item); // Guardar contenedor
        } else {
          const containerId: string = item.container?.toString() || '';
          if (containerId) {
            if (!unitsByContainer.has(containerId)) {
              unitsByContainer.set(containerId, []);
            }
            unitsByContainer.get(containerId).push(item);
          }
        }
      });

      // Segundo: procesar contenedores
      containers.forEach((container, containerId) => {

        const inventoryId = container.inventory;
        const summary = inventoryMap[inventoryId];
        const units = unitsByContainer.get(containerId.toString()) || [];
        const containerStatus = container.containerStatus;

        // Contar containerStatus (solo los estados válidos)
        if (summary.containers.hasOwnProperty(containerStatus)) {
          summary.containers[containerStatus]++;
        }

        //empty(*) vs empty
        if (containerStatus === "empty") {

          const allUnitsFound = units.every((unit: { status: string; }) => unit.status === "found");

          if (allUnitsFound) {
            //summary.containers.empty++; //verificar
          } else {
            summary.containers['empty(*)']++;
            summary.containers.empty--; // Ajustar el contador original
          }


        }
      });

      // Tercero: contar unidades
      inventoryResult.forEach(item => {
        if (!item.car.isContainer) {
          const inventoryId: any = item.inventory;
          const summary = inventoryMap[inventoryId];
          const status = item.status;

          if (status === "pending" || status === "found") {
            summary.units[status]++;
          }

          if (item.participant && item.participant.hasDamages) {
            summary.units['hasDamages']++;
          }
        }
      });


      return res.status(200).json({
        units: unitsByContainer,
        summary: inventoryMap,
        metadata: {
          filters: {
            clients: Array.from(clientsSet),
            ships: Array.from(shipsSet)
          }
        }
      });

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

    let match: any[] = [
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
          `InventoryController.apiList email: ${req.user.email
          }, query: ${JSON.stringify(req.query)}`
        );
        logger.debug(
          `InventoryController.apiList email: ${req.user.email
          }, aggregate: ${JSON.stringify(aggregate)}`
        );
        logger.debug(
          `InventoryController.apiList email: ${req.user.email
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

        const inventories = await (Inventory as any)
          .find(inventoryMatch)
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

        if (inventories) {
          logger.info(
            `apiDetail Inventory: ${inventories.length} inventarios encontrados`
          );
          let cars = inventories.flatMap((inventory: any) => {
            return inventory.cars.filter((car: IInventoryCar) => car.car).map((car: IInventoryCar) => {
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
                inventoryRef: car.inventory,
                contentDescription: car.contentDescription,
                units: car.units,
              };
            })
          })

          res.status(200).json({
            data: {
              cars: cars,
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
      // print stack trace
      logger.error(e.stack);
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
    let { comment, damage } = req.query;
    const file: any = GeneralUtils.getFileFromRequest(req.files, 'file');
    if (file) {
      try {
        logger.info(
          `InventoryController.uploadFile email: ${req.user.email} inventory: ${id} ` +
          `company: ${company._id} venue: ${venue._id} team: ${team._id} ` +
          `mimetype: ${file.mimetype} size: ${file.size} damage: ${damage} ` +
          `hasComment: ${!!comment} inventoryCardId: ${inventoryCardId ?? 'none'}`
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
        if (comment && comment !== "null" && comment.toString().trim().length) {
          inventoryFile.comment = comment.toString().trim();
        }
        if (damage && damage === '1') {
          inventoryFile.showDamage = true;
        }
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
        logger.info(
          `InventoryController.uploadFile SUCCESS inventoryFile: ${inventoryFile._id} ` +
          `inventory: ${id} email: ${req.user.email}`
        );
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
        await InventoryCar.updateOne(
          { files: inventoryFile._id },
          { $pull: { files: inventoryFile._id } }
        );
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

  public async closeVirtualInventory(virtualInventory: IInventoryVirtualModel) {
    const virtualInventoryCars = await InventoryCar.find({
      virtualInventory: virtualInventory._id,
      $or: [
        { status: ChoicesStatusCarInventory.pending, container: { $exists: true } },
        { containerStatus: { $ne: ChoicesStatusContainer.empty }, container: { $exists: false } }
      ]
    });
    logger.info(`apiFoundCar: virtualInventoryCars: ${virtualInventoryCars.length}`);
    if (virtualInventoryCars.length === 0) {
      virtualInventory.status = ChoicesStatusInventory.finalized;
      await virtualInventory.save();
    }
  }

  public async closeInventory(inventory: IInventoryModel, user: IUserModel | IUser) {
    const inventoryCars = await InventoryCar.find({
      inventory: inventory._id,
      $or: [
        { status: ChoicesStatusCarInventory.pending, container: { $exists: true } },
        { containerStatus: { $ne: ChoicesStatusContainer.empty }, container: { $exists: false } }
      ]
    });
    if (inventoryCars.length === 0) {
      inventory.status = ChoicesStatusInventory.finalized;
      inventory.finalizedAt = new Date();
      inventory.finalizedBy = user._id;
      await inventory.save();
    }
  }

  public async checkCarToInventory(user: IUserModel, vin: string, inventoryId: string): Promise<{ ok: boolean, message: string, code: number, car?: ICarModel, inventoryCar?: IInventoryCarModel, inventory?: IInventoryModel }> {
    const { team } = user;
    let carFilter = user.company.handler ?
      { vin, $or: [{ company: user.company._id }, { handlerCompany: user.company._id }] } :
      { vin, team };
    const car = await Car.findOne(carFilter);
    if (!car) {
      return { ok: false, message: 'El vehículo no existe', code: 404 };
    }
    const inventory = await InventoryModel.findOne({ _id: inventoryId, team: user.team._id });
    if (!inventory) {
      return { ok: false, message: 'El inventario no existe', code: 404 };
    }
    const inventoryCar = await InventoryCar.findOne({ car: car._id, inventory: inventory._id })
      .populate([
        { 'path': 'car' },
      ]);
    if (!inventoryCar) {
      return { ok: false, message: 'El vehículo no está en el inventario', code: 404 };
    }
    if (inventoryCar.status === ChoicesStatusCarInventory.found) {
      return { ok: true, message: 'El vehículo ya ha sido inventariado', code: 200, inventory, inventoryCar };
    }
    else if (inventoryCar.status !== ChoicesStatusCarInventory.pending) {
      return { ok: false, message: 'El vehículo ya ha sido inventariado', code: 404 };
    }
    return { ok: true, message: '', code: 200, inventoryCar: inventoryCar, inventory: inventory };
  }

  public async inventoryCar(user: IUserModel, inventory: IInventoryModel, inventoryCar: IInventoryCarModel, images?: IInventoryFile[], containerFound?: string, createHistory: boolean = true): Promise<IInventoryCarModel> {
    try {
      const venueId = user.venue._id;
      const { team } = user;
      const teamSettings = await TeamSetting.findOne({ team });
      inventoryCar.venueFound = venueId;
      await inventoryCar.populate('participant');
      if (containerFound) {
        let inventoryContainer = await InventoryCar.findOne({
          _id: new mongoose.Types.ObjectId(containerFound),
          inventory: inventory._id
        });
        if (inventoryContainer) {
          inventoryCar.containerFound = inventoryContainer._id;
          if (inventoryContainer.containerStatus !== ContainerStatus.CHECK) {
            inventoryContainer.containerStatus = ContainerStatus.CHECK;
            inventoryContainer = await inventoryContainer.save();
          }
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
            text: `${user.firstName} ${user.lastName} encontró ${inventoryCar.car.brand} (${inventoryCar.car.denomination}) en ${user.venue.name}.`,
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
            text: `${user.firstName} ${user.lastName} encontró ${inventoryCar.car.brand} (${inventoryCar.car.denomination}) en ${user.venue.name}.`,
            status: ChoicesStatusCarInventory.found,
            venue: venueId,
            update: true
          });
      }
      if (inventoryCar.car.isContainer) {
        if (images) {
          inventoryCar.evidenceStatus = [
            { status: ChoicesStatusContainer.open, images, date: new Date() },
          ]
        }
        inventoryCar.containerStatus = ChoicesStatusContainer.open;
      }

      inventoryCar.images = images
        ? images
        : [];

      inventoryCar.inventoriedBy = user._id;
      inventoryCar = await inventoryCar.save();

      socket().to(`inventory-list-${team._id}`).emit('REFRESH', {
        update: true
      });

      // Check if the inventory is inventoryContainer and if there's any inventoryCar pending to be found
      if (inventory.containerInventory) {
        await this.closeInventory(inventory, user);

        if (inventoryCar.virtualInventory) {
          const virtualInventory = await VirtualInventoryModel.findOne({
            _id: inventoryCar.virtualInventory
          });
          if (virtualInventory) {
            await this.closeVirtualInventory(virtualInventory)
          }
        }
      }
      await this.sendUpdateNotification("VEHICLE_FOUND", venueId, team._id, inventoryCar, ChoicesStatusCarInventory.found, user);
      return inventoryCar;
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`inventoryCar: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${user._id}, email: ${user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      throw e;
    }
  }

  public async apiFoundCar(req: IRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const { vin, images, containerFound } = req.body;
    logger.info(`apiFoundCar`);
    logger.info(
      `{user: {_id: ${req.user._id}, email: ${req.user.email
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
      req.user.venue = updatedUser.venue;

      let check = await this.checkCarToInventory(req.user as IUserModel, vin, id);
      if (!check.ok) {
        return res.status(check.code).json({
          message: check.message,
          status: check.code
        });
      }
      let { inventoryCar, inventory } = check;
      inventoryCar = await inventoryCar!.populate([
        { path: 'car', },
        { path: 'evidenceStatus' },
        { path: 'evidenceStatus.images' },
        { path: 'images' },
      ]);

      let imageFiles: any[] = [];
      if (images) {
        imageFiles = await InventoryFile.find({ _id: { $in: images.map((i: string) => new mongoose.Types.ObjectId(i)) } });
      }

      let inventoriedCar = await this.inventoryCar(updatedUser, inventory!, inventoryCar, imageFiles, containerFound);

      return res.status(200).json({
        vin: inventoriedCar.car.vin,
        status: 200
      })
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

  async sendUpdateNotification(notificationType: MessageType, venueId: string, teamId: string, inventory: any, status: string, user: any): Promise<void> {



    const messageStatus = statusMap[`${status}`];

    let title = `${user.firstName} ${user.lastName} agregó evidencia al contenedor ${inventory.car.vin} en ${user.venue.name}.`;
    let message = `Ahora el contenedor está ${messageStatus}.`;

    if (notificationType === "VEHICLE_FOUND" || notificationType === "CONTAINER_FOUND") {

      title = `Vehículo encontrado`;
      message = `${user.firstName} ${user.lastName} encontró ${inventory.car.brand} (${inventory.car.denomination}) en ${user.venue.name}.`;

      if (inventory.car.isContainer) {
        title = `Contenedor encontrado`;
        message = `${user.firstName} ${user.lastName} encontró ${inventory.car.vin} en ${user.venue.name}.`;
      }
    }

    if (notificationType === "UNIT_ADDED") {
      title = `Unidad agregada`;
      message = `${user.firstName} ${user.lastName} agregó una unidad al contenedor ${inventory.car.vin} en ${user.venue.name}.`;
    }

    if (notificationType === "CONTAINER_OPENED") {
      title = `Contenedor abierto`;
      message = `${user.firstName} ${user.lastName} abrió el contenedor ${inventory.car.vin} en ${user.venue.name}.`;
    }

    if (notificationType === "CONTAINER_CLOSED") {
      title = `Contenedor cerrado`;
      message = `${user.firstName} ${user.lastName} cerró el contenedor ${inventory.car.vin} en ${user.venue.name}.`;
    }

    socket()
      .to(`dashboard-container-vin-view-${teamId}`)
      .emit('REFRESH', {
        title: title,
        text: message,
        status: status,
        venue: venueId,
        update: true,
        isUnitNotification: notificationType === "UNIT_ADDED",
        metadata: {
          inventory: inventory
        }
      });
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
            const destDirectory = `/tmp/${car._id}${image._id}.${image.file.name.split('.')[image.file.name.split('.').length - 1]
              }`;
            imagesToDownload.push(() =>
              this.downloadFile(image.file.url, destDirectory)
            );
            imagesToCompress.push({
              destDirectory,
              name: `${car.car.vin}/IMAGE${image._id
                .toString()
                .substr(image._id.length - 10, 10)
                .toUpperCase()}.${image.file.name.split('.')[
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
      `{user: {_id: ${req.user._id}, email: ${req.user.email
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
        if (containerFound) {
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
    let { car, label, custom, carID, isUnit } = req.body;

    logger.info(`setLabel`);
    logger.info(
      `{user: {_id: ${req.user._id}, email: ${req.user.email
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

          let updatedParam: any = {
            label: newLabel._id,
            labelBy: req.user._id,
            labelText: custom
          }

          if (isUnit) {
            updatedParam = {
              status: newLabel.sendTo,
            }
          } else {
            updatedParam = {
              containerStatus: newLabel.sendTo,
            }
          }

          const inventoryCar = await InventoryCar.findById(car, {
            venue: true
          });
          if (inventoryCar) {
            await InventoryCar.updateOne(
              {
                _id: car,
                inventory: id
              },
              updatedParam,
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
            unitForm: true,
            contentForm: true,
            finishForm: true,
            openForm: true,
            contentType: true,
          }
        ).populate({ path: "virtualInventories", match: { status: ChoicesStatusInventory.inProcess } }).lean();

        let dataInventories: any = {};

        inventories.map((inventory: HydratedDocument<IInventory>) => {
          if (inventory.virtual) {
            inventory.virtualInventories = inventory.virtualInventories.map((virtualInventory: any) => {
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

  public async containerInventorySummary(req: IRequest, res: Response) {
    try {
      const { shipFilter, tripFilter, containerFilter, blFilter, clientFilter, statusFilterSelected, filterHasDamage, startDate, endDate } = req.query;

      const venuesPermissions = req.user.venuesPermissions();

      let containerMatch: any = {
        $or: [
          {
            'venue': {
              $in: venuesPermissions
            }
          },
          {
            'venueFound': {
              $in: venuesPermissions
            }
          }
        ],
      }

      let inventories = await Inventory.find({
        team: req.user.team._id,
        containerInventory: true,
        venues: { $in: venuesPermissions }
      }, {
        _id: true,
        unitForm: true,
      })


      let carFilter: any = {}

      if (statusFilterSelected) {
        containerMatch['containerStatus'] = {
          $in: statusFilterSelected.toString().split(',')
        }
      } else {
        containerMatch['containerStatus'] = {
          $in: [
            ChoicesStatusContainer.pending,
            ChoicesStatusContainer.open,
            ChoicesStatusContainer.check,
            ChoicesStatusContainer.empty,
          ]
        }
      }

      if (filterHasDamage?.toString() === "true") {
        let damagedParticpants = await Participant.find({
          form: { $in: inventories.map((i: any) => i.unitForm) },
        }, { car: 1 });
        let damagedCars = await InventoryCar.find({
          car: { $in: damagedParticpants.map((p: any) => p.car) },
        }, { containerFound: 1 });

        containerMatch['_id'] = {
          $in: damagedCars.map((c: any) => c.containerFound)
        }
        carFilter['participant.hasDamages'] = true;
      }

      if (tripFilter) {
        containerMatch['extra.N° Viaje'] = { $in: tripFilter.toString().split(',').map((t: string) => t.trim()) };
      }

      if (shipFilter) {
        containerMatch['extra.Nave'] = { $in: shipFilter.toString().split(',').map((s: string) => s.trim()) };
      }

      if (containerFilter) {
        containerMatch['extra.BIC'] = { $regex: containerFilter.toString(), $options: 'i' };
      }

      if (blFilter) {
        containerMatch['extra.N° BL'] = blFilter;
      }

      if (clientFilter) {
        containerMatch['car.company'] = new mongoose.Types.ObjectId(clientFilter.toString());
      }

      logger.info(
        `InventoryController.containerInventorySummary {email: ${req.user.email}, body: ${JSON.stringify(req.body)}}`
      );

      // Moment read date 2012-06-20
      let sDate = moment(startDate as string, 'YYYY-MM-DD').startOf('day').toDate();
      let eDate = moment(endDate as string, 'YYYY-MM-DD').endOf('day').toDate();

      let containerDateFilter = {};
      if (startDate && endDate) {
        containerDateFilter = {
          $or: [
            { openDate: { $gte: sDate, $lte: eDate } },
            { emptyDate: { $gte: sDate, $lte: eDate } },
            { createdAt: { $gte: sDate, $lte: eDate } }
          ]
        };
      }

      let resume = await InventoryCar.aggregate([
        { $match: { inventory: { $in: inventories.map((i: any) => i._id) } } },
        {
          $lookup: {
            from: 'cars',
            localField: 'car',
            foreignField: '_id',
            as: 'car'
          }
        },
        { $unwind: { path: '$car' } },
        { $match: { 'car.isContainer': true } },
        { $match: containerMatch },
        {
          $addFields: {
            openEvidence: {
              $filter: {
                input: '$evidenceStatus',
                as: 'evidence',
                cond: {
                  $eq: ['$$evidence.status', ChoicesStatusContainer.open]
                }
              }
            }
          }
        },
        {
          $addFields: {
            openDate: { $arrayElemAt: ['$openEvidence.date', 0] }
          }
        },
        {
          $addFields: {
            emptyEvidence: {
              $filter: {
                input: '$evidenceStatus',
                as: 'evidence',
                cond: {
                  $eq: ['$$evidence.status', ChoicesStatusContainer.empty]
                }
              }
            }
          }
        },
        {
          $addFields: {
            emptyDate: { $arrayElemAt: ['$emptyEvidence.date', 0] }
          }
        },
        {
          $match: containerDateFilter
        },
        {
          $group: {
            _id: '$containerStatus',
            count: { $sum: 1 }
          }
        }
      ]);

      let ships = await InventoryCar.aggregate([
        { $match: { inventory: { $in: inventories.map((i: any) => i._id) }, } },
        {
          $lookup: {
            from: 'cars', // The collection name for the 'cars' field
            localField: 'car', // Field in InventoryCar
            foreignField: '_id', // Field in carinventories
            as: 'car',
          }
        },
        { $unwind: { path: '$car' } },
        { $match: { 'car.isContainer': true } }, // Filter for container cars
        { $match: containerMatch },
        {
          $group: {
            _id: '$extra.Nave',
          }
        }
      ])

      let trips = await InventoryCar.aggregate([
        { $match: { inventory: { $in: inventories.map((i: any) => i._id) }, } },
        {
          $lookup: {
            from: 'cars', // The collection name for the 'cars' field
            localField: 'car', // Field in InventoryCar
            foreignField: '_id', // Field in carinventories
            as: 'car',
          }
        },
        { $unwind: { path: '$car' } },
        { $match: { 'car.isContainer': true } }, // Filter for container cars
        { $match: containerMatch },
        {
          $group: {
            _id: '$extra.N° Viaje',
          }
        }
      ])


      return res.status(200).json({
        data: {
          resume,
          trips,
          ships
        }
      });

    } catch (error) {
      logger.error(`containerInventorySummary: Async Error.`);
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      logger.error(error);
      logger.error(error.stack);
      return res.status(500).json({
        message: 'Ha ocurrido un error al obtener el resumen del inventario de contenedores.',
        status: 500
      });
    }
  }

  public async containerInventoryDetail(req: IRequest, res: Response) {
    try {
      const { page, pageSize, sort, sortOption } = req.query;
      const { shipFilter, tripFilter, containerFilter, blFilter, clientFilter, statusFilterSelected, filterHasDamage, startDate, endDate } = req.query;

      const venuesPermissions = req.user.venuesPermissions();

      let containerMatch: any = {
        $or: [
          {
            'venue': {
              $in: venuesPermissions
            }
          },
          {
            'venueFound': {
              $in: venuesPermissions
            }
          }
        ],
      }

      let inventories = await Inventory.find({
        team: req.user.team._id,
        containerInventory: true,
        venues: { $in: venuesPermissions }
      }, {
        _id: true,
        unitForm: true,
      })


      let carFilter: any = {}

      if (statusFilterSelected) {
        containerMatch['containerStatus'] = {
          $in: statusFilterSelected.toString().split(',')
        }
      } else {
        containerMatch['containerStatus'] = {
          $in: [
            ChoicesStatusContainer.pending,
            ChoicesStatusContainer.open,
            ChoicesStatusContainer.check,
            ChoicesStatusContainer.empty,
          ]
        }
      }

      if (filterHasDamage?.toString() === "true") {
        logger.info("FIltrando con daños")
        let damagedParticpants = await Participant.find({
          form: { $in: inventories.map((i: any) => i.unitForm) },
          hasDamages: true,
        }, { car: 1 });

        logger.info(`damagedParticpants: ${JSON.stringify(damagedParticpants.length)}`);
        let damagedCars = await InventoryCar.find({
          car: { $in: damagedParticpants.map((p: any) => p.car) },
        }, { containerFound: 1 });

        logger.info(`damagedParticpants: ${JSON.stringify(damagedCars.length)}`);

        containerMatch['_id'] = {
          $in: damagedCars.map((c: any) => c.containerFound)
        }
        carFilter['participant.hasDamages'] = true;
      }

      if (tripFilter) {
        containerMatch['extra.N° Viaje'] = { $in: tripFilter.toString().split(',').map((t: string) => t.trim()) };
      }

      if (shipFilter) {
        containerMatch['extra.Nave'] = { $in: shipFilter.toString().split(',').map((s: string) => s.trim()) };
      }

      if (containerFilter) {
        containerMatch['extra.BIC'] = { $regex: containerFilter.toString(), $options: 'i' };
      }

      if (blFilter) {
        containerMatch['extra.N° BL'] = blFilter;
      }

      if (clientFilter) {
        let company = await Company.findOne({
          _id: new mongoose.Types.ObjectId(clientFilter.toString()),
        }).populate('team');

        let clientCars = await Car.find({
          company: new mongoose.Types.ObjectId(clientFilter.toString()),
        }, { _id: 1 });

        let inventoryCars = await InventoryCar.find({
          car: { $in: clientCars.map((p: any) => p._id) },
        }, { containerFound: 1, container: 1 });

        containerMatch["$or"] = [{
          '_id': {
            $in: inventoryCars.map((c: any) => c.container || c.containerFound)
          }
        },
        { "extra.RUT Cliente": company?.rut }
        ]

        carFilter['car.company'] = new mongoose.Types.ObjectId(clientFilter.toString());
      }

      let sortField: string = sort ? sort.toString() : 'createdAt';
      let sortDirection: -1 | 1 = sortOption === 'asc' ? 1 : -1;
      let sortObject: Record<string, 1 | -1> = {};
      sortObject[sortField] = sortDirection;

      logger.info(
        `InventoryController.containerInventoryDetail {email: ${req.user.email}, body: ${JSON.stringify(req.body)}}`
      );

      let options = {
        page: page ? parseInt(page as string, 10) : 1,
        limit: pageSize ? parseInt(pageSize as string, 10) : 50,
        lean: true
      }

      let containerDateFilter: any = {};
      if (startDate && endDate) {
        let sDate = moment(startDate as string, 'YYYY-MM-DD').startOf('day').toDate();
        let eDate = moment(endDate as string, 'YYYY-MM-DD').endOf('day').toDate();
        containerDateFilter = {
          $or: [
            { 'openDate': { $gte: sDate, $lte: eDate } },
            { 'emptyDate': { $gte: sDate, $lte: eDate } },
            { 'createdAt': { $gte: sDate, $lte: eDate } }
          ]
        }
      }

      let containers = await InventoryCar.aggregatePaginate(
        InventoryCar.aggregate([
          { $match: { inventory: { $in: inventories.map((i: any) => i._id) }, } },
          {
            $lookup: {
              from: 'cars', // The collection name for the 'cars' field
              localField: 'car', // Field in InventoryCar
              foreignField: '_id', // Field in carinventories
              as: 'car',
            }
          },
          { $unwind: { path: '$car' } },

          { $match: { 'car.isContainer': true } }, // Filter for container cars
          { $match: containerMatch },
          { $unwind: { path: "$units", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "participants",
              localField: "units.participant",
              foreignField: "_id",
              as: "units.participant",
              pipeline: [
                { $project: { name: 1, hasDamages: 1, deliveryInfo: 1, createdAt: 1 } }
              ]
            }
          },
          { $unwind: { path: "$units.participant", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "inventoryfiles",
              localField: "units.images",
              foreignField: "_id",
              as: "units.images",
            }
          },
          {
            $group: {
              _id: "$_id", // Group by the original document's _id
              inventory: { $first: "$inventory" },
              car: { $first: "$car" },
              venue: { $first: "$venue" },
              images: { $first: "$images" },
              status: { $first: "$status" },
              containerStatus: { $first: "$containerStatus" },
              extra: { $first: "$extra" },
              contentDescription: { $first: "$contentDescription" },
              contentDetails: { $first: "$contentDetails" },
              evidenceStatus: { $first: "$evidenceStatus" },
              venueFound: { $first: "$venueFound" },
              openDate: { $first: "$openDate" },
              cars: { $first: "$cars" }, // If 'cars' is a top-level array, use $first to get the whole array
              createdAt: { $first: "$createdAt" },
              updatedAt: { $first: "$updatedAt" },
              units: { $push: "$units" },
              openParticipant: { $first: "$openParticipant" },
              closeParticipant: { $first: "$closeParticipant" },// Push the modified units back into an array
              files: { $first: "$files" },
              // To include other root fields, you'd list them here, e.g.,
              // otherField: { $first: "$otherField" }
            }
          },
          {
            $lookup: {
              from: 'participants',
              localField: 'openParticipant',
              foreignField: '_id',
              as: 'openParticipant',
              pipeline: [
                { $project: { name: 1, hasDamages: 1, createdAt: 1, deliveryInfo: 1, user: 1 } },
                {
                  $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user',
                    pipeline: [
                      { $project: { firstName: 1, lastName: 1, email: 1 } }
                    ]
                  }
                },
                { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
              ]
            }
          },
          { $unwind: { path: "$openParticipant", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'participants',
              localField: 'closeParticipant',
              foreignField: '_id',
              as: 'closeParticipant',
              pipeline: [
                { $project: { name: 1, hasDamages: 1, createdAt: 1, deliveryInfo: 1, user: 1 } },
                {
                  $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user',
                    pipeline: [
                      { $project: { firstName: 1, lastName: 1, email: 1 } }
                    ]
                  }
                },
                { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
              ]
            }
          },
          { $unwind: { path: "$closeParticipant", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'inventoryfiles',
              localField: 'images',
              foreignField: '_id',
              as: 'images'
            }
          },
          {
            $lookup: {
              from: "venues",
              localField: "venue",
              foreignField: "_id",
              as: "venue",
              pipeline: [
                { $project: { name: 1 } },
              ]
            }
          },
          { $unwind: { path: '$venue', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "venues",
              localField: "venueFound",
              foreignField: "_id",
              as: "venueFound",
              pipeline: [
                { $project: { name: 1 } },
              ]
            }
          },
          {
            $addFields: {
              openEvidence: {
                $filter: {
                  input: '$evidenceStatus',
                  as: 'evidence',
                  cond: { $eq: ['$$evidence.status', ChoicesStatusContainer.open] }
                }
              }
            }
          },
          {
            $addFields: {
              openDate: { $arrayElemAt: ['$openEvidence.date', 0] }
            }
          },
          {
            $addFields: {
              emptyEvidence: {
                $filter: {
                  input: '$evidenceStatus',
                  as: 'evidence',
                  cond: { $eq: ['$$evidence.status', ChoicesStatusContainer.empty] }
                }
              }
            }
          },
          {
            $addFields: {
              emptyDate: { $arrayElemAt: ['$emptyEvidence.date', 0] }
            }
          },
          {
            $addFields: {
              units: {
                $filter: {
                  input: "$units",
                  as: "unit",
                  cond: {
                    $and: [
                      { $ne: ["$$unit", {}] },
                      { $ifNull: ["$$unit.participant", false] }
                    ]
                  }
                }
              }
            }
          },
          {
            $match: containerDateFilter
          },
          { $sort: sortObject },
          { $unwind: { path: '$venueFound', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              car: 1,
              images: 1,
              evidenceStatus: 1,
              status: 1,
              containerStatus: 1,
              contentDetails: 1,
              venueFound: 1,
              venue: 1,
              extra: 1,
              openDate: 1,
              openParticipant: 1,
              closeParticipant: 1,
              emptyDate: 1,
              inventory: 1,
              units: 1,
              contentDescription: 1,
              files: 1,
            }
          }
        ]),
        options
      )

      for (const container of containers.docs) {
        if (container.evidenceStatus && container.evidenceStatus.length > 0) {
          for (let evidence of container.evidenceStatus) {
            if (evidence.images && evidence.images.length > 0) {
              evidence.images = await InventoryFile.find({ _id: { $in: evidence.images.map((i: string) => new mongoose.Types.ObjectId(i)) } });
            }
          }
        }
      }

      let cars = await InventoryCar.aggregate([
        {
          $match: {
            inventory: { $in: inventories.map((i: any) => i._id) },
            $or: [
              { container: { $in: containers.docs.map((c: any) => c._id) } },
              { containerFound: { $in: containers.docs.map((c: any) => c._id) } }
            ],
          }
        },
        {
          $lookup: {
            from: 'cars',
            localField: 'car',
            foreignField: '_id',
            as: 'car'
          }
        },
        { $unwind: { path: '$car' } },
        {
          $lookup: {
            from: 'inventoryfiles',
            localField: 'images',
            foreignField: '_id',
            as: 'images'
          }
        },
        {
          $lookup: {
            from: 'participants',
            localField: 'participant',
            foreignField: '_id',
            as: 'participant',
            pipeline: [
              { $project: { name: 1, hasDamages: 1, createdAt: 1, deliveryInfo: 1 } }
            ]
          }
        }, {
          $unwind: { path: '$participant', preserveNullAndEmptyArrays: true }
        },
        { $match: carFilter },
      ])

      containers.docs = containers.docs.map(c => {
        let tmp = { ...c }
        tmp.cars = cars.filter(car => {
          return car.containerFound ?
            car.containerFound.toString() === c._id.toString() :
            car.container.toString() === c._id.toString()
        });
        return tmp;
      });

      return res.json({
        data: containers.docs,
        total: containers.totalDocs,
        page: containers.page,
        pageSize: containers.limit,
        totalPages: containers.totalPages,
        hasNextPage: containers.hasNextPage,
      })

    } catch (e) {
      logger.error(`containerInventoryDetail: Async Error.`);
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      logger.error(e);
      logger.error(e.stack);
      return res.status(500).json({
        message: 'Ha ocurrido un error',
        status: 500
      });
    }
  }

  public async containerInventoryDetailExport(req: IRequest, res: Response) {
    try {
      const {
        shipFilter,
        tripFilter,
        containerFilter: container,
        blFilter,
        clientFilter,
        statusFilterSelected,
        filterHasDamage,
        sort,
        sortOption
      } = req.query;

      const venuesPermissions = req.user.venuesPermissions();

      let containerFilter: any = {
        $or: [
          { 'venue': { $in: venuesPermissions } },
          { 'venueFound': { $in: venuesPermissions } }
        ],
      };

      let inventories = await Inventory.find({
        team: req.user.team._id,
        containerInventory: true,
        venues: { $in: venuesPermissions }
      }, {
        _id: true,
        unitForm: true,
      });

      let carFilter: any = {};

      if (statusFilterSelected) {
        containerFilter['containerStatus'] = { $in: statusFilterSelected.toString().split(',') };
      } else {
        containerFilter['containerStatus'] = {
          $in: [
            ChoicesStatusContainer.pending,
            ChoicesStatusContainer.open,
            ChoicesStatusContainer.check,
            ChoicesStatusContainer.empty,
          ]
        };
      }

      if (filterHasDamage) {
        let damagedParticpants = await Participant.find({
          form: { $in: inventories.map((i: any) => i.unitForm) },
        }, { car: 1 });
        let damagedCars = await InventoryCar.find({
          car: { $in: damagedParticpants.map((p: any) => p.car) },
        }, { containerFound: 1 });

        containerFilter['_id'] = {
          $in: damagedCars.map((c: any) => c.containerFound)
        };
        carFilter['participant.hasDamages'] = true;
      }

      if (tripFilter) containerFilter['extra.N° Viaje'] = tripFilter;
      if (shipFilter) containerFilter['extra.Nave'] = shipFilter;
      if (container) containerFilter['extra.BIC'] = container;
      if (blFilter) containerFilter['extra.N° BL'] = blFilter;
      if (clientFilter) {
        let company = await Company.findOne({
          _id: new mongoose.Types.ObjectId(clientFilter.toString()),
        });
        containerFilter['extra.RUT Cliente'] = company?.rut;
      }

      let sortField: string = sort ? sort.toString() : 'createdAt';
      let sortDirection: -1 | 1 = sortOption === 'asc' ? 1 : -1;
      let sortObject: Record<string, 1 | -1> = {};
      sortObject[sortField] = sortDirection;

      logger.info(
        `InventoryController.containerInventoryDetailExport {email: ${req.user.email}, body: ${JSON.stringify(req.body)}}`
      );

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=detalle-unidades-contenedor.xlsx');
      res.setHeader('Transfer-Encoding', 'chunked');

      const workbook = new excel.stream.xlsx.WorkbookWriter({
        stream: res,
        useStyles: false,
        useSharedStrings: false
      });

      const worksheet = workbook.addWorksheet('Unidades');

      // Header
      worksheet.columns = [
        { header: 'F. Apertura', key: 'openDate', width: 20 },
        { header: 'F. Finalización', key: 'finishDate', width: 20 },
        { header: 'Contenedor', key: 'container', width: 25 },
        { header: 'Carga', key: 'vin', width: 15 },
        { header: 'Estado de carga', key: 'carStatus', width: 15 },
        { header: 'Descripción carga', key: 'description', width: 30 },
        { header: 'Daños', key: 'hasDamages', width: 30 },
        { header: 'Asistencia mecánica', key: 'accesories', width: 30 },
        { header: 'Cantidad asistencia mecánica', key: 'qty-accesories', width: 30 },
        { header: 'BL', key: 'bl', width: 20 },
        { header: 'Puerto', key: 'port', width: 20 },
        { header: 'Nave', key: 'ship', width: 20 },
        { header: 'Cliente', key: 'client', width: 25 },
        { header: 'Viaje', key: 'voyage', width: 15 },
        { header: 'Estado', key: 'status', width: 15 },
      ];
      let containerDateFilter: any = {};
      if (req.query.startDate && req.query.endDate) {
        let sDate = moment(req.query.startDate as string, 'YYYY-MM-DD').startOf('day').toDate();
        let eDate = moment(req.query.endDate as string, 'YYYY-MM-DD').endOf('day').toDate();
        containerDateFilter = {
          $or: [
            { 'openDate': { $gte: sDate, $lte: eDate } },
            { 'emptyDate': { $gte: sDate, $lte: eDate } },
            { 'createdAt': { $gte: sDate, $lte: eDate } }
          ]
        }
      }

      const BATCH_SIZE = 100;
      const containerPipeline = [
        { $match: { inventory: { $in: inventories.map((i: any) => i._id) } } },
        {
          $lookup: {
            from: 'cars',
            localField: 'car',
            foreignField: '_id',
            as: 'car',
          }
        },
        { $unwind: { path: '$car' } },
        { $match: { 'car.isContainer': true } },
        { $match: containerFilter },
        { $sort: sortObject },
        {
          $lookup: {
            from: 'inventoryfiles',
            localField: 'images',
            foreignField: '_id',
            as: 'images'
          }
        },
        {
          $lookup: {
            from: "venues",
            localField: "venue",
            foreignField: "_id",
            as: "venue",
            pipeline: [{ $project: { name: 1 } }]
          }
        },
        { $unwind: { path: '$venue', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "venues",
            localField: "venueFound",
            foreignField: "_id",
            as: "venueFound",
            pipeline: [{ $project: { name: 1 } }]
          }
        },
        {
          $addFields: {
            openEvidence: {
              $filter: {
                input: '$evidenceStatus',
                as: 'evidence',
                cond: { $eq: ['$$evidence.status', ChoicesStatusContainer.open] }
              }
            }
          }
        },
        {
          $addFields: {
            openDate: { $arrayElemAt: ['$openEvidence.date', 0] }
          }
        },
        {
          $addFields: {
            emptyEvidence: {
              $filter: {
                input: '$evidenceStatus',
                as: 'evidence',
                cond: { $eq: ['$$evidence.status', ChoicesStatusContainer.empty] }
              }
            }
          }
        },
        {
          $addFields: {
            emptyDate: { $arrayElemAt: ['$emptyEvidence.date', 0] }
          }
        },
        {
          $match: containerDateFilter
        },
        { $unwind: { path: '$venueFound', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            car: 1,
            images: 1,
            evidenceStatus: 1,
            status: 1,
            containerStatus: 1,
            venueFound: 1,
            venue: 1,
            extra: 1
          }
        }
      ];

      const containerCursor = InventoryCar.aggregate(containerPipeline).cursor();
      const containerMap = new Map<string, any>();
      let containerBatch: any[] = [];

      for (let container = await containerCursor.next(); container != null; container = await containerCursor.next()) {
        containerMap.set(container._id.toString(), container);
        containerBatch.push(container);

        if (containerBatch.length >= BATCH_SIZE) {
          await this.processContainerBatch(containerBatch, inventories, worksheet, containerMap, carFilter);
          containerBatch = [];
        }
      }

      if (containerBatch.length > 0) {
        await this.processContainerBatch(containerBatch, inventories, worksheet, containerMap, carFilter);
      }

      worksheet.commit();
      await workbook.commit();

      return;

    } catch (e) {
      logger.error(`containerInventoryDetailExport: Async Error.`);
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      logger.error(e);
      logger.error(e.stack);
      // Solo enviar respuesta de error si aún no se han enviado headers
      if (!res.headersSent) {
        return res.status(500).json({
          message: 'Ha ocurrido un error',
          status: 500
        });
      }
      return res.end();
    }
  }

  private async processContainerBatch(
    containers: any[],
    inventories: any[],
    worksheet: any,
    containerMap: Map<string, any>,
    carFilter: any
  ) {
    const containerIds = containers.map(c => c._id);
    let cars = await InventoryCar.aggregate([
      {
        $match: {
          inventory: { $in: inventories.map((i: any) => i._id) },
          $or: [
            { container: { $in: containerIds } },
            { containerFound: { $in: containerIds } }
          ],
        }
      },
      {
        $lookup: {
          from: 'cars',
          localField: 'car',
          foreignField: '_id',
          as: 'car'
        }
      },
      { $unwind: { path: '$car' } },
      {
        $lookup: {
          from: 'inventoryfiles',
          localField: 'images',
          foreignField: '_id',
          as: 'images'
        }
      },
      {
        $lookup: {
          from: 'participants',
          localField: 'participant',
          foreignField: '_id',
          as: 'participant',
          pipeline: [{ $project: { name: 1, hasDamages: 1, 'sections.answers.kind': 1, 'sections.answers.accesoriesAnswered': 1, 'sections.answers.accessories': 1 } }]
        }
      },
      {
        $unwind: { path: '$participant', preserveNullAndEmptyArrays: true }
      },
      {
        $match: carFilter
      }
    ]);

    for (const car of cars) {
      let containerId = car.containerFound ? car.containerFound.toString() : (car.container ? car.container.toString() : null);
      let container = containerId ? containerMap.get(containerId) : null;

      let openDate = '';
      if (container && container.evidenceStatus && container.evidenceStatus.length > 0) {
        const openEvidence = container.evidenceStatus.find((e: any) => e.status === 'open');
        if (openEvidence && openEvidence.date) {
          openDate = new Date(openEvidence.date).toLocaleDateString('es-ES');
        }
      }

      let finishDate = '';
      if (container && container.containerStatus === 'empty') {
        const emptyEvidence = container.evidenceStatus?.find((e: any) => e.status === 'empty');
        if (emptyEvidence && emptyEvidence.date) {
          finishDate = new Date(emptyEvidence.date).toLocaleDateString('es-ES');
        }
      }

      const accessories = car?.participant ?
        this.getAccessories(car?.participant) :
        null;

      worksheet.addRow({
        openDate: openDate,
        finishDate: finishDate,
        container: container ? container.car.vin : '',
        vin: car.car.vin,
        carStatus: statusMap[car.status] || '',
        description: `${car.car.brand} ${car.car.model || ''}`,
        hasDamages: car.participant && car.participant.hasDamages ? 'Sí' : 'No',
        accesories: accessories?.accessoriesText || '',
        'qty-accesories': accessories?.accessoriesTotal || '',
        bl: container && container.extra ? container.extra['N° BL'] || '' : '',
        port: container && container.venue ? container.extra['Emplazamiento'] : '',
        ship: container && container.extra ? container.extra.Nave || '' : '',
        client: container && container.extra ? container.extra['Cliente Razón Social'] || '' : '',
        voyage: container && container.extra ? container.extra['N° Viaje'] || '' : '',
        status: container ? statusMap[container.containerStatus] : '',
      }).commit();
    }
  }

  private getAccessories(participant: IParticipant) {
    let response = {
      accessoriesTotal: 0,
      accessoriesText: ''
    };
    if (!participant || !participant.sections) {
      return response;
    }

    for (const section of participant.sections) {
      for (const answer of section.answers) {
        if (answer.kind === KindQuestion.accessory) {
          let itemsDict = this.createObjectFromItems(answer.accessories.items || []);
          response.accessoriesText = answer.accesoriesAnswered
            .map((item) => `${itemsDict[item.item]} ${item.amount > 0 ? item.amount : ""}`)
            .join(';')
          response.accessoriesTotal = answer.accesoriesAnswered.reduce((sum, item) => sum + (item.amount || 1), 0);
        }
      }
    }
    return response;
  }

  private createObjectFromItems(items: any[]) {
    let dict: any = {};
    items.map((item) => {
      return (dict[item._id.toString()] = item.item);
    });
    return dict;
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
                  path: 'participant',
                  select: ['hasDamages']
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
                {
                  path: 'units.participant',
                  select: ['name', 'hasDamages', 'createdAt', 'deliveryInfo'],
                },
                {
                  path: 'units.images',
                },
                {
                  path: "closeParticipant",
                  select: ['name', 'hasDamages', 'createdAt', 'deliveryInfo', 'user'],
                  populate: [
                    { path: 'user', select: ['firstName', 'lastName', 'email'] }
                  ]
                }
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
            },
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
      if (container.evidenceStatus && container.evidenceStatus.length > 0) {
        const statusList = container.evidenceStatus.map((evidence: any) => evidence.status);
        if (statusList.includes('empty')) {
          status = 'empty';
        } else if (statusList.includes('check')) {
          status = 'check';
        } else if (statusList.includes('open')) {
          status = 'open';
        } else {
          status = container.status;
        }
      }
      return status;
    }

    try {
      const container = await InventoryCar.findOne({
        car: new mongoose.Types.ObjectId(carId),
        inventory: new mongoose.Types.ObjectId(inventoryId)
      }).populate([
        { path: 'inventoriedBy' },
        { path: 'images' },
        { path: 'inventory', select: ['name', 'contentType'] },
        { path: 'venueFound' },
        { path: 'car', populate: [{ path: 'company', select: ['name', 'image'] }] },
        { path: 'participant' },
        { path: 'evidenceStatus.images' },
        { path: 'evidenceStatus.images.comment' },
        { path: 'files' },
        { path: 'units.images' },
        {
          path: 'units.participant',
          populate: [
            {
              path: 'deliveryInfo',
              populate: [{ path: 'damageImages' }],
            },
            {
              path: 'user'
            },
          ],
          select: ['_id', 'createdAt', 'hasDamages', 'deliveryInfo']
        },
        {
          path: 'closeParticipant',
        },
        {
          path: 'openParticipant',
          populate: [{ path: 'company' }]
        }
      ]).lean();

      if (!container) {
        return res.status(404).json({
          message: 'No se ha encontrado el contenedor',
          status: 404
        });
      }

      logger.debug(JSON.stringify(container.evidenceStatus));
      logger.debug(JSON.stringify(container.evidenceStatus.length));

      let evidences = container.evidenceStatus.length ?
        container.evidenceStatus
          .filter((e: any) => e.status != 'empty')
          .map((e: any) => e.images)
          .flat() :
        container.images;

      logger.debug(JSON.stringify(evidences));
      logger.debug(JSON.stringify(evidences.length));

      let emptyEvidences = container.evidenceStatus.length ? container.evidenceStatus.filter((e: any) => e.status == 'empty').map(e => e.images).flat() : [];
      let lastEmptyComment = emptyEvidences.map((e: any) => e.comment).reverse();

      let evidenceStatusMap: Record<string, { images: any[], hasDamage: boolean }> = {
        "open": { images: [], hasDamage: false },
        "check": { images: [], hasDamage: false },
        "empty": { images: [], hasDamage: false },
      };

      container.evidenceStatus.forEach((evidence: any) => {
        let hasDamage = false;
        evidence.images.forEach((image: any) => {
          if (image.showDamage && image.showDamage === true) {
            hasDamage = true;
          }
        });
        if (evidenceStatusMap[evidence.status]) {
          evidenceStatusMap[evidence.status].images = [
            ...evidenceStatusMap[evidence.status].images,
            ...evidence.images
          ];
          evidenceStatusMap[evidence.status].hasDamage = evidenceStatusMap[evidence.status].hasDamage || hasDamage;
        } else {
          evidenceStatusMap[evidence.status] = {
            images: evidence.images,
            hasDamage
          };
        }
      });

      let statusContainer = inventorySettings[foundStatusContainer(container)];
      container.status = statusContainer;


      let cars = await InventoryCar.find({
        containerFound: container._id
      }).populate([
        { path: 'inventoriedBy' },
        { path: 'images' },
        { path: 'venueFound' },
        {
          path: 'participant',
          populate: [
            {
              path: 'sections.answers.damagesSelected.kind',
              model: 'Kind'
            },
            {
              path: 'sections.answers.damagesSelected.part',
              model: 'Part'
            },
            {
              path: 'sections.answers.damagesSelected.position',
              model: 'Position'
            },
            {
              path: 'sections.answers.damagesSelected.images',
            },
            {
              path: 'deliveryInfo',
            }
          ]
        },
        { path: 'car', populate: [{ path: 'company', select: ['name', 'image'] }] },
        { path: 'evidenceStatus.images' },
        { path: 'files' }
      ]).lean();

      logger.debug(JSON.stringify(cars));

      cars = cars.map((tmp: any) => {
        tmp.damages = [];
        tmp?.participant?.sections.map((section: any) => {
          section.answers.map((answer: any) => {
            if (answer.kind === 'damage') {
              answer.damagesSelected.map((damage: any) => {
                tmp.damages.push(damage);
              })
            }
          })
        })
        let status = inventorySettings[foundStatusContainer(tmp)];
        return {
          ...tmp,
          status
        }
      })

      let urlTemplate;
      switch (container.inventory && (container.inventory as IInventory).contentType) {
        case ContainerInventoryContentType.general_items:
          urlTemplate = 'container/pdf/general-items.pug';
          break;
        case ContainerInventoryContentType.coded_items:
          urlTemplate = 'container/pdf/coded-items.pug';
          break;
        default:
          urlTemplate = 'container/pdf/coded-items.pug';
      }

      if (!container.openParticipant || !container.closeParticipant) {
        urlTemplate = 'container/pdf/coded-items.pug';
      }

      let template: string =
        path.join(__dirname, '../../../views/') + urlTemplate;
      const css = fs.readFileSync(
        path.join(__dirname, '../../../views/') + 'container/pdf/styles.css',
        'utf8'
      );

      req.user.company = await Company.findById(req.user.company._id).populate({ path: 'clientCompanies', select: ['name', 'rut', 'image'] });

      // Determine client company: first try from non-container cars, then match by RUT from extra field
      let clientCompany: any = null;
      const clientCarWithCompany = cars.find((c: any) => c.car && !c.car.isContainer && c.car.company);
      if (clientCarWithCompany) {
        clientCompany = clientCarWithCompany.car.company;
      } else {
        const clientCompanies = (req.user.company.clientCompanies as any[]) || [];
        console.log('container extra fields:', container.extra);
        const rutCliente = ((container as any).extra?.['RUT Cliente'] || '').trim().toLowerCase();
        if (rutCliente) {
          clientCompany = clientCompanies.find(
            (c: any) => (c.rut || '').trim().toLowerCase() === rutCliente
          ) || null;
        }
        if (!clientCompany && clientCompanies.length === 1) {
          clientCompany = clientCompanies[0];
        }
        console.log('Determined client company:', clientCompany ? clientCompany.name : 'None');
      }

      // Convert client company logo to base64 so Puppeteer doesn't need S3 access
      if (clientCompany && clientCompany.image && clientCompany.image.url) {
        try {
          const axios = require('axios');
          const response = await axios.get(clientCompany.image.url, { responseType: 'arraybuffer' });
          const mimeType = clientCompany.image.type || 'image/jpeg';
          const dataUri = `data:${mimeType};base64,${Buffer.from(response.data).toString('base64')}`;
          clientCompany = { ...clientCompany, image: { ...clientCompany.image, url: dataUri } };
        } catch (e) {
          console.log('Could not fetch client company logo for PDF:', e.message);
        }
      }

      const html = GeneralUtils.generateHtmlFromPugFile(template, {
        css: css.replace(/(\r\n|\n|\r)/gm, ''),
        moment,
        cars,
        container,
        evidences,
        emptyEvidences,
        evidenceStatusMap,
        lastEmptyComment,
        userName: `${GeneralUtils.capitalizeFirstLetter(req.user.firstName)} ${GeneralUtils.capitalizeFirstLetter(req.user.lastName)}`,
        user: req.user,
        clientCompany,
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
          headerTemplate: `
         <div></div>
            `,
          footerTemplate: `
            <div class="footer" style="width: 100%; font-size: 8px; padding: 30px; display: flex; justify-content: space-between; align-items: baseline;">
              <div>${container.venueFound?.code || 'Dirección no disponible'}</div>
              <div>Página <span class="pageNumber"></span> / <span class="totalPages"></span></div>
              <div style="color: #999; display: flex; align-items: baseline;">
              Powered by
              ${OSA_LOGO_SVG}
              www.osacontrol.com
              </div>
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

  /*public async currentCompanyStockSummary(req: IRequest, res: Response): Promise<any> {
    try {
      const { company } = req.user; // user request company
      let { companyId } = req.params; //filter param company
      const { page, pageSize, sort } = req.query as Record<string, string>;
    }

  }*/



  public async currentCompanyStock(req: IRequest, res: Response): Promise<any> {
    try {
      const { company } = req.user; // user request company
      let { companyId } = req.params; //filter param company
      const { page, pageSize, sortColumn, sortDirection } = req.query as Record<string, string>;
      const { shipFilter, tripFilter, containerFilter, blFilter, statusFilter, filterHasDamage, startDate, endDate, venueFilter, unitFilter } = req.query;

      let filterCompanies: any = null;
      let userCompany = await Company.findById(company._id);

      if (userCompany?.handler && userCompany.clientCompanies?.includes(companyId)) {
        // for handler Companies
        filterCompanies = {
          $and: [{
            company: new Types.ObjectId(companyId),
            handlerCompany: new Types.ObjectId(company._id),
          }]
        }
      } else {
        //for clients
        if (company._id != companyId && !req.user.companiesAccess.map(c => c._id).includes(companyId)) {
          return res.status(403).json({
            message: 'No tienes acceso a este inventario',
            status: 403
          });
        }
        filterCompanies = {
          company: new Types.ObjectId(companyId),
          handlerCompany: { $exists: true },
        }
      }
      if (unitFilter) {
        filterCompanies['vin'] = { $regex: unitFilter.toString(), $options: 'i' };
      }

      let cars = await Car.aggregate([
        { $match: filterCompanies },
        { $project: { _id: 1 } }
      ]);
      let inventoryCars: any[] | null = null

      let statusFiletr: any = {}
      let damageFilter: any = {}

      let inventoryCarFilter: any = {}
      let inventoryCarDamageFilter: any = {}

      if (statusFilter) {
        statusFiletr['status'] = statusFilter.toString()
      } else {
        statusFiletr['status'] = {
          $in: ['inTransit', 'readyToClient']
        }
      }

      if (filterHasDamage?.toString() === "true") {
        inventoryCarDamageFilter['participant.hasDamage'] = true;
        damageFilter['participant.hasDamage'] = true;
      }

      if (tripFilter) {
        inventoryCarFilter['extra.N° Viaje'] = { $regex: tripFilter.toString(), $options: 'i' };
      }

      if (shipFilter) {
        inventoryCarFilter['extra.Nave'] = { $regex: shipFilter.toString(), $options: 'i' };
      }

      if (containerFilter) {
        inventoryCarFilter['extra.BIC'] = { $regex: containerFilter.toString(), $options: 'i' };
      }

      if (blFilter) {
        inventoryCarFilter['extra.N° BL'] = { $regex: blFilter.toString(), $options: 'i' };
      }

      if (venueFilter) {
        const venueNames = venueFilter.toString().split(',').map(name => name.trim());
        const venues = await Venue.find({ name: { $in: venueNames } }, { _id: 1 });
        const venueIds = venues.map(v => v._id);
        inventoryCarFilter['venue'] = { $in: venueIds };
      }

      if (Object.keys(inventoryCarFilter).length > 0) {
        let pipeline: any[] = [
          {
            $match: {
              ...inventoryCarFilter,
              car: { $in: cars.map((c: any) => c._id) },
            }
          },
        ]
        if (Object.keys(inventoryCarDamageFilter).length > 0) {
          pipeline.concat([{
            $lookup: {
              from: 'participants',
              localField: 'participant',
              foreignField: '_id',
              as: 'participant'
            }
          }, {
            $unwind: { path: "$participant", preserveNullAndEmptyArrays: true }
          }, {
            $match: inventoryCarDamageFilter
          }
          ])
        }
        pipeline.push({
          $project: {
            car: 1
          }
        });
        inventoryCars = await InventoryCar.aggregate(pipeline);
      }

      let paginateResult = null;

      // --- Ordenamiento ---
      let sortOptionAggregation: any = { createdAt: -1 }; // Ordenamiento por defecto
      if (sortColumn) {
        let direction = sortDirection === 'asc' ? 1 : -1; // Convertir a número para Mongoose

        if (sortColumn.trim() === 'F. Descarga') {
          sortOptionAggregation = { 'readyToClientHistories.executedAt': direction };
        } else if (sortColumn.trim() === 'F. Despacho') {
          sortOptionAggregation = { 'inTransitHistories.executedAt': direction };
        } else if (sortColumn.trim() === 'Estado') {
          sortOptionAggregation = { 'inTransitHistories.executedAt': direction };
        }
      }

      if (filterCompanies) {
        const options: PaginateOptions = {
          select: {
            name: true,
            updatedAt: true,
            createdAt: true
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
          // allowDiskUse: true, //TODO: revisar si es necesario para los volumenes de datos
          lean: true,
          page: parseInt(page ? page : '1', 10),
          limit: parseInt(pageSize ? pageSize : '10', 10)
        };

        logger.info(`Paginating with options: ${JSON.stringify(options)}`);

        let pipeline: any[] = [];
        if (Object.keys(damageFilter).length > 0) {
          pipeline = [
            {
              $match: {
                car: { $in: cars.map((c: any) => c._id) },
                ...statusFiletr,
              }
            },
            {
              $lookup: {
                from: 'participants',
                localField: 'participant',
                foreignField: '_id',
                as: 'participant',
                pipeline: [
                  { $project: { hasDamages: 1 } }
                ]
              }
            },
            { $unwind: { path: "$participant", preserveNullAndEmptyArrays: true } },
            {
              $match: {
                $or: [
                  { "participant.hasDamages": true },
                  { car: { $in: inventoryCars ? inventoryCars.map(ic => ic.car) : [] } }
                ]
              }
            }
          ]
        } else {
          pipeline = [
            {
              $match: inventoryCars ?
                {
                  car: { $in: inventoryCars ? inventoryCars.map(ic => ic.car) : [] },
                  ...statusFiletr,
                } :
                {
                  car: { $in: cars.map((c: any) => c._id) },
                  ...statusFiletr
                }
            }
          ]
        }
        pipeline = pipeline.concat([
          {
            $group: {
              _id: '$car',
              lastCreatedAt: {
                $max: '$createdAt'
              },
            }
          }, {
            $sort: {
              lastCreatedAt: -1 // Sort by the latest createdAt date
            }
          }
        ])

        let histories = await History.aggregate(pipeline);

        let dateFilter: any = {};
        if (startDate && endDate) {
          let sDate = moment(req.query.startDate as string, 'YYYY-MM-DD').startOf('day').toDate();
          let eDate = moment(req.query.endDate as string, 'YYYY-MM-DD').endOf('day').toDate();
          dateFilter = {
            $or: [
              {
                'inTransitHistories.executedAt': {
                  $gte: sDate,
                  $lte: eDate
                }
              },
              {
                'readyToClientHistories.executedAt': {
                  $gte: sDate,
                  $lte: eDate
                }
              }
            ]
          };
        }
        logger.info(`Found ${histories.length} histories for the given filters.`);
        logger.info(`Paginating results with options: ${JSON.stringify(options)}`);

        let carsHistories = histories.map((h: any) => h._id);

        // Inicia el pipeline de agregación de Car
        const carAggregationPipeline: any[] = [
          { $match: { ...filterCompanies, _id: { $in: carsHistories } } },
          {
            $lookup: {
              from: 'histories',
              let: { carId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$car', '$$carId'] },
                        { $eq: ['$status', 'inTransit'] }, // Specific status filter
                      ]
                    }
                  }
                },
                {
                  $lookup: {
                    from: 'inventorycars',
                    localField: 'inventoryCar',
                    foreignField: '_id',
                    as: 'inventoryCar'
                  }
                },
                {
                  $unwind: {
                    path: '$inventoryCar',
                    preserveNullAndEmptyArrays: true
                  }
                },
                // Populate inventoryCar.containerFound for inTransit histories
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
                // Populate inventoryCar.venue for inTransit histories
                {
                  $lookup: {
                    from: 'venues',
                    localField: 'inventoryCar.venue',
                    foreignField: '_id',
                    as: 'inventoryCar.venue'
                  }
                },
                {
                  $unwind: {
                    path: '$inventoryCar.venue',
                    preserveNullAndEmptyArrays: true
                  }
                },
                // Populate history.participant for inTransit histories
                {
                  $lookup: {
                    from: 'participants',
                    localField: 'participant',
                    foreignField: '_id',
                    as: 'participant'
                  }
                },
                {
                  $unwind: {
                    path: '$participant',
                    preserveNullAndEmptyArrays: true
                  }
                },
                // Populate inventoryCar.participant for inTransit histories
                {
                  $lookup: {
                    from: 'participants',
                    localField: 'inventoryCar.participant',
                    foreignField: '_id',
                    as: 'inventoryCar.participant'
                  }
                },
                {
                  $unwind: {
                    path: '$inventoryCar.participant',
                    preserveNullAndEmptyArrays: true
                  }
                }
              ],
              as: 'inTransitHistories' // Store as a separate array for inTransit histories
            }
          },
          { '$unwind': { 'path': '$inTransitHistories', 'preserveNullAndEmptyArrays': true } },
          {
            $lookup: {
              from: 'histories',
              let: { carId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$car', '$$carId'] },
                        { $eq: ['$status', 'readyToClient'] }, // Specific status filter
                      ]
                    }
                  }
                },
                // Populate inventoryCar for readyToClient histories
                {
                  $lookup: {
                    from: 'inventorycars',
                    localField: 'inventoryCar',
                    foreignField: '_id',
                    as: 'inventoryCar'
                  }
                },
                {
                  $unwind: {
                    path: '$inventoryCar',
                    preserveNullAndEmptyArrays: true
                  }
                },
                // Populate inventoryCar.containerFound for readyToClient histories
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
                // Populate inventoryCar.venue for readyToClient histories
                {
                  $lookup: {
                    from: 'venues',
                    localField: 'inventoryCar.venue',
                    foreignField: '_id',
                    as: 'inventoryCar.venue'
                  }
                },
                {
                  $unwind: {
                    path: '$inventoryCar.venue',
                    preserveNullAndEmptyArrays: true
                  }
                },
                // Populate history.participant for readyToClient histories
                {
                  $lookup: {
                    from: 'participants',
                    localField: 'participant',
                    foreignField: '_id',
                    as: 'participant'
                  }
                },
                {
                  $unwind: {
                    path: '$participant',
                    preserveNullAndEmptyArrays: true
                  }
                },
                // Populate inventoryCar.participant for readyToClient histories
                {
                  $lookup: {
                    from: 'participants',
                    localField: 'inventoryCar.participant',
                    foreignField: '_id',
                    as: 'inventoryCar.participant'
                  }
                },
                {
                  $unwind: {
                    path: '$inventoryCar.participant',
                    preserveNullAndEmptyArrays: true
                  }
                }
              ],
              as: 'readyToClientHistories' // Store as a separate array for readyToClient histories
            }
          },
          {
            $unwind: { 'path': '$readyToClientHistories' }
          },
          {
            $match: dateFilter
          },
          {
            $addFields: {
              // Concatenate the two history arrays
              histories: ['$inTransitHistories', '$readyToClientHistories']
            }
          },
          { $sort: sortOptionAggregation },
        ];

        paginateResult = await Car.aggregatePaginate(Car.aggregate(carAggregationPipeline), options);

        /*paginateResult.total = histories.length;
        paginateResult.pages = Math.ceil(paginateResult.total / options.limit!);
        paginateResult.hasPrevious = paginateResult.currentPage! > 1;
        paginateResult.hasNextPage = paginateResult.currentPage! < paginateResult.pages;
        */
      }

      return res.status(200).json({
        cars: paginateResult?.docs,
        count: paginateResult?.total,
        pages: paginateResult?.pages,
        hasPrevious: paginateResult?.hasPrevious,
        hasNextPage: paginateResult?.hasNextPage,
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

  public async currentCompanyStockSummary(req: IRequest, res: Response): Promise<any> {
    try {
      const { company } = req.user;
      let { companyId } = req.params;

      // Verificar permisos de acceso a la compañía
      let filterCompanies: any = null;
      let userCompany = await Company.findById(company._id);

      if (userCompany?.handler && userCompany.clientCompanies?.includes(companyId)) {
        filterCompanies = {
          company: new Types.ObjectId(companyId),
          handlerCompany: new Types.ObjectId(company._id),
        }
      } else {
        if (company._id != companyId && !req.user.companiesAccess.map(c => c._id).includes(companyId)) {
          return res.status(403).json({
            message: 'No tienes acceso a este inventario',
            status: 403
          });
        }
        filterCompanies = {
          company: new Types.ObjectId(companyId),
          handlerCompany: { $exists: true },
        }
      }

      // Obtener cars de la compañía
      let cars = await Car.aggregate([
        { $match: filterCompanies },
        { $project: { _id: 1 } }
      ]);

      let carIds = cars.map((c: any) => c._id);

      // Obtener ships únicos
      let ships = await InventoryCar.aggregate([
        { $match: { car: { $in: carIds } } },
        { $group: { _id: '$extra.Nave' } },
        { $match: { _id: { $ne: null } } },
        { $sort: { _id: 1 } }
      ]);

      // Obtener trips únicos
      let trips = await InventoryCar.aggregate([
        { $match: { car: { $in: carIds } } },
        { $group: { _id: '$extra.N° Viaje' } },
        { $match: { _id: { $ne: null } } },
        { $sort: { _id: 1 } }
      ]);

      // Obtener venues únicos (venue o venueFound)
      let venues = await InventoryCar.aggregate([
        { $match: { car: { $in: carIds } } },
        {
          $lookup: {
            from: 'venues',
            localField: 'venue',
            foreignField: '_id',
            as: 'venue'
          }
        },
        { $unwind: { path: '$venue', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'venues',
            localField: 'venueFound',
            foreignField: '_id',
            as: 'venueFound'
          }
        },
        { $unwind: { path: '$venueFound', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            venue: {
              $cond: {
                if: { $ne: ['$venueFound', null] },
                then: '$venueFound',
                else: '$venue'
              }
            }
          }
        },
        { $match: { 'venue._id': { $ne: null } } },
        { $group: { _id: '$venue._id', name: { $first: '$venue.name' } } },
        { $sort: { name: 1 } }
      ]);

      // Obtener información de la compañía
      let companyInfo = await Company.findById(companyId, {
        _id: 1,
        name: 1,
        rut: 1
      });

      return res.status(200).json({
        ships: ships.map(s => s._id),
        trips: trips.map(t => t._id),
        venues: venues.map(v => v.name),
        company: companyInfo,
        status: 200
      });

    } catch (e) {
      logger.error(`InventoryController.currentCompanyStockSummary: Error.`);
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      logger.error(e);
      return res.status(500).json({
        message: JSON.stringify(e),
        status: 500
      });
    }
  }

  public async currentCompanyStockExport(req: IRequest, res: Response): Promise<any> {
    try {
      const { company } = req.user; // user request company
      let { companyId } = req.params; //filter param company
      const { sortColumn, sortDirection } = req.query as Record<string, string>;
      const { shipFilter, tripFilter, containerFilter, blFilter, statusFilter, filterHasDamage, startDate, endDate } = req.query;

      let filterCompanies: any = null;
      let userCompany = await Company.findById(company._id);

      if (userCompany?.handler && userCompany.clientCompanies?.includes(companyId)) {
        // for handler Companies
        filterCompanies = {
          $and: [{
            company: new Types.ObjectId(companyId),
            handlerCompany: new Types.ObjectId(company._id),
          }]
        }
      } else {
        //for clients
        if (company._id != companyId && !req.user.companiesAccess.map(c => c._id).includes(companyId)) {
          return res.status(403).json({
            message: 'No tienes acceso a este inventario',
            status: 403
          });
        }
        filterCompanies = {
          company: new Types.ObjectId(companyId),
          handlerCompany: { $exists: true },
        }
      }

      let cars = await Car.aggregate([
        { $match: filterCompanies },
        { $project: { _id: 1 } }
      ]);
      let inventoryCars: any[] | null = null

      let statusFiletr: any = {}
      let damageFilter: any = {}

      let inventoryCarFilter: any = {}
      let inventoryCarDamageFilter: any = {}

      if (statusFilter) {
        statusFiletr['status'] = statusFilter.toString()
      } else {
        statusFiletr['status'] = {
          $in: ['inTransit', 'readyToClient']
        }
      }

      if (filterHasDamage?.toString() === "true") {
        inventoryCarDamageFilter['participant.hasDamage'] = true;
        damageFilter['participant.hasDamage'] = true;
      }

      if (tripFilter) {
        inventoryCarFilter['extra.N° Viaje'] = { $regex: tripFilter.toString(), $options: 'i' };
      }

      if (shipFilter) {
        inventoryCarFilter['extra.Nave'] = { $regex: shipFilter.toString(), $options: 'i' };
      }

      if (containerFilter) {
        inventoryCarFilter['extra.BIC'] = { $regex: containerFilter.toString(), $options: 'i' };
      }

      if (blFilter) {
        inventoryCarFilter['extra.N° BL'] = blFilter;
      }

      if (Object.keys(inventoryCarFilter).length > 0) {
        let pipeline: any[] = [
          {
            $match: {
              ...inventoryCarFilter,
              car: { $in: cars.map((c: any) => c._id) },
            }
          },
        ]
        if (Object.keys(inventoryCarDamageFilter).length > 0) {
          pipeline = pipeline.concat([{
            $lookup: {
              from: 'participants',
              localField: 'participant',
              foreignField: '_id',
              as: 'participant'
            }
          }, {
            $unwind: { path: "$participant", preserveNullAndEmptyArrays: true }
          }, {
            $match: inventoryCarDamageFilter
          }
          ])
        }
        pipeline.push({
          $project: {
            car: 1
          }
        });
        inventoryCars = await InventoryCar.aggregate(pipeline);
      }

      // --- Ordenamiento ---
      let sortOptionAggregation: any = { createdAt: -1 }; // Ordenamiento por defecto
      if (sortColumn) {
        let direction = sortDirection === 'asc' ? 1 : -1; // Convertir a número para Mongoose

        if (sortColumn.trim() === 'F. Descarga') {
          sortOptionAggregation = { 'readyToClientHistories.executedAt': direction };
        } else if (sortColumn.trim() === 'F. Despacho') {
          sortOptionAggregation = { 'inTransitHistories.executedAt': direction };
        } else if (sortColumn.trim() === 'Estado') {
          sortOptionAggregation = { 'inTransitHistories.executedAt': direction };
        }
      }

      if (filterCompanies) {
        let pipeline: any[] = [];
        if (Object.keys(damageFilter).length > 0) {
          pipeline = [
            {
              $match: {
                ...filterCompanies,
                ...statusFiletr,
              }
            },
            {
              $lookup: {
                from: 'participants',
                localField: 'participant',
                foreignField: '_id',
                as: 'participant',
                pipeline: [
                  { $project: { hasDamages: 1 } }
                ]
              }
            },
            { $unwind: { path: "$participant", preserveNullAndEmptyArrays: true } },
            {
              $match: {
                $or: [
                  { "participant.hasDamages": true },
                  { car: { $in: inventoryCars ? inventoryCars.map(ic => ic.car) : [] } }
                ]
              }
            }
          ]
        } else {
          pipeline = [
            {
              $match: inventoryCars ?
                {
                  car: { $in: inventoryCars ? inventoryCars.map(ic => ic.car) : [] },
                  ...statusFiletr,
                } :
                {
                  ...filterCompanies,
                  ...statusFiletr
                }
            }
          ]
        }
        pipeline = pipeline.concat([
          {
            $group: {
              _id: '$car',
              lastCreatedAt: {
                $max: '$createdAt'
              },
            }
          }, {
            $sort: {
              lastCreatedAt: -1 // Sort by the latest createdAt date
            }
          }
        ])

        let histories = await History.aggregate(pipeline);

        let dateFilter: any = {};
        if (startDate && endDate) {
          let sDate = moment(req.query.startDate as string, 'YYYY-MM-DD').startOf('day').toDate();
          let eDate = moment(req.query.endDate as string, 'YYYY-MM-DD').endOf('day').toDate();
          dateFilter = {
            $or: [
              {
                'inTransitHistories.executedAt': {
                  $gte: sDate,
                  $lte: eDate
                }
              },
              {
                'readyToClientHistories.executedAt': {
                  $gte: sDate,
                  $lte: eDate
                }
              }
            ]
          };
        }

        let cars = histories.map((h: any) => h._id);

        // Configurar headers para el Excel stream
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=inventario-unidades.xlsx');
        res.setHeader('Transfer-Encoding', 'chunked');

        const workbook = new excel.stream.xlsx.WorkbookWriter({
          stream: res,
          useStyles: false,
          useSharedStrings: false
        });

        const worksheet = workbook.addWorksheet('Inventario');

        // Definir headers del Excel
        worksheet.columns = [
          { header: 'Código de unidad', key: 'vin', width: 20 },
          { header: 'Marca', key: 'brand', width: 15 },
          { header: 'Modelo', key: 'model', width: 20 },
          { header: 'Daños', key: 'hasDamage', width: 10 },
          { header: 'Asistencia mecánica', key: 'accesories', width: 30 },
          { header: 'Cantidad Asistencia', key: 'qty-accesories', width: 30 },
          { header: 'Contenedor', key: 'container', width: 25 },
          { header: 'BL', key: 'bl', width: 20 },
          { header: 'Nave', key: 'ship', width: 20 },
          { header: 'Sucursal', key: 'venue', width: 20 },
          { header: 'Nave', key: 'ship', width: 20 },
          { header: 'F. Descarga', key: 'readyToClientDate', width: 20 },
          { header: 'F. Despacho', key: 'inTransitDate', width: 20 },
          { header: 'Estado', key: 'status', width: 15 },
        ];

        // Pipeline de agregación para obtener los datos con cursor
        const carAggregationPipeline: any[] = [
          { $match: { ...filterCompanies, _id: { $in: cars } } },
          {
            $lookup: {
              from: 'histories',
              let: { carId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$car', '$$carId'] },
                        { $eq: ['$status', 'inTransit'] },
                      ]
                    }
                  }
                },
                {
                  $lookup: {
                    from: 'participants',
                    localField: 'participant',
                    foreignField: '_id',
                    as: 'participant'
                  }
                },
                {
                  $unwind: {
                    path: '$participant',
                    preserveNullAndEmptyArrays: true
                  }
                },
                {
                  $lookup: {
                    from: 'venues',
                    localField: 'participant.venue',
                    foreignField: '_id',
                    as: 'participant.venue'
                  }
                },
                {
                  $unwind: {
                    path: '$participant.venue',
                    preserveNullAndEmptyArrays: true
                  }
                },
                {
                  $lookup: {
                    from: 'cars',
                    localField: 'inventoryCar.containerFound.car',
                    foreignField: '_id',
                    as: 'containerCar'
                  }
                },
                {
                  $unwind: {
                    path: '$containerCar',
                    preserveNullAndEmptyArrays: true
                  }
                }
              ],
              as: 'inTransitHistories'
            }
          },
          { '$unwind': { 'path': '$inTransitHistories', 'preserveNullAndEmptyArrays': true } },
          {
            $lookup: {
              from: 'histories',
              let: { carId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$car', '$$carId'] },
                        { $eq: ['$status', 'readyToClient'] },
                      ]
                    }
                  }
                },
                {
                  $lookup: {
                    from: 'inventorycars',
                    localField: 'inventoryCar',
                    foreignField: '_id',
                    as: 'inventoryCar'
                  }
                },
                {
                  $unwind: {
                    path: '$inventoryCar',
                    preserveNullAndEmptyArrays: true
                  }
                },
                {
                  $lookup: {
                    from: 'participants',
                    localField: 'inventoryCar.participant',
                    foreignField: '_id',
                    as: 'inventoryCar.participant'
                  }
                },
                { $unwind: { path: '$inventoryCar.participant', preserveNullAndEmptyArrays: true } },
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
                    localField: 'inventoryCar.venueFound',
                    foreignField: '_id',
                    as: 'inventoryCar.venueFound'
                  }
                },
                {
                  $unwind: {
                    path: '$inventoryCar.venueFound',
                    preserveNullAndEmptyArrays: true
                  }
                },
                {
                  $lookup: {
                    from: 'cars',
                    localField: 'inventoryCar.containerFound.car',
                    foreignField: '_id',
                    as: 'containerCar'
                  }
                },
                {
                  $unwind: {
                    path: '$containerCar',
                    preserveNullAndEmptyArrays: true
                  }
                }
              ],
              as: 'readyToClientHistories'
            }
          },
          {
            $unwind: { 'path': '$readyToClientHistories', 'preserveNullAndEmptyArrays': true }
          },
          {
            $match: dateFilter
          },
          { $sort: sortOptionAggregation },
          {
            $project: {
              _id: 1,
              vin: 1,
              brand: 1,
              denomination: 1,
              model: 1,
              inTransitHistory: '$inTransitHistories',
              readyToClientHistory: '$readyToClientHistories'
            }
          }
        ];

        // Usar cursor para procesar los datos de forma streaming
        const carCursor = Car.aggregate(carAggregationPipeline).cursor();

        logger.info(`Starting Excel export for company ${companyId}`);

        let processedCount = 0;
        for (let car = await carCursor.next(); car != null; car = await carCursor.next()) {
          try {
            const getStatus = (inTransitHistory: any, readyToClientHistory: any) => {
              if (readyToClientHistory && readyToClientHistory.executedAt) {
                return 'Listo para cliente';
              } else if (inTransitHistory && inTransitHistory.executedAt) {
                return 'En tránsito';
              }
              return 'Desconocido';
            };

            // Formatear fechas
            const formatDate = (date: any) => {
              if (!date) return '';
              return new Date(date).toLocaleDateString('es-ES');
            };

            // Obtener datos del contenedor y BL
            const getContainerInfo = (history: any) => {
              if (history && history.inventoryCar && history.inventoryCar.containerFound) {
                return {
                  container: history.containerCar ? history.containerCar.vin : '',
                  bl: history.inventoryCar.extra ? history.inventoryCar.extra['N° BL'] || '' : ''
                };
              }
              return { container: '', bl: '' };
            };

            const containerInfo = getContainerInfo(car.inTransitHistory || car.readyToClientHistory);
            const venue = car.inTransitHistory?.participant?.venue.name ||
              car.readyToClientHistory?.inventoryCar?.venueFound.name ||
              '';

            const accessories = car.readyToClientHistory?.inventoryCar?.participant ?
              this.getAccessories(car.readyToClientHistory.inventoryCar.participant) :
              null;

            // Crear fila del Excel
            const row = {
              vin: car.vin || '',
              brand: car.brand || '',
              model: car.denomination || car.model || '',
              container: containerInfo.container,
              bl: containerInfo.bl,
              venue: venue,
              hasDamage: car.readyToClientHistory?.inventoryCar?.participant?.hasDamages ? 'Sí' : 'No',
              accesories: accessories?.accessoriesText || '',
              'qty-accesories': accessories?.accessoriesTotal || '',
              ship: car.inTransitHistory?.inventoryCar?.extra ?
                car.inTransitHistory.inventoryCar.extra['Nave'] || '' :
                car.readyToClientHistory?.inventoryCar?.extra ?
                  car.readyToClientHistory.inventoryCar.extra['Nave'] || '' :
                  '',
              readyToClientDate: formatDate(car.readyToClientHistory?.inventoryCar.participant.createdAt),
              inTransitDate: formatDate(car.inTransitHistory?.executedAt),
              status: getStatus(car.inTransitHistory, car.readyToClientHistory)
            };

            worksheet.addRow(row).commit();
            processedCount++;

            // Log de progreso cada 1000 registros
            if (processedCount % 1000 === 0) {
              logger.info(`Processed ${processedCount} cars for export`);
            }

          } catch (error) {
            logger.error(`Error processing car ${car._id}: ${error}`);
            // Continuar con el siguiente registro en caso de error
            continue;
          }
        }

        // Finalizar el archivo Excel
        worksheet.commit();
        await workbook.commit();

        logger.info(`Excel export completed. Total cars processed: ${processedCount}`);
        return;
      }

      // Si no hay filterCompanies, devolver error
      return res.status(400).json({
        message: 'No se pudieron aplicar los filtros de empresas',
        status: 400
      });

    } catch (e) {
      logger.error(`InventoryController.currentCompanyStockExport: Error.`);
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      logger.error(e);

      // Solo enviar respuesta de error si aún no se han enviado headers
      if (!res.headersSent) {
        return res.status(500).json({
          message: 'Error al generar el archivo Excel',
          status: 500
        });
      }
      return res.end();
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

      let handOutForm = await Form.find({ team: team._id, kind: KindForm.final })

      let pipeline: any = [
        {
          $match: {
            team: new mongoose.Types.ObjectId(team._id),
            lastForm: { $nin: handOutForm.map(f => f._id) },
            vin: { "$exists": true, "$ne": "" },
            createdAt: {
              $gte: moment().subtract(12, 'months').toDate()
            },
            event: { "$exists": true, $ne: { type: null } },
            "meta.location.venue": { "$exists": true, "$ne": null },
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

      const user = req.user;
      let filter: any = { vin }
      if (user.company.handlerCompany) {
        filter['handlerCompany'] = user.company._id;
      } else {
        filter['company'] = user.company._id;
      }

      let car = await CarModel.findOne(filter);
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

      let inventoryCar = await InventoryCar.findOne({ car: car._id, inventory: inventory._id });
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
          images: images.map((img: string) => new mongoose.Types.ObjectId(img))
        })
      }
      inventoryCar.containerStatus = status;
      inventoryCar.evidenceStatus = evidenceStatus
      inventoryCar = await inventoryCar.save()

      // Check if the inventory is inventoryContainer and if there's any inventoryCar pending to be found
      /*
      if (inventory.containerInventory) {
        await this.closeInventory(inventory, req.user);
        if (inventoryCar.virtualInventory) {
          const virtualInventory = await VirtualInventoryModel.findOne({
            _id: inventoryCar.virtualInventory
          });
          if (virtualInventory) {
            await this.closeVirtualInventory(virtualInventory)
            logger.info(`apiFoundCar: virtualInventory: ${virtualInventory}`);
          }
        }
      }
      */

      if (car.isContainer) {

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

        if (status === ChoicesStatusContainer.empty && inventoryCar.inventory) {
          await this.addHistoryToCarOfEmptyContainer(inventoryCar);
        }

        const updatedUser = await User.findById(req.user._id).populate([{
          path: 'venue',
          select: ['name']
        }]);
        await this.sendUpdateNotification("EVIDENCE_ADDED", venueId, team._id, inventoryCar, status, updatedUser);
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

  public async addHistoryToCarOfEmptyContainer(container: IInventoryCar): Promise<void> {

    const inventoryCarList = await InventoryCar.find({
      containerFound: container,
      status: ChoicesStatusCarInventory.found
    }).populate([{ path: 'car' }]);

    let carsId: any[] = [];

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
          participant: inventoryCar.participant ?? null,
          inventory: inventoryCar.inventory,
          createdBy: inventoryCar.car.createdBy,
          executedAt: inventoryCar.car.createdAt,
          current: true
        });
      }
    });

    await History.updateMany(
      { _id: { $in: carsId } },
      { $set: { current: false } }
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

  public async uploadInventoryCarFile(req: IRequest, res: Response) {
    const { id } = req.params;
    const { company, venue, team } = req.user;
    const file: any = GeneralUtils.getFileFromRequest(req.files, 'file');
    if (!file) {
      return res.status(400).json({ message: 'El archivo es obligatorio.', status: 400 });
    }
    const allowedMimetypes = ['image/jpeg', 'video/mp4', 'application/pdf'];
    if (!allowedMimetypes.includes(file.mimetype)) {
      return res.status(400).json({ message: 'Tipo de archivo no permitido.', status: 400 });
    }
    logger.info(
      `InventoryController.uploadInventoryCarFile email: ${req.user.email} inventoryCarId: ${id} ` +
      `company: ${company._id} venue: ${venue._id} team: ${team._id} ` +
      `mimetype: ${file.mimetype} size: ${file.size}`
    );
    try {
      const inventoryCar = await InventoryCar.findById(id).populate('car');
      if (!inventoryCar) {
        return res.status(404).json({ message: 'InventoryCar no encontrado.', status: 404 });
      }
      if (!(inventoryCar.car as ICarModel).isContainer) {
        return res.status(403).json({ message: 'El vehículo no es un contenedor.', status: 403 });
      }
      const inventoryFile = new InventoryFileModel();
      file.headers = { 'Content-Type': file.mimetype };
      file.team = team._id;
      file.venue = venue._id;
      file.inventory = inventoryCar.inventory;
      inventoryFile.inventory = inventoryCar.inventory as any;
      inventoryFile.user = req.user._id;
      inventoryFile.company = company._id;
      if (file.mimetype === 'image/jpeg') {
        await this.autoRotate(file.path);
      }
      await inventoryFile.attach('file', file);
      if (file.mimetype === 'image/jpeg') {
        await this.resizeImage(file.path);
        await inventoryFile.attach('thumbnail', file);
      }
      await inventoryFile.save();
      await InventoryCar.updateOne({ _id: id }, { $push: { files: inventoryFile._id } });
      logger.info(
        `InventoryController.uploadInventoryCarFile SUCCESS inventoryFile: ${inventoryFile._id} ` +
        `inventoryCarId: ${id} inventory: ${inventoryCar.inventory} email: ${req.user.email}`
      );
      socket()
        .to(`inventory-detail-${inventoryCar.inventory}`)
        .emit('REFRESH', { update: true, venue: venue._id });
      return res.status(201).json({ data: { _id: inventoryFile._id, file: inventoryFile.file }, status: 201 });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`uploadInventoryCarFile: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, inventoryCarId: ${id}}`);
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      return res.status(400).json(e);
    }
  }

  public async apiListInventoryCarFiles(req: IRequest, res: Response) {
    try {
      const { id } = req.params;
      const inventoryCar = await InventoryCar.findById(id).populate('car').populate({ path: 'files' });
      if (!inventoryCar) {
        return res.status(404).json({ message: 'InventoryCar no encontrado.', status: 404 });
      }
      if (!(inventoryCar.car as ICarModel).isContainer) {
        return res.status(403).json({ message: 'El vehículo no es un contenedor.', status: 403 });
      }
      return res.status(200).json({ data: inventoryCar.files, status: 200 });
    } catch (e) {
      /* istanbul ignore next */
      return res.status(500).send(e);
    }
  }

  public async addInventoryCarLink(req: IRequest, res: Response) {
    const { id } = req.params;
    const { company, venue, team } = req.user;
    const { url, name, linkType } = req.body;
    if (!url || !name) {
      return res.status(400).json({ message: 'El URL y el nombre son obligatorios.', status: 400 });
    }
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ message: 'El URL no es válido.', status: 400 });
    }
    logger.info(
      `InventoryController.addInventoryCarLink email: ${req.user.email} inventoryCarId: ${id} ` +
      `company: ${company._id} venue: ${venue._id} team: ${team._id} url: ${url}`
    );
    try {
      const inventoryCar = await InventoryCar.findById(id).populate('car');
      if (!inventoryCar) {
        return res.status(404).json({ message: 'InventoryCar no encontrado.', status: 404 });
      }
      if (!(inventoryCar.car as ICarModel).isContainer) {
        return res.status(403).json({ message: 'El vehículo no es un contenedor.', status: 403 });
      }
      const inventoryFile = new InventoryFileModel();
      inventoryFile.inventory = inventoryCar.inventory as any;
      inventoryFile.user = req.user._id;
      inventoryFile.company = company._id;
      inventoryFile.isLink = true;
      inventoryFile.link = { url, name, type: linkType };
      await inventoryFile.save();
      await InventoryCar.updateOne({ _id: id }, { $push: { files: inventoryFile._id } });
      logger.info(
        `InventoryController.addInventoryCarLink SUCCESS inventoryFile: ${inventoryFile._id} ` +
        `inventoryCarId: ${id} inventory: ${inventoryCar.inventory} email: ${req.user.email}`
      );
      socket()
        .to(`inventory-detail-${inventoryCar.inventory}`)
        .emit('REFRESH', { update: true, venue: venue._id });
      return res.status(201).json({ data: { _id: inventoryFile._id, link: inventoryFile.link }, status: 201 });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`addInventoryCarLink: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, inventoryCarId: ${id}}`);
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      return res.status(400).json(e);
    }
  }

  public async addInventoryCarLinkWeb(req: IRequest, res: Response) {
    const { id } = req.params;
    const { url, name, linkType } = req.body;
    if (!url || !name) {
      return res.status(400).json({ message: 'El URL y el nombre son obligatorios.', status: 400 });
    }
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ message: 'El URL no es válido.', status: 400 });
    }
    try {
      const inventoryCar = await InventoryCar.findById(id);
      if (!inventoryCar) {
        return res.status(404).json({ message: 'InventoryCar no encontrado.', status: 404 });
      }
      const inventoryFile = new InventoryFileModel();
      inventoryFile.inventory = inventoryCar.inventory as any;
      inventoryFile.user = req.user._id;
      inventoryFile.company = req.user.company._id;
      inventoryFile.isLink = true;
      inventoryFile.link = { url, name, type: linkType };
      await inventoryFile.save();
      await InventoryCar.updateOne({ _id: id }, { $push: { files: inventoryFile._id } });
      socket()
        .to(`inventory-detail-${inventoryCar.inventory}`)
        .emit('REFRESH', { update: true, venue: req.user.venue._id });
      return res.status(201).json({ data: { _id: inventoryFile._id, link: inventoryFile.link }, status: 201 });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`addInventoryCarLinkWeb: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, inventoryCarId: ${id}}`);
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      return res.status(400).json(e);
    }
  }

}

export default new InventoryController();

//
/*
Cambiar icono para las opciones de tipo de carga de anuncio
En modo general-items debe cambiar el texto titulo
Revisar comentario en evidencia de foto normal
Revidar alineación elementos para general-items
 */
