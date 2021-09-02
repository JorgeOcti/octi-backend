import { IRequest } from '../../interfaces/global.interface';
import { Response } from 'express';
import { PaginateOptions, PaginateResult } from 'mongoose';
import Transmittal, { ChoicesStatusTransmittal, ITransmittalModel } from '../models/transmittal.model';
import logger from '../../services/logger.service';
import TransmittalItem from '../models/transmittalItem.model';
import TransmittalFile from '../models/transmittalFile.model';
import GeneralUtils from '../../utils/general.utils';
import * as GraphicsMagick from 'gm';
import Team from '../../app/models/team.model';
import Car from '../../app/models/car.model';
import RequestItem from '../../request/models/requestItem.model';
import { io } from '../../server';
import * as excel from 'exceljs';
import * as moment from 'moment-timezone';
import Milestone from '../models/milestone.model';


class TransmittalController {

  public itemPopulate = [{
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
  }, {
    path: 'revisions',
    select: ['_id', 'hasDamages', 'receptionConfirmation', 'shippingConfirmation', 'createdAt'],
    options: {
      sort: {
        _id: -1
      }
    }
  }];

  constructor() {
    this.index = this.index.bind(this);
    this.apiList = this.apiList.bind(this);
    this.apiOnlyMe = this.apiOnlyMe.bind(this);
    this.apiDetail = this.apiDetail.bind(this);
    this.apiCreate = this.apiCreate.bind(this);
    this.apiUpdate = this.apiUpdate.bind(this);
    this.apiDelete = this.apiDelete.bind(this);
    this.xlsExport = this.xlsExport.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
    this.attachEvidence = this.attachEvidence.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    res.render('app/index', { token: await req.user.generateToken() });
  }

  public async apiDetail(req: IRequest, res: Response) {
    logger.info(`TransmittalController.apiDetail`);
    res.json({
      api: 'TransmittalController:apiDetail'
    });
  }

