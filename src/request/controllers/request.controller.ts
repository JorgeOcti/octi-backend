import * as archiver from 'archiver';
import * as bluebird from 'bluebird';
import * as excel from 'exceljs';
import { Column } from 'exceljs';
import { Response } from 'express';
import * as fs from 'fs';
import * as https from 'https';
import * as GraphicsMagick from 'gm';
import * as moment from 'moment';
import axios from 'axios';
import * as xml2js from 'xml2js';
import { CustomLabels, PaginateOptions, PaginateResult, QueryPopulateOptions } from 'mongoose';
import { ObjectID } from 'bson';
import Car, { ChoicesStatusCar, default as CarModel } from '../../app/models/car.model';
import Team from '../../app/models/team.model';
import { IRequest, IStringKeyObject } from '../../interfaces/global.interface';
import { io } from '../../server';
import logger from '../../services/logger.service';
import GeneralUtils from '../../utils/general.utils';
import Request, { IRequestModel } from '../models/request.model';
import User from '../../app/models/user.model';
import RequestFile from '../models/requestFile.model';
import RequestItem, { IRequestItemModel } from '../models/requestItem.model';
import RequestItemStatus from '../models/requestItemStatus.model';
import ActivityHistory, { ChoicesTypeActivity } from '../../billing/models/activityHistory.model';
import Reason from '../models/reason.model';
import { createRequestSalfaParams } from '../inputsSchema';
import Venue from '../../app/models/venue.model';
import requestItemsMeta from '../models/requestIteam.meta';

class RequestController {

  public itemPopulate: QueryPopulateOptions[] = [{
    path: 'car'
  }, {
    path: 'request',
    populate: [{
      path: 'createdBy',
      select: ['firstName', 'lastName']
    }, {
      path: 'advancePaymentInformation.files'
    }]
  }, {
    path: 'files'
  }, {
    path: 'reason',
    select: ['name']
  }, {
    path: 'status',
    select: ['name', 'weigth']
  }, {
    path: 'carrier',
    select: ['name']
  }, {
    path: 'origin',
    select: ['name']
  }, {
    path: 'destination',
    select: ['name']
  }, {
    path: 'transmittalItem',
    select: ['loadingDate', 'arrivalDate', 'revisions'],
    populate:[{
      path: 'revisions',
      select: ['createdAt']
    }]
  }, {
    path: 'transmittal',
    select:['number', 'revision'],
    populate:[{
      path: 'revision',
      select: ['createdAt']
    }]
  }];

  private requestPopulate: QueryPopulateOptions[] = [{
    path: 'origin',
    select: ['name']
  }, {
    path: 'destination',
    select: ['name']
  }, {
    path: 'channel',
    select: ['name']
  }, {
    path: 'createdBy',
    select: ['firstName', 'lastName']
  }, {
    path: 'advancePaymentInformation.files'
  }, {
    path: 'advancePaymentInformation.letters'
  }, {
    path: 'items',
    select: [
      'request', 'transmittal', 'transmittalItem', 'assigned', 'team', 'origin', 'position', 'destination', 'answers', 'car', 'files', 'carrier', 'reason', 'status', 'priority', 'observation', 'equipment', 'washed', 'review', 'body', 'uploadDate', 'estimatedArrival', 'createdBy'
    ],
    options: {
      sort: {
        _id: 1
      }
    },
    populate: this.itemPopulate
  }];

  private aggregateCustomLabels: CustomLabels = {
    totalDocs: 'total',
    docs: 'docs',
    limit: 'perPage',
    page: 'currentPage',
    nextPage: 'next',
    prevPage: 'prev',
    totalPages: 'pages',
    hasPrevPage: 'hasPrevious',
    hasNextPage: 'hasNext',
    pagingCounter: 'pageCounter'
  };

  constructor() {
    this.index = this.index.bind(this);
    this.integration = this.integration.bind(this);
    this.apiList = this.apiList.bind(this);
    this.apiListItems = this.apiListItems.bind(this);
    this.apiDetail = this.apiDetail.bind(this);
    this.apiCreate = this.apiCreate.bind(this);
    this.apiByVin = this.apiByVin.bind(this);
    this.getRequets = this.getRequets.bind(this);
    this.apiPatchItem = this.apiPatchItem.bind(this);
    this.apiPatchItemVin = this.apiPatchItemVin.bind(this);
    this.apiDeleteRequest = this.apiDeleteRequest.bind(this);
    this.apiDeleteRequestItem = this.apiDeleteRequestItem.bind(this);
    this.apiCreateItem = this.apiCreateItem.bind(this);
    this.exportExcel = this.exportExcel.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
    this.autoRotate = this.autoRotate.bind(this);
    this.resizeImage = this.resizeImage.bind(this);
    this.downloadItemFiles = this.downloadItemFiles.bind(this);
    this.downloadFile = this.downloadFile.bind(this);
    this.apiUpdateMassive = this.apiUpdateMassive.bind(this);
    this.apiImport = this.apiImport.bind(this);
    this.createRequest = this.createRequest.bind(this);
    this.searchVin = this.searchVin.bind(this);
    this.searchVinContecta = this.searchVinContecta.bind(this);
  }

  public async integration(req: IRequest, res: Response) {
    let { query } = req;
    logger.info(`RequestController.integration`);
    query['conectaID'] = query['6154722a94bba10012230aae'] || query['conectaID'];
    try {
      const params = await createRequestSalfaParams.validate(query, {
        stripUnknown: true
      });
      res.render('app/index', { token: await req.user.generateToken() });
      res.json(params);
    } catch (e) {
      logger.error(e);
      console.log(e);
      res.status(400).json({ error: e.errors?.join(', ') ?? e });
    }
    // const debug = true;
    // if (debug) {
    //   res.render('app/index', { token: await req.user.generateToken() });
    // }
    //  else {
    //    if (Object.keys(query).length) {
    //     try {
    //       const params = await createRequestSalfaParams.validate(query, {
    //         stripUnknown: true
    //       });
    //       res.json(params);
    //     } catch (e) {
    //       res.status(400).json({ error: e.errors.join(', ') });
    //     }
    //   }
    //   res.json({
    //     name: 'Osa-Salfa integration test',
    //     detail: 'Params required are brand, denomination, material, 5bf2de35caf8ef7096105c21, 5bf2de35caf8ef7096105c22, 60b9232164adc90013a79b45, sellerText and 6154722a94bba10012230aae.',
    //     example: '?brand=Chevrolet&denomination=Sail&material=1213&5bf2de35caf8ef7096105c21=Roberto%20Castro&5bf2de35caf8ef7096105c22=76897564-1&60b9232164adc90013a79b45=example@example.com&sellerText=Juan%20P%C3%A9rez&6154722a94bba10012230aae=33'
    //   });
    // }
  }

