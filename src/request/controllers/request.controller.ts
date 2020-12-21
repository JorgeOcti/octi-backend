import * as excel from 'exceljs';
import { Response } from 'express';
import * as moment from 'moment';
import { CustomLabels, PaginateOptions, PaginateResult, QueryPopulateOptions } from 'mongoose';
import * as tempfile from 'tempfile';
import Car, { ChoicesStatusCar } from '../../app/models/car.model';
import Team from '../../app/models/team.model';
import Participant from '../../form/models/participant.model';
import { IRequest } from '../../interfaces/global.interface';
import InventoryCar from '../../inventory/models/inventoryCar.model';
import { io } from '../../server';
import logger from '../../services/logger.service';
import Request, { IRequestModel } from '../models/request.model';
import RequestItem, { IRequestItemModel } from '../models/requestItem.model';
import RequestItemStatus from '../models/requestItemStatus.model';

class RequestController {

  private itemPopulate: QueryPopulateOptions[] = [{
    path: 'car'
  }, {
    path: 'request'
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
  }];

  private requestPopulate: QueryPopulateOptions[] = [{
    path: 'origin',
    select: ['name']
  }, {
    path: 'destination',
    select: ['name']
  }, {
    path: 'createdBy',
    select: ['firstName', 'lastName']
  }, {
    path: 'items',
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
    this.apiList = this.apiList.bind(this);
    this.apiListItems = this.apiListItems.bind(this);
    this.apiDetail = this.apiDetail.bind(this);
    this.apiCreate = this.apiCreate.bind(this);
    this.getRequets = this.getRequets.bind(this);
    this.apiPatchItem = this.apiPatchItem.bind(this);
    this.apiDeleteRequest = this.apiDeleteRequest.bind(this);
    this.apiDeleteRequestItem = this.apiDeleteRequestItem.bind(this);
    this.apiCreateItem = this.apiCreateItem.bind(this);
    this.exportExcel = this.exportExcel.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    res.render('app/index', { token: await req.user.generateToken() });
  }

  public async apiCreate(req: IRequest, res: Response) {
    const { team, company } = req.user;
    const { cars, venue, fleet } = req.body;

    try {
      const defaultItemStatus = await RequestItemStatus.findOneOrCreate({ team, default: true }, { name: 'Pendiente', default: true, team, weigth: 10 });
      const updateTeam = await Team.findOne({ _id: team._id });
      const request = await new Request({
        team,
        number: updateTeam!.requestNumber + 1,
        origin: venue,
        destination: venue,
        // status,
        fleet,
        createdBy: req.user
      }).save();
      for (const car of cars) {
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
        await new RequestItem({
          team,
          request,
          car: newCar,
          reason: car.reason,
          washed: car.washed,
          equipment: car.equipment,
          priority: car.priority,
          origin: venue,
          destination: venue,
          status: defaultItemStatus,
          createdBy: req.user
        }).save();
      }
      await Team.findOneAndUpdate({ _id: team._id }, { $inc: { requestNumber: 1 } }, { new: true });
      const newRequest = await Request.findById(request._id).populate(this.requestPopulate);
      io.to(`request-list-${team}`).emit('CREATE_REQUEST', {
        request: newRequest
      });
      io.to(`request-detail-${team}`).emit('CREATE_REQUEST', {
        request: newRequest
      });
      res.json({
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
    const { team } = req.user;
    const { page, pageSize, orderBy, orderType } = req.query as { page: string; pageSize: string; search: string; orderBy: string; orderType: string };
    try {
      const requestsAggregate = RequestItem.aggregate([{
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
        $project: {
          '_id': 1,
          'request': 1,
          'priority': 1,
          'observation': 1,
          'equipment': 1,
          'washed': 1,
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
        $sort: { [orderBy]: orderType === 'ascending' ? 1 : -1 }
      }]);
      const options = {
        page: parseInt(page ? page : '1', 10),
        limit: parseInt(pageSize ? pageSize : '10', 10),
        customLabels: this.aggregateCustomLabels
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
          results: requests.docs,
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
    const { team } = req.user;
    try {
      const requestItems = await RequestItem.aggregate<IRequestItemModel>([{
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
        $project: {
          '_id': 1,
          'request': 1,
          'priority': 1,
          'observation': 1,
          'equipment': 1,
          'washed': 1,
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
      }]);
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Usuarios', {
        properties: {
          defaultRowHeight: 30
        }, pageSetup: {
          fitToPage: true, fitToHeight: 100, fitToWidth: 1
        }
      });
      /* headers */
      worksheet.columns = [{
        header: 'Solicitud', key: 'request', width: 10
      }, {
        header: 'Destino', key: 'destination', width: 20
      }, {
        header: 'Marca', key: 'brand', width: 20
      }, {
        header: 'Modelo', key: 'denomination', width: 20
      }, {
        header: 'Material', key: 'material', width: 20
      }, {
        header: 'Color', key: 'color', width: 20
      }, {
        header: 'VIN', key: 'vin', width: 20
      }, {
        header: 'CDO', key: 'cdo', width: 20
      }, {
        header: 'Estado', key: 'status', width: 20
      }, {
        header: 'Motivo', key: 'reason', width: 20
      }, {
        header: 'Accesorización', key: 'equipment', width: 10
      }, {
        header: 'Carrocero', key: 'body', width: 10
      }, {
        header: 'Pre-Lavado', key: 'washed', width: 10
      }, {
        header: 'Inspección Pre-entrega', key: 'review', width: 10
      }, {
        header: 'Solicitante', key: 'createdBy', width: 20
      }, {
        header: 'Transportista', key: 'carrier', width: 20
      }, {
        header: 'Fecha Carga', key: 'uploadDate', width: 21, style: { numFmt: 'dd/mm/yyyy hh:mm' }
      }, {
        header: 'Fecha LLegada', key: 'estimatedArrival', width: 21, style: { numFmt: 'dd/mm/yyyy hh:mm' }
      }, {
        header: 'Creado', key: 'created', width: 21, style: { numFmt: 'dd/mm/yyyy hh:mm' }
      }];
      for (const item of requestItems) {
        worksheet.addRow({
          request: item.request.number,
          destination: item.destination.name,
          brand: item.car.brand,
          denomination: item.car.denomination,
          material: item.car.material,
          vin: item.car.vin,
          cdo: item.car.internalNumber,
          color: item.car.color,
          status: item.status.name,
          reason: item.reason.name,
          equipment: item.equipment ? 'Si' : 'No',
          body: item.body ? 'Si' : 'No',
          washed: item.washed ? 'Si' : 'No',
          review: item.review ? 'Si' : 'No',
          createdBy: `${item.createdBy.firstName} ${item.createdBy.lastName}`,
          carrier: item.carrier ? item.carrier.name : '',
          uploadDate: item.uploadDate,
          estimatedArrival: item.estimatedArrival,
          created: item.createdAt
        });
      }
      const tempFilePath = tempfile('.xlsx');
      await workbook.xlsx.writeFile(tempFilePath);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=requests.xlsx');
      return res.sendFile(tempFilePath);
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
    const { team } = req.user;
    const { page, pageSize, search, orderBy, orderType } = req.query as { page: string; pageSize: string; search: string; orderBy: string; orderType: string };
    // paginate options
    const options: PaginateOptions = {
      sort: {
        [orderBy]: orderType === 'ascending' ? 1 : -1
      },
      populate: this.requestPopulate,
      // select: {_id: true},
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
    const { team } = req.user;
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

  public async apiDeleteRequest(req: IRequest, res: Response) {
    logger.info(`RequestController.apiDeleteRequest`);
    const { team } = req.user;
    const { id } = req.params;
    try {
      const request = await Request
        .findOne({
          _id: id,
          team
        });
      if (request) {
        await RequestItem.find({_id: id,team}).remove();
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
    const { team } = req.user;
    const { id } = req.params;
    try {
      const item = await RequestItem
        .findOne({
          _id: id,
          team
        })
        .populate(this.itemPopulate);
      if (item) {
        await item.remove();
        await Request.update({ _id: item.request._id }, { $set: { updatedAt: moment() } });
        io.to(`request-list-${team}`).emit('DELETE_REQUEST_ITEM', {
          idRequest: item.request._id,
          item
        });
        io.to(`request-detail-${team}`).emit('DELETE_REQUEST_ITEM', {
          idRequest: item.request._id,
          item
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
      logger.error(`RequestController.apiDeleteRequestItem: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}, params: ${JSON.stringify(req.params)}`);
      logger.error(e);
      res.status(500).json(e);
    }
  }

  public async searhCar(req: IRequest, res: Response) {
    logger.info(`RequestController.searhCar`);
    const { team } = req.user;
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
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
    const { team, company } = req.user;
    const { car, idRequest } = req.body;
    try {
      const request = await Request.findOne({ _id: idRequest, team });
      if(request){
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
        const item = await RequestItem.findOne({_id: newItem._id}).populate(this.itemPopulate);
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

  public async apiPatchItem(req: IRequest, res: Response) {
    logger.info(`RequestController.apiPatchItem`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
    const { team } = req.user;
    const updateObject = req.body;
    const { id } = req.params;
    try {
      const requestItem = await RequestItem.findOneAndUpdate({ _id: id, team }, { $set: { ...updateObject } }).populate([{ path: 'car' }]);
      if (Object.keys(updateObject.car).length) {
        const existCar = await Car.findOne({ team, vin: updateObject.car.vin });
        if (existCar && requestItem && existCar.vin !== requestItem.car.vin) {
          // validate exist car and change vin
          await RequestItem.update({ _id: id, team }, { $set: { car: existCar } });
        } else if (requestItem && requestItem.car.vin !== updateObject.car.vin) {
          // validate chamge vin
          const inventories = await InventoryCar.find({ car: requestItem.car }).count();
          const participants = await Participant.find({ team, car: requestItem.car }).count();
          const requests = await RequestItem.find({ team, car: requestItem.car, _id: { $ne: requestItem._id } }).count();
          if (inventories || participants || requests) {
            // validate car has actions in the system
            delete updateObject.car._id;
            const newCar = await new Car(updateObject.car).save();
            await RequestItem.update({ _id: id, team }, { $set: { car: newCar } });
          } else {
            await Car.update({ _id: updateObject.car._id, team }, { $set: updateObject.car });
          }
        } else {
          await Car.update({ _id: updateObject.car._id, team }, { $set: updateObject.car });
        }
      }
      const item = await RequestItem
        .findOne({ _id: id, team })
        .populate(this.itemPopulate)
        .lean();
      await Request.update({ _id: item.request._id }, { $set: { updatedAt: moment() } });
      io.to(`request-list-${team}`).emit('UPDATE_REQUEST_ITEM', {
        idRequest: item.request._id,
        item
      });
      io.to(`request-detail-${team}`).emit('UPDATE_REQUEST_ITEM', {
        idRequest: item.request._id,
        item
      });
      res.status(200).json({
        ...item
      });
      // todo: send update object to socket team
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
      Request.paginate(filter, options, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new RequestController();
