import {IRequest} from "../../interfaces/global.interface";
import {Response} from "express";
import { PaginateOptions, PaginateResult} from "mongoose";
import Transmittal, {ChoicesStatusTransmittal, ITransmittalModel} from "../models/transmittal.model";
import logger from "../../services/logger.service";
import TransmittalItem from "../models/transmittalItem.model";
import {ITransmittalItem} from "../../interfaces/transmittalItem.interface";
import TransmittalFile from "../models/transmittalFile.model";
import GeneralUtils from "../../utils/general.utils";
import * as GraphicsMagick from "gm";
import Team from "../../app/models/team.model";
import Car from "../../app/models/car.model";


class TransmittalController {

  constructor() {
    this.index = this.index.bind(this);
    this.apiList = this.apiList.bind(this);
    this.apiOnlyMe = this.apiOnlyMe.bind(this);
    this.apiDetail = this.apiDetail.bind(this);
    this.apiCreate = this.apiCreate.bind(this);
    this.apiDelete = this.apiDelete.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    res.render('app/index', {token: await req.user.generateToken()});
  }

  public async apiDetail(req: IRequest, res: Response) {
    logger.info(`TransmittalController.apiDetail`);
    res.json({
      api: 'TransmittalController:apiDetail'
    })
  }

  public async apiCreate(req: IRequest, res: Response) {
    logger.info(`TransmittalController.apiCreate`);
    const {name, items, files, transporter} = req.body;
    const {user} = req;
    try {
      const team = await Team.findOneAndUpdate({ _id: user.team._id }, { $inc: { transmittalNumber: 1 } }, { new: true });
      const transmittal = new Transmittal({
        name,
        team: user.team,
        number: team!.transmittalNumber,
        createdBy: user._id,
        transporter
      });
      await transmittal.save();
      await Promise.all(
        items.map((item: ITransmittalItem) => {
          return Car.findOneAndUpdate({
            team: user.team,
            _id: item.car._id
          }, {
            client: item.car.client,
            bl: item.car.bl
          })
        })
      );
      await Promise.all(
        items.map((item: ITransmittalItem) => (
          new TransmittalItem({
            ...item,
            transmittal
          }).save()
        ))
      );
      if(files && files.length){
        transmittal.files = files;
        await transmittal.save();
        await TransmittalFile.updateMany({_id: {$in: files}}, {$set: {transmittal}})
      }
      res.json({
        status: 200
      })
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`TransmittalController.apiCreate: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      res.status(500).json(e);
    }
  }

  public async apiDelete(req: IRequest, res: Response) {
    logger.info(`TransmittalController.apiDelete`);
    res.json({
      api: 'TransmittalController:apiDelete'
    })
  }

  public async apiList(req: IRequest, res: Response) {
    logger.info(`TransmittalController.apiList`);
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
        [orderBy || '_id']: orderType === 'ascending' ? 1 : -1
      },
      populate: [{
        path: 'transporter.carrier',
        select: ['name']
      }, {
        path: 'transporter.driver',
        select: ['firstName', 'lastName']
      }, {
        path: 'items',
        select: ['car', 'requestItem', 'destination', 'origin', 'loadingDate', 'arrivalDate'],
        populate: [{
          path: 'car',
          select: ['invoice', 'entry', 'denomination', 'patent', 'material', 'vin', 'brand', 'color']
        }, {
          path: 'request',
          select: ['number']
        }, {
          path: 'destination',
          select: ['name']
        }, {
          path: 'origin',
          select: ['name']
        }]
      }, {
        path: 'files',
        select: ['file', 'thumbnail']
      }, {
        path: 'createdBy',
        select: ['firstName', 'lastName']
      }],
      page: parseInt(page ? page : '1', 10),
      limit: parseInt(pageSize ? pageSize : '20', 10)
    };
    const filter: any = {
      team
    };
    if (search) {
      // add here conditions to search
    }
    try {
      const transmittals = await this.getTransmittals(filter, options);
      /* istanbul ignore if  */
      if (options.page && transmittals.pages && transmittals.pages < options.page) {
        res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        res.json({
          count: transmittals.total,
          pages: transmittals.pages,
          hasPrevious: options.page && options.page > 1 && transmittals.pages && transmittals.pages >= options.page,
          hasNext: options.page && transmittals.pages && transmittals.pages > options.page,
          results: transmittals.docs,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`TransmittalController.apiList: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      res.status(500).json(e);
    }
  }