  public async validateContectaID(req: IRequest, res: Response) {
    try {
      let { body: { conectaID } } = req;
      const { team } = req.user;
      if (conectaID?.length) {
        const existConectId = await Request.findOne({ team, conectaID });
        if (existConectId) {
          res.json({
            error: `connectID used in another request ${existConectId.number}`,
            number: existConectId.number
          });
        } else {
          res.json({});
        }
      } else {
        res.json({});
      }
    } catch (e) {
      /* istanbul ignore next */
      if (e) {
        console.log(e);
        res.status(500).json(e);
      }
    }
  }

  public async index(req: IRequest, res: Response) {
    res.render('app/index', { token: await req.user.generateToken() });
  }

  public async apiUpdateMassive(req: IRequest, res: Response) {
    const { properties } = req.body;
    const { team } = req.user;
    try {
      for (const property of properties) {
        if (property.key.length && property.brands.length) {
          const find: any = {
            team,
            $or: property.brands.map((brand: string) => {
              return {
                brand: {
                  $regex: new RegExp(brand, 'i')
                }
              };
            })
          };
          const update: any = { $set: { property: property.key } };
          await Car.updateMany(find, update);
        }
      }
      res.status(200).json({
        message: 'Actualización realizada satisfactoriamente',
        status: 200
      });
    } catch (e) {
      /* istanbul ignore next */
      if (e) {
        console.log(e);
        res.status(500).json(e);
      }
    }
  }