  public async apiCreate(req: IRequest, res: Response) {
    logger.info(`TransmittalController.apiCreate`);
    const { name, items, files, transporter, observation } = req.body;
    const { user } = req;
    try {
      const team = await Team.findOneAndUpdate({ _id: user.team._id }, { $inc: { transmittalNumber: 1 } }, { new: true });
      // create new transmittal
      const transmittal = await new Transmittal({
        name,
        team: user.team,
        number: team!.transmittalNumber,
        createdBy: user._id,
        transporter,
        observation
      }).save();

      for (const item of items) {
        // update cars params
        await Car.findOneAndUpdate({
          team: user.team,
          _id: item.car._id
        }, {
          client: item.car.client,
          bl: item.car.bl
        });
        // create transmittal items
        const transmittalItem = await new TransmittalItem({
          ...item,
          team,
          transmittal
        }).save();
        // associate request item with transmittal and transmittal item
        await RequestItem.findOneAndUpdate({
          _id: item.requestItem
        }, {
          assigned: true,
          transmittal: transmittal._id,
          transmittalItem: transmittalItem._id
        });
      }

      if (files && files.length) {
        await transmittal.updateOne({ files });
        await TransmittalFile.updateMany({
          _id: { $in: files }
        }, {
          $set: { transmittal }
        });
      }

      io.to(`transmittal-list-${team!._id}`).emit('CREATE_TRANSMITTAL', {
        transmittal
      });

      res.json({
        status: 200
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`TransmittalController.apiCreate: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      res.status(500).json(e);
    }
  }

  public async apiUpdate(req: IRequest, res: Response) {
    try {
      logger.info(`TransmittalController.apiUpdate`);
      const { id } = req.params;
      const { body: transmittal } = req;
      const { team } = req.user;

      const populate = [{
        path: 'transporter.carrier',
        select: ['name']
      }, {
        path: 'transporter.driver',
        select: ['firstName', 'lastName']
      }, {
        path: 'items',
        select: ['car', 'requestItem', 'destination', 'origin', 'loadingDate', 'arrivalDate'],
        populate: this.itemPopulate
      }, {
        path: 'files',
        select: ['file', 'thumbnail']
      }, {
        path: 'createdBy',
        select: ['firstName', 'lastName']
      }];

      let newTransmittal: any;
      if(transmittal.allLoadingDate){
        await TransmittalItem.updateMany({ transmittal: id }, { $set: {loadingDate: transmittal.allLoadingDate}});
        newTransmittal =  await Transmittal
          .findOne({ _id: id })
          .populate(populate);
      } else if(transmittal.allArrivalDate){
        await TransmittalItem.updateMany({ transmittal: id }, { $set: {arrivalDate: transmittal.allArrivalDate}});
        newTransmittal =  await Transmittal
          .findOne({ _id: id })
          .populate(populate);
      } else {
        newTransmittal = await Transmittal
          .findOneAndUpdate({ _id: id }, { $set: transmittal }, { new: true })
          .populate(populate);
      }

      io.to(`transmittal-list-${team._id}`).emit('UPDATE_TRANSMITTAL', {
        transmittal: newTransmittal
      });
      res.json({
        data: newTransmittal
      });
    } catch (e) {
      console.log(e);
      /* istanbul ignore next */
      logger.error(`TransmittalController.apiUpdate: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      res.status(500).json(e);
    }
  }

  public async apiDelete(req: IRequest, res: Response) {
    logger.info(`TransmittalController.apiDelete`);
    res.json({
      api: 'TransmittalController:apiDelete'
    });
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
        select: ['car', 'requestItem', 'destination', 'origin', 'loadingDate', 'arrivalDate', 'observation'],
        populate: this.itemPopulate
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
        select: ['car', 'requestItem', 'destination', 'origin', 'loadingDate', 'arrivalDate', 'revisions'],
        populate: [{
          path: 'car',
          select: ['invoice', 'entry', 'denomination', 'patent', 'material', 'vin', 'brand', 'color']
        }, {
          path: 'request',
          select: ['number']
        }, {
          path: 'revisions',
          select: ['_id', 'hasDamages', 'receptionConfirmation', 'shippingConfirmation', 'createdAt'],
          options: {
            sort: {
              _id: -1
            }
          }
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
        const millestones = await Milestone.find({
          team
        }).populate([{
          path: 'form'
        }]);
        res.json({
          count: transmittals.total,
          pages: transmittals.pages,
          hasPrevious: options.page && options.page > 1 && transmittals.pages && transmittals.pages >= options.page,
          hasNext: options.page && transmittals.pages && transmittals.pages > options.page,
          results: transmittals.docs.map((transmittal) => ({
            ...transmittal.toObject(),
            millestones
          })),
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

  public async attachEvidence(req: IRequest, res: Response) {
    const { user } = req;
    const { files, transmittal } = req.body;
    logger.info(`TransmittalController.uploadFile`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
    try {
      const transmittalData = await Transmittal
        .findOneAndUpdate({
          _id: transmittal,
          team: user.team._id
        }, {
          $push: { evidenceFullLoad: files },
          status: ChoicesStatusTransmittal.inTransit
        }, { new: true });
      //  TODO: need update socket from here
      res.status(200).json({
        data: transmittalData,
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
  }

  public async xlsExport(req: IRequest, res: Response) {
    logger.info(`TransmittalController.xlsExport`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
    const team = req.user.team._id;
    try {
      // Create columns/headers for excel
      let columns = [{
        header: '# Orden transporte', key: 'transmittalNumber', width: 30
      }, {
        header: '# Solicitud', key: 'requestNumber', width: 30
      }, {
        header: 'Chofer', key: 'driver', width: 30
      }, {
        header: 'Transportista', key: 'carrier', width: 30
      }, {
        header: 'VIN', key: 'vin', width: 30
      }, {
        header: 'Marca', key: 'brand', width: 30
      }, {
        header: 'Modelo', key: 'denomination', width: 30
      }, {
        header: 'Color', key: 'color', width: 30
      }, {
        header: 'Observación', key: 'observation', width: 30
      }, {
        header: 'Fecha', key: 'createdAt', width: 30, style: {
          numFmt: 'dd/mm/yyyy hh:mm'
        }
      }];
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=distribution-${moment().format('YYYY-MM-DD')}.xlsx`);
      const options = {
        stream: res,
        useStyles: true,
        useSharedStrings: true
      };
      const workbook = new excel.stream.xlsx.WorkbookWriter(options);
      const worksheet = workbook.addWorksheet('Rotación de unidades', {
        pageSetup: {
          fitToPage: true, fitToHeight: 100, fitToWidth: 1
        }
      });
      worksheet.columns = columns;

      const cursor = await Transmittal
        .find({ team })
        .populate([{
          path: 'transporter.carrier',
          select: ['name']
        }, {
          path: 'transporter.driver',
          select: ['firstName', 'lastName']
        }, {
          path: 'items',
          select: ['car', 'requestItem', 'destination', 'origin', 'loadingDate', 'arrivalDate', 'observation', 'createdAt'],
          populate: this.itemPopulate
        }, {
          path: 'files',
          select: ['file', 'thumbnail']
        }, {
          path: 'createdBy',
          select: ['firstName', 'lastName']
        }])
        .batchSize(100)
        .cursor();

      cursor.on('data', async (transmittal) => {
        // const row = await this.processParticipant(participant);
        for (const item of transmittal.items) {
          worksheet.addRow({
            transmittalNumber: transmittal.number,
            requestNumber: item.request.number,
            driver: `${transmittal.transporter?.driver?.firstName} ${transmittal.transporter?.driver?.lastName}`,
            carrier: transmittal.transporter?.carrier?.name,
            vin: item.car?.vin,
            brand: item.car?.brand,
            denomination: item.car?.denomination,
            color: item.car?.color,
            observation: item.observation,
            createdAt: item.createdAt
          }).commit();
        }
      });

      // code to handle connection abort or finish query read process
      cursor.on('end', async () => {
        await workbook.commit();
        res.status(200);
      });

      cursor.on('error', (error) => logger.error(error.message));

      // code to handle connection abort or finish of data send
      req.connection.on('close', async () => {
        await cursor.close();
        res.status(200);
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`TransmittalController.xlsExport: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
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
    const { user } = req;
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