  public async apiOnlyMe(req: IRequest, res: Response) {
    logger.info(`TransmittalController.apiOnlyMe`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
    const team = req.user.team._id;
    const {
      page,
      pageSize,
      orderBy,
      orderType
    } = req.query as { page: string; pageSize: string; orderBy: string; orderType: string };
    // paginate options
    const options: PaginateOptions = {
      sort: {
        [orderBy || '_id']: orderType === 'ascending' ? 1 : -1
      },
      populate: [{
        path: 'transporter.carrier',
        select: ['name']
      }, {
        path: 'transporter.driver',
        select: ['firstName', 'lastName']
      }, {
        path: 'items',
        select: ['car', 'requestItem', 'destination', 'origin', 'loadingDate', 'arrivalDate'],
        populate: [{
          path: 'car',
          select: ['invoice', 'entry', 'denomination', 'patent', 'material', 'vin', 'brand', 'color']
        }, {
          path: 'request',
          select: ['number']
        }, {
          path: 'destination',
          select: ['name']
        }, {
          path: 'origin',
          select: ['name']
        }]
      }, {
        path: 'createdBy',
        select: ['firstName', 'lastName']
      }],
      page: parseInt(page ? page : '1', 10),
      limit: parseInt(pageSize ? pageSize : '20', 10)
    };
    const filter: any = {
      team,
      'transporter.driver': req.user._id,
      status: {
        $in: [ChoicesStatusTransmittal.pending, ChoicesStatusTransmittal.inTransit]
      }
    };
    try {
      const transmittals = await this.getTransmittals(filter, options);
      /* istanbul ignore if  */
      if (options.page && transmittals.pages && transmittals.pages < options.page) {
        res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        res.json({
          count: transmittals.total,
          pages: transmittals.pages,
          hasPrevious: options.page && options.page > 1 && transmittals.pages && transmittals.pages >= options.page,
          hasNext: options.page && transmittals.pages && transmittals.pages > options.page,
          results: transmittals.docs,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`TransmittalController.apiOnlyMe: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      res.status(500).json(e);
    }
  }

  private getTransmittals(filter: any, options: PaginateOptions): Promise<PaginateResult<ITransmittalModel>> {
    return new Promise((resolve, reject) => {
      Transmittal.paginate!(filter, options, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }

  public async uploadFile(req: IRequest, res: Response) {
    const {user} = req;
    logger.info(`TransmittalController.uploadFile`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
    const file: any = GeneralUtils.getFileFromRequest(req.files, 'file');
    if (file) {
      try {
        const transmittaltFile = new TransmittalFile();
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
        file.team = user.team._id;
        transmittaltFile.user = user._id;
        transmittaltFile.team = user.team._id;
        // fix exif
        if (new RegExp('\\bimage\\b').test(file.mimetype)) {
          try {
            await this.autoRotate(file.path);
          } catch (e) {
            logger.error('TransmittalController.uploadFile: Error making autoRotate');
          }
        }
        await transmittaltFile.attach('file', file);

        if (new RegExp('\\bimage\\b').test(file.mimetype)) {
          try {
            await this.resizeImage(file.path);
            await transmittaltFile.attach('thumbnail', file);
          } catch (e) {
            logger.error('TransmittalController.uploadFile: Error making thumbnail');
          }
        }

        await transmittaltFile.save();
        res.status(201).json({
          data: {
            _id: transmittaltFile._id,
            file: transmittaltFile.file
          },
          status: 201
        });
      } catch (e) {
        /* istanbul ignore next */
        logger.error(`TransmittalController.uploadFile: Async Error.`);
        /* istanbul ignore next */
        logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
        /* istanbul ignore next */
        logger.error(e);
        /* istanbul ignore next */
        res.status(400).json(e);
      }
    } else {
      logger.error(`TransmittalController.uploadFile: The file are required.`);
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

export default new TransmittalController();