  private createRequest(createdBy: any, request: any): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        const { company, team } = createdBy;
        const { cars, number, channel, sellerText, operationType } = request;
        const defaultItemStatus = await RequestItemStatus.findOneOrCreate({
          team,
          default: true
        }, {
          name: 'Pendiente',
          default: true,
          team,
          weigth: 10
        });
        const newRequest: IRequestModel = await new Request({
          team,
          sellerText,
          number: number,
          // mark origin and destination with first car
          // TODO: change to venues arrays in cars
          origin: cars[0].origin,
          destination: cars[0].destination,
          operationType: operationType?.length ? operationType : null,
          channel,
          createdBy
        }).save();
        for (const car of cars) {
          let currentCar = await CarModel.findOne({
            team,
            vin: car.vin.trim()
          });
          if (currentCar) {
            currentCar.engineNumber = car.engineNumber;
            currentCar.brand = car.brand;
            currentCar.color = car.color;
            currentCar.denomination = car.denomination;
            currentCar.type = car.type;
            currentCar.client = car.client;
            currentCar.entry = car.entry;
            currentCar.invoice = car.invoice;
            currentCar.bl = car.bl;
            currentCar.engineSize = car.engineSize;
            currentCar.driveType = car.driveType;
            currentCar.businessYear = car.businessYear;
            currentCar.manufacturingYear = car.manufacturingYear;
            currentCar.price = car.price;
            currentCar.insurancePrice = car.insurancePrice;
            currentCar.weight = car.weight;
            currentCar.gas = car.gas;
            currentCar.ap = car.ap;
            currentCar.countryOrigin = car.countryOrigin;
            currentCar.save();
          } else {
            currentCar = await new Car({
              team,
              company,
              vin: car.vin.trim(),
              vin2: car.vin.trim().substr(car.vin.length - 6),
              engineNumber: car.engineNumber,
              brand: car.brand,
              color: car.color,
              denomination: car.denomination,
              type: car.type,
              client: car.client,
              entry: car.entry,
              invoice: car.invoice,
              bl: car.bl,
              engineSize: car.engineSize,
              driveType: car.driveType,
              businessYear: car.businessYear,
              manufacturingYear: car.manufacturingYear,
              price: car.price,
              insurancePrice: car.insurancePrice,
              weight: car.weight,
              gas: car.gas,
              ap: car.ap,
              countryOrigin: car.countryOrigin,
              status: ChoicesStatusCar.pending,
              createdBy: createdBy
            }).save();
          }
          const [user, origin, destination] = await Promise.all([
            User.findById(createdBy._id),
            Venue.findById(car.origin),
            Venue.findById(car.destination)
          ]);
          await new RequestItem({
            team,
            request: newRequest,
            car: currentCar,
            meta: requestItemsMeta.processMeta({
              request,
              car,
              user,
              origin,
              destination,
              defaultItemStatus
            }),
            reason: car.reason,
            origin: car.origin,
            destination: car.destination,
            observation: car.observation,
            status: defaultItemStatus,
            createdBy: user
          }).save();
        }
        const updatedRequest = await Request.findById(newRequest._id).populate(this.requestPopulate);
        io.to(`request-list-${team._id}`).emit('CREATE_REQUEST', {
          request: updatedRequest
        });
        io.to(`request-detail-${team._id}`).emit('CREATE_REQUEST', {
          request: updatedRequest
        });
        resolve({
          updatedRequest
        });
      } catch (e) {
        /* istanbul ignore next */
        logger.error(`RequestController.createRequest: Async Error.`);
        /* istanbul ignore next */
        logger.error(`{user: {_id: ${createdBy._id}, email: ${createdBy.email}}, user: ${JSON.stringify(createdBy)}`);
        logger.error(e);
        reject(e);
      }
    });
  }

  public async apiImport(req: IRequest, res: Response) {
    try {
      const { team } = req.user;
      const { requests } = req.body;
      if (requests?.length) {
        const requestsNumbers = requests.map((request: any) => parseInt(request.number));
        const existsRequest = await Request.find({ team, number: { $in: requestsNumbers } });
        const updateTeam = await Team.findOne({ _id: team._id });
        const maxRequest = Math.max(...requestsNumbers);
        const minRequest = Math.min(...requestsNumbers);

        if (existsRequest.length) {
          res.status(400).json({
            message: `Solicitudes número ${existsRequest.map((e) => e.number).join(',')} ya ${existsRequest.length > 1 ? 'existen' : 'existe'}`,
            status: 400
          });
        } else if (minRequest < updateTeam!.requestNumber) {
          res.status(400).json({
            message: `El número de solicitud no puede ser menor que ${updateTeam!.requestNumber}`,
            status: 400
          });
        } else {
          requests.forEach(async (request: any) => {
            await this.createRequest(req.user, request);
          });

          await Team.findOneAndUpdate({ _id: team._id }, { $set: { requestNumber: maxRequest } });
          res.status(200).json({
            message: 'Actualización realizada satisfactoriamente',
            status: 200
          });
        }
      } else {
        res.status(400).json({
          message: 'Datos invalidos',
          status: 400
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      if (e) {
        console.log(e);
        res.status(500).json(e);
      }
    }
  }

  public async apiCreate(req: IRequest, res: Response): Promise<any> {
    logger.info(`RequestController.apiCreate`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)} }`);
    const { company, team } = req.user;
    const {
      cars, venue, channel, sellerText, operationType, deliveryVenue, deliveryAddress, deliveryDate, conectaID, advancePaymentInformation, customerInformation
     } = req.body;

    try {
      const existConectId = await Request.findOne({team, conectaID});
      if(conectaID?.length && existConectId){
        return res.status(400).json({
          message: `ID de cotización conecta ${conectaID} ya se encuentra asociado en la solicitud ${existConectId.number}.`
        })
      }
      const defaultItemStatus = await RequestItemStatus.findOneOrCreate({
        team,
        default: true
      }, {
        name: 'Pendiente',
        default: true,
        team,
        weigth: 10
      });
      const updateTeam = await Team.findOneAndUpdate({ _id: team._id }, { $inc: { requestNumber: 1 } }, { new: true });

      const request = await new Request({
        team,
        sellerText: sellerText ?? req.user.fullName(),
        number: updateTeam!.requestNumber,
        origin: venue,
        advancePaymentInformation,
        customerInformation,
        destination: venue,
        deliveryVenue,
        deliveryAddress,
        deliveryDate,
        conectaID,
        operationType: operationType?.length ? operationType : null,
        // status,
        channel,
        createdBy: req.user
      }).save();
      for (const car of cars) {
        const newCar = await new Car({
          team,
          company,
          vin: '',
          vin2: '',
          brand: car.brand,
          denomination: car.denomination,
          material: car.material,
          color: car.color,
          secondColorOption: car?.secondColorOption ?? '',
          thirdColorOption: car?.thirdColorOption ?? '',
          status: ChoicesStatusCar.pending,
          createdBy: req.user
        }).save();
        const origin = await Venue.findById(req.user.venue);
        const destination = await Venue.findById(venue);
        const status = defaultItemStatus;
        await new RequestItem({
          team,
          request,
          car: newCar,
          reason: car.reason,
          files: car.files,
          washed: car.washed,
          answers: car.answers,
          equipment: car.equipment,
          observation: car.observation,
          priority: car.priority,
          origin: req.user.venue,
          destination: venue,
          status: defaultItemStatus,
          meta: requestItemsMeta.processMeta({
            request,
            car: newCar,
            user: await User.findOne({_id: req.user._id}),
            origin,
            destination,
            status
          }),
          createdBy: req.user
        }).save();
      }
      const newRequest = await Request.findById(request._id).populate(this.requestPopulate);
      io.to(`request-list-${team._id}`).emit('CREATE_REQUEST', {
        request: newRequest
      });
      io.to(`request-detail-${team._id}`).emit('CREATE_REQUEST', {
        request: newRequest
      });
      res.json({
        data:newRequest,
        status: 200
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`RequestController.apiCreate: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}`);
      logger.error(e);
      res.status(500).json(e);
    }
  }

  public async apiListItems(req: IRequest, res: Response) {
    logger.info(`RequestController.apiListItems`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)} }`);
    const team = req.user.team._id;
    const {
      page,
      pageSize,
      orderBy,
      orderType,
      filters
    } = req.body as {
      page: string; pageSize: string; search: string;
      orderBy: string; orderType: string; filters: any;
    };

    const requestNumbers = filters.request
      .replace(/[^0-9,]/g, '')
      .split(',')
      .filter((requestNumber: string) => (requestNumber.length));

    let venuesIds: any[];
    const extraQuery: any = {};

    if (filters.venues && filters.venues.length) {
      venuesIds = req.user.venuesPermissions()
        .filter(venue => (filters.venues.includes(venue.toString())));
    } else {
      venuesIds = req.user.venuesPermissions();
    }
    if (filters.users && filters.users.length) {
      if (!extraQuery.hasOwnProperty('$or')) {
        extraQuery.$or = [];
      }
      extraQuery.$or.push({
        'meta.user._id': { $in: filters.users.map((userId: any) => new ObjectID(userId)) }
      });
    }
    if (filters.status && filters.status.length) {
      extraQuery.status = { $in: filters.status.map((status: any) => new ObjectID(status)) };
    }
    if (filters.from) {
      if (!extraQuery.hasOwnProperty('createdAt')) {
        extraQuery.createdAt = {};
      }
      extraQuery.createdAt.$gte = moment(filters.from).startOf('day').toDate();
    }
    if (filters.to) {
      if (!extraQuery.hasOwnProperty('createdAt')) {
        extraQuery.createdAt = {};
      }
      extraQuery.createdAt.$lte = moment(filters.to).endOf('day').toDate();
    }
    if (requestNumbers.length) {
      extraQuery['meta.request.number'] = { $in: requestNumbers.map((requestNumber: any) => +requestNumber) };
    }
    if (filters.entry?.length) {
      extraQuery['meta.car.entry'] = { '$regex': filters.entry, '$options': 'i' };
    }
    if (filters.text) {
      extraQuery.$or = [];
      extraQuery.$or.push({
        'meta.car.vin': { '$regex': filters.text, '$options': 'i' }
      });
      extraQuery.$or.push({
        'meta.car.brand': { '$regex': filters.text, '$options': 'i' }
      });
      extraQuery.$or.push({
        'meta.car.color': { '$regex': filters.text, '$options': 'i' }
      });
      extraQuery.$or.push({
        'meta.car.denomination': { '$regex': filters.text, '$options': 'i' }
      });
      extraQuery.$or.push({
        'meta.car.material': { '$regex': filters.text, '$options': 'i' }
      });
    }
    if (filters.sellerText && filters.sellerText.length) {
      if (!extraQuery.hasOwnProperty('$or')) {
        extraQuery.$or = [];
      }
      extraQuery.$or.push({
        'meta.request.sellerText': { '$regex': filters.sellerText, '$options': 'i' }
      });
    }
    if (filters.properties && filters.properties.length) {
      if (!extraQuery.hasOwnProperty('$or')) {
        extraQuery.$or = [];
      }
      extraQuery.$or.push({
        'meta.car.property': { $in: filters.properties.map((s: any) => s) }
      });
    }
    if (filters.conectaID && filters.conectaID.length) {
      if (!extraQuery.hasOwnProperty('$or')) {
        extraQuery.$or = [];
      }
      extraQuery.$or.push({
        'meta.request.conectaID': filters.conectaID
      });
    }
    if (filters && filters.transmitttalModule) {
      extraQuery.assigned = { $in: [null, false] };
    }
    console.log('extraQuery', extraQuery);

    try {
      const baseAggregate: any[] = [{
        $match: {
          team,
          $or: [{
            destination: {
              $in: venuesIds
            },
            // ...extraQuery
          }, {
            origin: {
              $in: venuesIds
            },
            // ...extraQuery
          }]
        }
      }, {
        $match: extraQuery
      }];

      const aggregatePopulate = [{
        $lookup: { from: 'cars', localField: 'car', foreignField: '_id', as: 'car' }
      }, {
        $unwind: { path: '$car', preserveNullAndEmptyArrays: true }
      }, {
        $lookup: { from: 'venues', localField: 'origin', foreignField: '_id', as: 'origin' }
      }, {
        $unwind: { path: '$origin', preserveNullAndEmptyArrays: true }
      }, {
        $lookup: { from: 'venues', localField: 'destination', foreignField: '_id', as: 'destination' }
      }, {
        $unwind: { path: '$destination', preserveNullAndEmptyArrays: true }
      }, {
        $lookup: { from: 'requests', localField: 'request', foreignField: '_id', as: 'request' }
      }, {
        $unwind: { path: '$request', preserveNullAndEmptyArrays: false }
      }, {
        $lookup: { from: 'users', localField: 'request.createdBy', foreignField: '_id', as: 'request.createdBy' }
      }, {
        $unwind: { path: '$request.createdBy', preserveNullAndEmptyArrays: true }
      }, {
        $lookup: { from: 'requestfiles', localField: 'request.advancePaymentInformation.files', foreignField: '_id', as: 'request.advancePaymentInformation.files' }
      }, {
        $lookup: { from: 'requestfiles', localField: 'request.advancePaymentInformation.letters', foreignField: '_id', as: 'request.advancePaymentInformation.letters' }
      }, {
        $lookup: { from: 'requestitemstatuses', localField: 'status', foreignField: '_id', as: 'status' }
      }, {
        $unwind: { path: '$status', preserveNullAndEmptyArrays: true }
      }, {
        $lookup: { from: 'reasons', localField: 'reason', foreignField: '_id', as: 'reason' }
      }, {
        $unwind: { path: '$reason', preserveNullAndEmptyArrays: true }
      }, {
        $lookup: { from: 'transmittals', localField: 'transmittal', foreignField: '_id', as: 'transmittal' }
      }, {
        $unwind: { path: '$transmittal', preserveNullAndEmptyArrays: true }
      }, {
        $addFields: { requestNumber: { $toString: '$request.number' } }
      }, {
        $sort: { [orderBy]: orderType === 'ascending' ? 1 : -1 }
      }, {
        $project: {
          '_id': 1,
          'request._id': 1,
          'request.number': 1,
          'transmittal.number': 1,
          'request.conectaID': 1,
          'request.sellerText': 1,
          'request.advancePaymentInformation': 1,
          'priority': 1,
          'observation': 1,
          'equipment': 1,
          'washed': 1,
          'review': 1,
          'body': 1,
          'files._id': 1,
          'requestNumber': 1,
          'status._id': 1,
          'status.name': 1,
          'status.weigth': 1,
          'car._id': 1,
          'car.vin': 1,
          'car.brand': 1,
          'car.color': 1,
          'car.secondColorOption': 1,
          'car.thirdColorOption': 1,
          'car.material': 1,
          'car.entry': 1,
          'car.invoice': 1,
          'car.patent': 1,
          'car.property': 1,
          'car.type': 1,
          'car.client': 1,
          'car.bl': 1,
          'car.denomination': 1,
          'car.internalNumber': 1,
          'origin._id': 1,
          'origin.name': 1,
          'destination._id': 1,
          'destination.name': 1,
          'reason._id': 1,
          'reason.name': 1,
          'uploadDate': 1,
          'estimatedArrival': 1,
          'createdAt': 1,
          'updatedAt': 1
        }
      }];
      const requestsAggregate = RequestItem.aggregate(baseAggregate).allowDiskUse(true);
      const options: PaginateOptions = {
        page: parseInt(page ? page : '1', 10),
        limit: parseInt(pageSize ? pageSize : '10', 10),
        customLabels: this.aggregateCustomLabels,
        sort: { [orderBy]: orderType === 'ascending' ? 1 : -1 }
      };
      const requests = await RequestItem.aggregatePaginate(requestsAggregate, options);
      if (options.page && requests.pages && requests.pages < options.page) {
        res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        res.json({
          count: requests.total,
          pages: requests.pages,
          hasPrevious: requests.hasPrevious,
          hasNext: requests.hasNext,
          results: await RequestItem.aggregate([{
            $match: {
              _id: { $in: requests.docs.map((d) => d._id) }
            }
          }, ...aggregatePopulate]),
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`RequestController.apiListItems: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}, params: ${JSON.stringify(req.params)}`);
      logger.error(e);
      res.status(500).json(e);
    }
  }

  public async exportExcel(req: IRequest, res: Response) {
    const team = req.user.team._id;
    try {

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${moment().format('YYYYMMDD')}-solicitudes.xlsx`);
      const options = {
        stream: res,
        useStyles: true,
        useSharedStrings: true
      };
      const workbook = new excel.stream.xlsx.WorkbookWriter(options);
      const worksheet = workbook.addWorksheet('Solicitudes', {
        properties: {
          defaultRowHeight: 30
        }, pageSetup: {
          fitToPage: true, fitToHeight: 100, fitToWidth: 1
        }
      });

      /* headers */
      const questionColumns: Partial<Column>[] = [];

      for (const reason of await Reason.find({ team })) {
        for (const question of reason.questions) {
          questionColumns.push({
            header: question.name, key: question._id, width: 10
          });
        }
      }
      worksheet.columns = [{
        header: 'Nª SOLICITUD', key: 'request', width: 10
      }, {
        header: 'FECHA SOLICITUD', key: 'created', width: 21, style: { numFmt: 'dd/mm/yyyy hh:mm' }
      }, {
        header: 'CANAL', key: 'channel', width: 20
      }, {
        header: 'PRIORIDAD', key: 'priority', width: 20
      }, {
        header: 'SUCURSAL (CREACION)', key: 'origin', width: 20
      }, {
        header: 'SOLICITANTE', key: 'createdBy', width: 20
      }, {
        header: 'VENDEDOR', key: 'seller', width: 20
      }, {
        header: 'MOTIVO', key: 'reason', width: 20
      }, {
        header: 'GRUPO', key: 'group', width: 20
      }, {
        header: 'PROPIEDAD', key: 'property', width: 20
      }, {
        header: 'MARCA', key: 'brand', width: 20
      }, {
        header: 'MODELO', key: 'denomination', width: 20
      }, {
        header: 'MATERIAL', key: 'material', width: 20
      }, {
        header: 'COLOR', key: 'color', width: 20
      }, {
        header: 'COLOR 2', key: 'secondColorOption', width: 20
      }, {
        header: 'COLOR 3', key: 'thirdColorOption', width: 20
      }, {
        header: 'ESTADO', key: 'status', width: 20
      }, {
        header: 'VIN/ID', key: 'vin', width: 20
      }, {
        header: 'CDO', key: 'cdo', width: 20
      }, {
        header: 'ACCESORIZACIÓN', key: 'equipment', width: 10
      }, {
        header: 'PRE-LAVADO', key: 'washed', width: 10
      }, {
        header: 'INSPECCIÓN Pre-entrega', key: 'review', width: 10
      }, {
        header: 'CARROCERO', key: 'body', width: 10
      }, {
        header: 'EQUIPAMIENTO', key: 'equipment_2', width: 10
      }, {
        header: 'DESTINO', key: 'destination', width: 20
      }, {
        header: 'TRANSPORTISTA', key: 'carrier', width: 20
      }, {
        header: 'NOMBRE CLIENTE', key: 'customerName', width: 20
      }, {
        header: 'RUT CLIENTE', key: 'customerRut', width: 20
      }, {
        header: 'EMAIL CLIENTE', key: 'customerEmail', width: 20
      }, {
        header: 'METHODO DE PAGO', key: 'paymentMethod', width: 20
      }, {
        header: 'TICKET', key: 'paymentNumber', width: 20
      }, {
        header: 'ID Conecta', key: 'conectaID', width: 20
      }, {
        header: 'FECHA CARGA', key: 'uploadDate', width: 21, style: { numFmt: 'dd/mm/yyyy hh:mm' }
      }, {
        header: 'FECHA LLEGADA', key: 'estimatedArrival', width: 21, style: { numFmt: 'dd/mm/yyyy hh:mm' }
      }, {
        header: 'FECHA ACTUALIZACION', key: 'updated', width: 21, style: { numFmt: 'dd/mm/yyyy hh:mm' }
      }, {
        header: 'OBSERVACIÓN', key: 'observation', width: 21
      }, ...questionColumns];

      const cursor = RequestItem.aggregate<IRequestItemModel>([{
        $match: {
          team,
          'destination': {
            $in: req.user.venuesPermissions()
          }
        }
      }, {
        $lookup: { from: 'cars', localField: 'car', foreignField: '_id', as: 'car' }
      }, {
        $unwind: { path: '$car', preserveNullAndEmptyArrays: true }
      }, {
        $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id', as: 'createdBy' }
      }, {
        $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true }
      }, {
        $lookup: { from: 'venues', localField: 'origin', foreignField: '_id', as: 'origin' }
      }, {
        $unwind: { path: '$origin', preserveNullAndEmptyArrays: true }
      }, {
        $lookup: { from: 'venues', localField: 'destination', foreignField: '_id', as: 'destination' }
      }, {
        $unwind: { path: '$destination', preserveNullAndEmptyArrays: true }
      }, {
        $lookup: { from: 'requests', localField: 'request', foreignField: '_id', as: 'request' }
      }, {
        $unwind: { path: '$request', preserveNullAndEmptyArrays: false }
      }, {
        $lookup: { from: 'requestitemstatuses', localField: 'status', foreignField: '_id', as: 'status' }
      }, {
        $unwind: { path: '$status', preserveNullAndEmptyArrays: true }
      }, {
        $lookup: { from: 'carriers', localField: 'carrier', foreignField: '_id', as: 'carrier' }
      }, {
        $unwind: { path: '$carrier', preserveNullAndEmptyArrays: true }
      }, {
        $lookup: { from: 'reasons', localField: 'reason', foreignField: '_id', as: 'reason' }
      }, {
        $unwind: { path: '$reason', preserveNullAndEmptyArrays: true }
      }, {
        $lookup: { from: 'saleschannels', localField: 'request.channel', foreignField: '_id', as: 'request.channel' }
      }, {
        $unwind: { path: '$request.channel', preserveNullAndEmptyArrays: true }
      }, {
        $lookup: { from: 'paymentmethods', localField: 'request.advancePaymentInformation.method', foreignField: '_id', as: 'request.advancePaymentInformation.method' }
      }, {
        $unwind: { path: '$request.advancePaymentInformation.method', preserveNullAndEmptyArrays: true }
      }, {
        $project: {
          '_id': 1,
          'request': 1,
          'priority': 1,
          'observation': 1,
          'equipment': 1,
          'washed': 1,
          'answers': 1,
          'review': 1,
          'body': 1,
          'status._id': 1,
          'status.name': 1,
          'carrier._id': 1,
          'carrier.name': 1,
          'status.weigth': 1,
          'createdBy._id': 1,
          'createdBy.firstName': 1,
          'createdBy.lastName': 1,
          'car': 1,
          'origin._id': 1,
          'origin.name': 1,
          'destination._id': 1,
          'destination.name': 1,
          'reason._id': 1,
          'reason.name': 1,
          'uploadDate': 1,
          'estimatedArrival': 1,
          'createdAt': 1,
          'updatedAt': 1
        }
      }, {
        $sort: { _id: 1 }
      }])
        .allowDiskUse(true)
        .cursor({ batchSize: 20 })
        .exec();

      cursor.on('data', async (item: any) => {
        const extraAnswers: any = {};
        for (const answer of item.answers ? item.answers : []) {
          extraAnswers[answer.questionId] = answer.answer;
        }
        worksheet.addRow({
          ...extraAnswers,
          request: item.request.number,
          created: item.createdAt,
          updated: item.updatedAt,
          observation: item.observation,
          fleet: item.request.fleet ? 'Si' : 'No',
          priority: item.priority ? 'Si' : 'No',
          createdBy: item.createdBy ? `${item.createdBy.firstName} ${item.createdBy.lastName}` : '-',
          seller: item.request.sellerText,
          channel: item.request.channel ? item.request.channel.name : '',
          reason: item.reason?.name ?? '',
          group: '',
          property: item.car.property,
          brand: item.car.brand,
          denomination: item.car.denomination,
          material: item.car.material,
          vin: item.car.vin,
          cdo: item.car.internalNumber,
          color: item.car.color,
          secondColorOption: item.car.secondColorOption,
          thirdColorOption: item.car.thirdColorOption,
          destination: item.destination?.name ?? '',
          origin: item.origin?.name ?? '',
          status: item.status?.name ?? '',
          equipment: item.equipment ? 'Si' : 'No',
          body: item.body ? 'Si' : 'No',
          washed: item.washed ? 'Si' : 'No',
          review: item.review ? 'Si' : 'No',
          carrier: item.carrier ? item.carrier.name : '',
          conectaID: item.request?.conectaID ?? '',
          customerName: item.request?.customerInformation?.name ?? '',
          customerRut: item.request?.customerInformation?.rut ?? '',
          customerEmail: item.request?.customerInformation?.email ?? '',
          paymentMethod: item.request?.advancePaymentInformation?.method?.name ?? '',
          paymentNumber: item.request?.advancePaymentInformation?.number ?? '',
          uploadDate: item.uploadDate,
          estimatedArrival: item.estimatedArrival,
        }).commit();
      });
      cursor.on('end', async () => {
        workbook.commit();
        res.status(200);
      });

      cursor.on('error', (error: Error) => logger.error(error.message));

      // code to handle connection abort or finish of data send
      req.connection.on('close', async () => {
        await cursor.close();
        res.status(200);
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      logger.error(`RequestController.exportExcel: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}, params: ${JSON.stringify(req.params)}`);
      logger.error(e);
      res.status(500).json(e);
    }
  }

  public async apiList(req: IRequest, res: Response) {
    logger.info(`RequestController.apiList`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
    const team = req.user.team._id;
    const {
      page,
      pageSize,
      search,
      orderBy,
      orderType
    } = req.query as { page: string; pageSize: string; search: string; orderBy: string; orderType: string };
    // paginate options
    const options: PaginateOptions = {
      sort: {
        [orderBy]: orderType === 'ascending' ? 1 : -1
      },
      // populate: this.requestPopulate,
      populate: [{
        path: 'origin',
        select: ['name']
      }, {
        path: 'destination',
        select: ['name']
      }, {
        path: 'channel',
        select: ['name']
      }, {
        path: 'createdBy',
        select: ['firstName', 'lastName']
      }, {
        path: 'advancePaymentInformation.files'
      }, {
        path: 'items',
        select: ['_id']
      }],
      select: {meta: false},
      page: parseInt(page ? page : '1', 10),
      limit: parseInt(pageSize ? pageSize : '20', 10)
    };
    const filter: any = {
      team,
      destination: {
        $in: req.user.venuesPermissions()
      }
    };
    if (search) {
      // add here conditions tu search
    }
    try {
      const requests = await this.getRequets(filter, options);
      /* istanbul ignore if  */
      if (options.page && requests.pages && requests.pages < options.page) {
        res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        res.json({
          count: requests.total,
          pages: requests.pages,
          hasPrevious: options.page && options.page > 1 && requests.pages && requests.pages >= options.page,
          hasNext: options.page && requests.pages && requests.pages > options.page,
          results: requests.docs,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`RequestController.apiList: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      res.status(500).json(e);
    }
  }

  public async apiDetail(req: IRequest, res: Response) {
    logger.info(`RequestController.apiDetail`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
    const team = req.user.team._id;
    const { id } = req.params;
    try {
      const request = await Request
        .findOne({
          _id: id,
          team
        })
        .populate(this.requestPopulate);
      if (request) {
        res.json(request);
      } else {
        res.status(404).json({
          message: `No se ha encontrado la solicitud ${id}`,
          status: 404
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`RequestController.apiDetail: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}, params: ${JSON.stringify(req.params)}`);
      logger.error(e);
      res.status(500).json(e);
    }
  }

  public async apiByVin(req: IRequest, res: Response) {
    logger.info(`RequestController.apiDetail`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
    const team = req.user.team._id;
    const { id } = req.params;
    try {
      const requestItems = await RequestItem
        .find({
          car: id,
          team
        })
        .populate(this.itemPopulate);
      if (requestItems) {
        res.json(requestItems);
      } else {
        res.json([]);
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`RequestController.apiDetail: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}, params: ${JSON.stringify(req.params)}`);
      logger.error(e);
      res.status(500).json(e);
    }
  }

  public async apiDeleteRequest(req: IRequest, res: Response) {
    logger.info(`RequestController.apiDeleteRequest`);
    const team = req.user.team._id;
    const { id } = req.params;
    try {
      const request = await Request
        .findOne({
          _id: id,
          team
        });
      if (request) {
        await RequestItem.find({ _id: id, team }).remove();
        await request.remove();
        io.to(`request-list-${team}`).emit('DELETE_REQUEST', {
          idRequest: request._id
        });
        io.to(`request-detail-${team}`).emit('DELETE_REQUEST', {
          idRequest: request._id
        });
        res.status(200).json({
          message: `ok`,
          status: 200
        });
      } else {
        res.status(404).json({
          message: `No se ha encontrado la solicitud ${id}`,
          status: 404
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`RequestController.apiDeleteRequest: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}, params: ${JSON.stringify(req.params)}`);
      logger.error(e);
      res.status(500).json(e);
    }
  }

  public async apiDeleteRequestItem(req: IRequest, res: Response) {
    logger.info(`RequestController.apiDeleteRequestItem`);
    try {
      const team = req.user.team._id;
      const { id } = req.params;
      const item = await RequestItem
        .findOne({
          _id: id,
          team
        })
        .populate(this.itemPopulate);
      if (item) {
        await item.remove();
        io.to(`request-list-${team}`).emit('DELETE_REQUEST_ITEM', {
          idRequest: item.request._id,
          item
        });
        io.to(`request-detail-${team}`).emit('DELETE_REQUEST_ITEM', {
          idRequest: item.request._id,
          item
        });
        await Request.update({ _id: item.request._id }, { $set: { updatedAt: moment() } });
        const itemsInRequest = await RequestItem.find({ request: item.request._id }).count();
        if(!itemsInRequest){
          await Request.deleteOne({ _id: item.request._id });
          io.to(`request-list-${team}`).emit('DELETE_REQUEST', {
            idRequest: item.request._id
          });
          io.to(`request-detail-${team}`).emit('DELETE_REQUEST', {
            idRequest: item.request._id
          });
        }
        res.status(200).json({
          message: `ok`,
          status: 200
        });
      } else {
        res.status(404).json({
          message: `No se ha encontrado la solicitud ${id}`,
          status: 404
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`RequestController.apiDeleteRequestItem: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}, params: ${JSON.stringify(req.params)}`);
      logger.error(e);
      res.status(500).json(e);
    }
  }

  public async searhCar(req: IRequest, res: Response) {
    logger.info(`RequestController.searhCar`);
    const team = req.user.team._id;
    const { search } = req.query;
    try {
      const cars = await Car.aggregate([{
        $match: {
          team,
          $text: {
            $search: search,
            $diacriticSensitive: false
          }
        }
      }, {
        $project: {
          vin: 1,
          brand: 1,
          denomination: 1,
          material: 1,
          score: {
            $meta: 'textScore'
          }
        }
      }, {
        $match: {
          score: {
            $gt: 0.5
          }
        }
      }, {
        $group: {
          _id: {
            brand: '$brand',
            denomination: '$denomination',
            material: '$material',
            score: '$score'
          }
        }
      }, {
        $sort: {
          '_id.score': -1
        }
      }, {
        $limit: 100
      }, {
        $project: {
          brand: '$_id.brand',
          denomination: '$_id.denomination',
          material: '$_id.material',
          score: '$_id.score',
          _id: false
        }
      }]);
      res.json({
        cars
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`RequestController.searhCar: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      logger.error(e);
      res.status(500).json(e);
    }
  }

  public async apiCreateItem(req: IRequest, res: Response) {
    logger.info(`RequestController.apiCreateItem`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)} }`);
    const { company } = req.user;
    const team = req.user.team._id;
    const { car, idRequest } = req.body;
    try {
      const request = await Request.findOne({ _id: idRequest, team });
      if (request) {
        const defaultItemStatus = await RequestItemStatus.findOneOrCreate({ team, default: true }, { name: 'En proceso', default: true, team });
        const newCar = await new Car({
          team,
          company,
          brand: car.brand,
          denomination: car.denomination,
          material: car.material,
          color: car.color,
          status: ChoicesStatusCar.pending,
          createdBy: req.user
        }).save();
        const newItem = await new RequestItem({
          team,
          request,
          car: newCar,
          reason: car.reason,
          washed: car.washed,
          equipment: car.equipment,
          priority: car.priority,
          origin: request.origin,
          destination: request.destination,
          status: defaultItemStatus,
          createdBy: req.user
        }).save();
        const item = await RequestItem.findOne({ _id: newItem._id }).populate(this.itemPopulate);
        request.update({ $set: { updatedAt: moment() } });
        io.to(`request-list-${team}`).emit('CREATE_REQUEST_ITEM', {
          idRequest: request._id,
          item
        });
        io.to(`request-detail-${team}`).emit('CREATE_REQUEST_ITEM', {
          idRequest: request._id,
          item
        });
        res.status(200).json({
          ...item
        });
      } else {
        res.status(404).json({
          message: 'No se ha encontrado la solicitud.',
          status: 404
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      console.log(e);
      logger.error(`RequestController.apiCreateItem: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      res.status(500).json(e);
    }
  }

  public async apiPatchItemVin(req: IRequest, res: Response): Promise<any> {
    const { team, company } = req.user;
    const { id } = req.params;
    const { vin } = req.body as IStringKeyObject<any>;
    try {
      let requestItem = await RequestItem
        .findOne({ _id: id, team })
        .populate(this.itemPopulate);
      if(requestItem){
        if (team._id.toString() === '5bf2de35caf8ef7096105cdd') {
          let data: any [] = [];
          if (vin?.length >= 6) {
            data = await this.searchVinContecta(vin);
            data = data.filter((car) => car.material === requestItem!.car.material);
            console.log('data', data);
            if (!data.length) {
              return res.status(400).json({
                message: 'VIN no encontrado en SAP.'
              });
            }
          } else if (vin?.length > 0) {
            return res.status(400).json({
              message: 'VIN no encontrado en SAP.'
            });
          }
        }
        const car = await Car.findOne({ vin, team });
        // si el vehículo ya existe
        if (car && vin?.length) {
          const existOtherRequestWithCar = await RequestItem.find({ team, car, _id: { $ne: requestItem._id } });
          if (existOtherRequestWithCar.length) {
            return res.status(400).json({
              message: 'VIN ya asignado a otro vehículo.'
            });
          }
          //await Car.updateOne({ _id: car._id, team }, { vin });
          await RequestItem.updateOne({ _id: requestItem._id }, { car });
        }
        // si la solicitud no tenía vin
        else if (requestItem.car.vin.length === 0) {
          console.log('1 Vehíulo no tenía VIN');
          await Car.updateOne({ _id: requestItem.car._id, team }, { vin });
        }
        // si el vehículo tenia vin y ahora se le elimina
        else if (requestItem.car.vin.length > 0 && vin.length === 0) {
          console.log('2 Vehíulo tenía VIN y ahora se le elimina');
          console.log(requestItem.car);
          const newCar = await new Car({
            team,
            vin: '',
            vin2: '',
            company,
            brand: requestItem.car.brand,
            denomination: requestItem.car.denomination,
            material: requestItem.car.material,
            color: requestItem.car.color,
            status: ChoicesStatusCar.pending,
            createdBy: req.user
          }).save();
          await RequestItem.updateOne({ _id: requestItem._id }, { car: newCar._id });
        }
        // si le cambias el VIN al vehículo
        else if (requestItem.car.vin.length > 0 && vin.length > 0) {
          console.log('3 Cambio de VIN');
          if (requestItem.car.vin !== vin) {
            const newCar = await new Car({
              team,
              company,
              vin,
              vin2: vin.trim().substr(vin.length - 6),
              brand: requestItem.car.brand,
              denomination: requestItem.car.denomination,
              material: requestItem.car.material,
              color: requestItem.car.color,
              status: ChoicesStatusCar.pending,
              createdBy: req.user
            }).save();
            console.log('3 crea vehiculo');
            await RequestItem.updateOne({ _id: requestItem._id }, { car: newCar });
          }
        }

        let cancelRequest = false;
        req.on('close', function() {
          cancelRequest = true;
        });
        requestItem = await RequestItem
          .findOne({ _id: id, team })
          .populate(this.itemPopulate)
          .lean();
        if (requestItem) {
          await Request.update({ _id: requestItem.request._id }, { $set: { updatedAt: moment() } });
          if (!cancelRequest) {
            io.to(`request-list-${team._id}`).emit('UPDATE_REQUEST_ITEM', {
              idRequest: requestItem.request._id,
              item: requestItem
            });
          }
          if (!cancelRequest) {
            io.to(`request-detail-${team._id}`).emit('UPDATE_REQUEST_ITEM', {
              idRequest: requestItem.request._id,
              item: requestItem
            });
          }
          res.status(200).json({
            ...requestItem
          });
        }
      } else {
        res.status(404).json({ message: 'Item no encontrado' });
      }
    } catch (e) {
      console.error(e);
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      logger.error(`RequestController.apiPatchItem: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      res.status(500).json(e);
    }
  }

  public async apiPatchItem(req: IRequest, res: Response) {
    logger.info(`RequestController.apiPatchItem`);
    const { team, company } = req.user;
    const updateObject = req.body;
    const { id } = req.params;
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(updateObject)} }`);
    try {
      let cancelRequest = false;
       req.on('close', function() {
          cancelRequest = true;
       });
      const requestItem = await RequestItem.findOneAndUpdate({
        _id: id,
        team
      }, { $set: { ...updateObject } }).populate([{ path: 'car' }, { path: 'request' }]);
      if (Object.keys(updateObject.car).length) {
        if (requestItem) {
          const existActivity = await ActivityHistory.findOne({ team, 'request.item': requestItem._id });
          if (!existActivity) {
            await new ActivityHistory({
              team,
              company,
              user: req.user._id,
              type: ChoicesTypeActivity.request,
              request: {
                _id: requestItem.request._id,
                item: requestItem._id,
                number: requestItem.request.number
              }
            }).save();
          }
        }
        await Car.update({ _id: updateObject.car._id, team }, { $set: updateObject.car });
      }
      const item = await RequestItem
        .findOne({ _id: id, team })
        .populate(this.itemPopulate)
        .lean();

      await Request.update({ _id: item.request._id }, { $set: { updatedAt: moment() } });
      if (!cancelRequest) {
        io.to(`request-list-${team._id}`).emit('UPDATE_REQUEST_ITEM', {
          idRequest: item.request._id,
          item
        });
      }
      if (!cancelRequest) {
        io.to(`request-detail-${team._id}`).emit('UPDATE_REQUEST_ITEM', {
          idRequest: item.request._id,
          item
        });
      }
      res.status(200).json({
        ...item
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      logger.error(`RequestController.apiPatchItem: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      res.status(500).json(e);
    }
  }

  private getRequets(filter: any, options: PaginateOptions): Promise<PaginateResult<IRequestModel>> {
    return new Promise((resolve, reject) => {
      Request.paginate!(filter, options, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }

  public async downloadItemFiles(req: IRequest, res: Response) {
    const { id } = req.params;
    const team = req.user.team._id;
    try {
      const requestItems = await RequestItem
        .findOne({ _id: id, team })
        .populate(this.itemPopulate);
      if (requestItems) {
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
        const filename = `attachments_${requestItems._id}.zip`;
        archive.on('end', () => {
          console.log(`${filename}: Archive wrote ${(archive.pointer() / (1024 * 1024)).toFixed(2)}MB`);
        });
        res.attachment(filename);
        const filesToDownload: any = [];
        const filesToCompress: any = [];
        for (const file of requestItems.files) {
          const destDirectory = `/tmp/${file._id}_${file.file.name}`;
          filesToDownload.push(() => this.downloadFile(decodeURI(file.file.url), destDirectory));
          filesToCompress.push({
            destDirectory,
            name: file.file.name
          });
        }
        // download files
        console.log('EXECUTE PROMISES');
        let results: any[] = [];
        let numb = 1;
        while (filesToDownload.length) {
          console.log('promise', numb);
          results = [...results, ...await bluebird.all(filesToDownload.splice(0, 20).map((promise: any) => promise()))];
          numb++;
        }
        // compress files
        console.log('EXECUTE COMPRESS');
        filesToCompress.map((file: any) => {
          archive.file(file.destDirectory, {
            name: file.name
          });
          setTimeout(() => {
            if (fs.existsSync(file.destDirectory)) {
              console.log(`clear ${file.destDirectory}`);
              fs.unlink(file.destDirectory, (err) => {
                if (err) {
                  console.log(err);
                }
              });
            }
          }, 7200000);
        });
        console.log('results', results);
        res.setHeader('size', results.reduce((a: number, b: number) => a + b));
        archive.pipe(res);
        archive.finalize();
      } else {
        res.status(404).json({ message: 'Not found' });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      logger.error(`RequestController.downloadItemFiles: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      res.status(500).json(e);
    }
  }

  private async downloadFile(url: string, dest: string): Promise<number> {
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
            resolve(response.headers['content-length'] ? parseInt(response.headers['content-length'], 10) : 0);
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

  public async searchVin(req: IRequest, res: Response) {
    const { team } = req.user;
    const { vin, material } = req.query as IStringKeyObject<string>;
    if (team._id.toString() === '5bf2de35caf8ef7096105cdd') {
      // const data = await this.searchVinContecta('014688');
      let data: any [] = [];
      if (vin?.length >= 6) {
        data = await this.searchVinContecta(vin);
        data = data.filter((car) => car.material === material);
      }
      res.json({ data });
    } else {
      //defaul other teams
      res.json({ data: [], a: 2 });
    }
  }

  private async searchVinContecta(vin: string): Promise<any[]> {
    return new Promise((resolve) => {
      const data = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:sap-com:document:sap:rfc:functions"><soapenv:Header/><soapenv:Body><urn:ZPM_GET_EQUIPMENTS><LAST_PART_EQUIPMENT_NO>${vin}</LAST_PART_EQUIPMENT_NO></urn:ZPM_GET_EQUIPMENTS></soapenv:Body></soapenv:Envelope>`;
      const config = {
        headers: {
          'Content-Type': 'text/xml',
          'SOAPAction': 'http://sap.com/xi/WebService/soap1.1',
          'Content-Length': `${Buffer.byteLength(data)}`
        },
        auth: {
          username: 'USR_SOA_PI',
          password: 'Inicio.2130'
        }
      };
      const instance = axios.create(config);
      instance.post(`${process.env.SALFA_SOAP}/XISOAPAdapter/MessageServlet?senderParty=&senderService=BC_OBTENER_EQUIPOS&receiverParty=&receiverService=&interface=ObtenerEquiposRequestConfirmation_Out&interfaceNamespace=urn:salfa.cl:salfa:ObtenerEquipos`,
        data
      )
        .then(async (response) => {
          xml2js.parseString(response.data, (error, result) => {
            const data = [];
            for (const equipment of result['SOAP:Envelope']['SOAP:Body']) {
              for (const detail of equipment['ns0:ZPM_GET_EQUIPMENTS.Response']) {
                const items = detail['EQUIPMENTS_INFO'][0]['item'];
                for (const item of items) {
                  const denomination = item.hasOwnProperty('MODEL') ? item['MODEL'][0] : '';
                  const version = item.hasOwnProperty('VERSION') ? item['VERSION'][0] : '';
                  let material = item.hasOwnProperty('MATERIAL') ? item['MATERIAL'][0] : '';
                  material = material.substr(material.length > 6 ? material.length - 6 : 0);
                  // if (materialSearch === material) {
                  data.push({
                    vin: item.hasOwnProperty('EQUIPMENT_NO') ? item['EQUIPMENT_NO'][0] : '',
                    brand: item.hasOwnProperty('BRAND') ? item['BRAND'][0] : '',
                    denomination: `${denomination}${version ? ` ${version}` : ''}`,
                    material,
                    color: item.hasOwnProperty('COLOR') ? item['COLOR'][0] : ''
                  });
                  // }
                }
              }
            }
            resolve(data);
          });
        })
        .catch(function(error) {
          console.log(error);
          resolve([])
        });
    });
  }

  public async uploadFile(req: IRequest, res: Response) {
    const { company } = req.user;
    const team = req.user.team._id;
    logger.info(`RequestController.uploadFile`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
    const file: any = GeneralUtils.getFileFromRequest(req.files, 'file');
    if (file) {
      try {
        const requestFile = new RequestFile();
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
        requestFile.user = req.user._id;
        requestFile.company = company._id;
        // fix exif
        if (new RegExp('\\bimage\\b').test(file.mimetype)) {
          try {
            await this.autoRotate(file.path);
          } catch (e) {
            logger.error('RequestController.uploadFile: Error making autoRotate');
          }
        }
        await requestFile.attach('file', file);

        if (new RegExp('\\bimage\\b').test(file.mimetype)) {
          try {
            await this.resizeImage(file.path);
            await requestFile.attach('thumbnail', file);
          } catch (e) {
            logger.error('RequestController.uploadFile: Error making thumbnail');
          }
        }

        await requestFile.save();
        res.status(201).json({
          data: {
            _id: requestFile._id,
            file: requestFile.file
          },
          status: 201
        });
      } catch (e) {
        /* istanbul ignore next */
        logger.error(`RequestController.uploadFile: Async Error.`);
        /* istanbul ignore next */
        logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
        /* istanbul ignore next */
        logger.error(e);
        /* istanbul ignore next */
        res.status(400).json(e);
      }
    } else {
      logger.error(`RequestController.uploadFile: The file are required.`);
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      /* istanbul ignore next */
      res.status(400).json({
        message: 'La imagen es obligatoria.',
        status: 400
      });
    }
  }

  private autoRotate(path: string): Promise<any> {
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
            resolve({});
          }
        });
    });
  }

  private resizeImage(path: string): Promise<boolean> {
    // doc http://aheckmann.github.io/gm/docs.html
    /**** REQUIRE *****
     brew install imagemagick
     brew install graphicsmagick
     * */
    return new Promise((resolve, reject) => {
      GraphicsMagick(path)
        .resize(100, 100)
        .write(path, (err) => {
          if (err) {
            /* istanbul ignore next */
            reject(err);
          } else {
            resolve(true);
          }
        });
    });
  }
}

export default new RequestController();
