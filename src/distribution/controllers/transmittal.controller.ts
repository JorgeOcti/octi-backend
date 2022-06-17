import {IAnyObject, IRequest} from "../../interfaces/global.interface";
import {Response} from "express";
import { PaginateOptions, PaginateResult } from 'mongoose';
import Transmittal, {ChoicesStatusTransmittal, ITransmittalModel} from "../models/transmittal.model";
import logger from "../../services/logger.service";
import TransmittalItem from "../models/transmittalItem.model";
import TransmittalFile from "../models/transmittalFile.model";
import GeneralUtils from "../../utils/general.utils";
import * as GraphicsMagick from "gm";
import Team from "../../app/models/team.model";
import Car from "../../app/models/car.model";
import RequestItem from "../../request/models/requestItem.model";
import {io} from "../../server";
import * as excel from "exceljs";
import * as moment from "moment-timezone";
import Milestone  from "../models/milestone.model";
import FormModel, {IFormModel, KindQuestion} from "../../form/models/form.model";
import ScaleModel, {IScaleModel} from "../../form/models/scale.model";
import redisClient from "../../services/redis.service";
import * as archiver from 'archiver';
import * as bluebird from 'bluebird';
import * as fs from 'fs';
import * as https from 'https';
import { IUser } from '../../app/interfaces';


class TransmittalController {

  public itemPopulate = [{
    path: 'car',
    select: ['invoice', 'entry', 'denomination', 'patent', 'material', 'vin', 'brand', 'color', 'bl']
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
    // options: {
    //   sort: {
    //     _id: -1
    //   }
    // }
  }];

  /*readonly aggregateCustomLabels: CustomLabels = {
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
  };*/

  public populate = [{
    path: 'transporter.carrier',
    select: ['name']
  }, {
    path: 'type',
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
    select: ['file', 'thumbnail'],
    // match: { milestone: { $exists: false } }
  }, {
    path: 'evidenceFullLoad',
    select: ['file', 'thumbnail']
  }, {
    path: 'createdBy',
    select: ['firstName', 'lastName']
  }];

  constructor() {
    this.index = this.index.bind(this);
    this.apiList = this.apiList.bind(this);
    this.apiOnlyMe = this.apiOnlyMe.bind(this);
    this.apiDetail = this.apiDetail.bind(this);
    this.apiCreate = this.apiCreate.bind(this);
    this.apiPatch = this.apiPatch.bind(this);
    this.apiUpdate = this.apiUpdate.bind(this);
    this.apiDelete = this.apiDelete.bind(this);
    this.xlsExport = this.xlsExport.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
    this.downloadTransmittalFiles = this.downloadTransmittalFiles.bind(this);
    this.downloadFile = this.downloadFile.bind(this);
    this.attachEvidence = this.attachEvidence.bind(this);
    this.fillFormSections = this.fillFormSections.bind(this);
    this.getScales = this.getScales.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    res.render('app/index', { token: await req.user.generateToken() });
  }

  public async apiDetail(req: IRequest, res: Response) {
    try {
      const { id } = req.params;
      logger.info(`TransmittalController.apiDetail {email: ${req.user.email}, id: ${id} }`);
      const transmittal = await Transmittal.findById(id).populate(this.populate);
      res.json({
        data: transmittal
      });
    } catch (e) {
      console.log(e);
      /* istanbul ignore next */
      logger.error(`TransmittalController.apiDetail: Async Error. email: ${req.user.email}`);
      res.status(500).json(e);
    }
  }

  public async apiCreate(req: IRequest, res: Response) {
    try {
      logger.info(`TransmittalController.apiCreate`);
      const { name, items, files, transporter, observation, type } = req.body;
      const { user } = req;
      const team = await Team.findOneAndUpdate({ _id: user.team._id }, { $inc: { transmittalNumber: 1 } }, { new: true });
      // create new transmittal
      const transmittal = await new Transmittal({
        name,
        type,
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
          transmittal,
          loadingDate: moment().toDate()
        }).save();
        // associate request item with transmittal and transmittal item
        if(item.requestItem?.length) {
          await RequestItem.findOneAndUpdate({
            _id: item.requestItem
          }, {
            assigned: true,
            transmittal: transmittal._id,
            transmittalItem: transmittalItem._id
          });
        }
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
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      res.status(500).json(e);
    }
  }

  public async apiUpdate(req: IRequest, res: Response) {
    try {
      // const { id } = req.params;
      logger.info(`TransmittalController.apiUpdate`);
      res.json({
        api: 'TransmittalController:apiUpdate'
      });
    } catch (e) {
      console.log(e);
      /* istanbul ignore next */
      logger.error(`TransmittalController.apiUpdate: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      res.status(500).json(e);
    }

  }

  public async apiPatch(req: IRequest, res: Response) {
    try {
      logger.info(`TransmittalController.apiUpdate`);
      const { id } = req.params;
      const { body: transmittal } = req;
      const { team } = req.user;

      let newTransmittal: any;

      if (transmittal.allLoadingDate) {
        // update all item loading dates
        await TransmittalItem.updateMany({ transmittal: id }, { $set: { loadingDate: transmittal.allLoadingDate } });
        newTransmittal = await Transmittal
          .findOne({ _id: id })
          .populate(this.populate);
      } else if (transmittal.allArrivalDate) {
        // update all item arrival dates
        await TransmittalItem.updateMany({ transmittal: id }, { $set: { arrivalDate: transmittal.allArrivalDate } });
        newTransmittal = await Transmittal
          .findOne({ _id: id })
          .populate(this.populate);
      } else {
        newTransmittal = await Transmittal
          .findOneAndUpdate({ _id: id }, { $set: transmittal }, { new: true })
          .populate(this.populate);
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
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
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
    const team = req.user.team._id;
    const {
      page,
      pageSize,
      search,
      orderBy,
      orderType,
      number
    } = req.query as { page: string; pageSize: string; search: string; orderBy: string; orderType: string; number: string };
    // paginate options
    const options: PaginateOptions = {
      sort: {
        [orderBy || '_id']: orderType === 'ascending' ? 1 : -1
      },
      populate: [{
        path: 'revision',
        select: ['_id', 'hasDamages']
      }, {
        path: 'transporter.carrier',
        select: ['name']
      }, {
        path: 'type',
        select: ['name']
      }, {
        path: 'evidenceFullLoad',
        select: ['file', 'thumbnail', 'milestone']
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
      // allowDiskUse: true,
      lean: true,
      page: parseInt(page ? page : '1', 10),
      limit: parseInt(pageSize ? pageSize : '20', 10)
    };
    const filter: any = {
      team
    };
    if (search) {
      // add here conditions to search
    }
    if (number) {
      filter.number = number;
    }
    try {
      /*const baseAggregate: any[] = [{
        $match: {
          team: mongoose.Types.ObjectId(team),
        }
      }];

      const aggregatePopulate: any[] = [{
        $lookup: {
          from: 'participants',
          localField: '_id',
          foreignField: 'transmittal',
          as: 'revision'
        }
      },{
        $unwind: {
          path: '$revision',
          preserveNullAndEmptyArrays: true
        }
      }, {
        $lookup: {
          from: 'transmittalitems',
          localField: '_id',
          foreignField: 'transmittal',
          as: 'items'
        }
      }, {
        $lookup: {
          from: 'cars',
          localField: 'items.car',
          foreignField: '_id',
          as: 'items.car'
        }
      }, {
        $project: {
          '_id': 1,
          'revision._id': 1,
          'revision.hasDamages': 1,
          // 'items': 1,
          'items.car': 1,
          'items.requestItem': 1,
          'items.destination': 1,
          'items.origin': 1,
          'items.loadingDate': 1,
          'items.arrivalDate': 1,
          'items.observation': 1,
        }
      }];

      logger.info(`TransmittalController.apiList email: ${req.user.email}, query: ${JSON.stringify(req.query)}`);
      logger.debug(`TransmittalController.apiList email: ${req.user.email}, filter: ${JSON.stringify(filter)}`);
      logger.debug(`TransmittalController.apiList email: ${req.user.email}, aggregate: ${JSON.stringify(baseAggregate)}`);
      logger.debug(`TransmittalController.apiList email: ${req.user.email}, populate: ${JSON.stringify(aggregatePopulate)}`);
      const transmittalAggregate = Transmittal.aggregate(baseAggregate).allowDiskUse(true);
      const options: PaginateOptions = {
        page: parseInt(page ? page : '1', 10),
        limit: parseInt(pageSize ? pageSize : '10', 10),
        customLabels: this.aggregateCustomLabels,
        sort: { [orderBy]: orderType === 'ascending' ? 1 : -1 },
        lean: true
      };
      const transmitttals = await Transmittal.aggregatePaginate(transmittalAggregate, options);
      console.log({ $in: transmitttals.docs.map((d) => d._id) })
      if (options.page && transmitttals.pages && transmitttals.pages < options.page) {
        return res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        return res.json({
          count: transmitttals.total,
          pages: transmitttals.pages,
          hasPrevious: transmitttals.hasPrevious,
          hasNext: transmitttals.hasNext,
          results: await Transmittal.aggregate([{
            $match: {
              _id: { $in: transmitttals.docs.map((d) => mongoose.Types.ObjectId(d._id)) }
            }
          }, ...aggregatePopulate]),
          status: 200
        });
      }*/
      logger.info(`TransmittalController.apiList email: ${req.user.email}, query: ${JSON.stringify(req.query)}`);
      logger.debug(`TransmittalController.apiList email: ${req.user.email}, filter: ${JSON.stringify(filter)}`);
      logger.debug(`TransmittalController.apiList email: ${req.user.email}, options: ${JSON.stringify(options)}`);
      const transmittals = await this.getTransmittals(filter, options);
      /* istanbul ignore if  */
      if (options.page && transmittals.pages && transmittals.pages < options.page) {
        return res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        return res.json({
          count: transmittals.total,
          pages: transmittals.pages,
          hasPrevious: transmittals.hasPrevious,
          hasNextPage: transmittals.hasNextPage,
          results: transmittals.docs,
          status: 200
        });
      }
    } catch (e) {
      console.error(e);
      /* istanbul ignore next */
      logger.error(`TransmittalController.apiList: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      return res.status(500).json(e);
    }
  }

  public async apiOnlyMe(req: IRequest, res: Response) {
    logger.info(`TransmittalController.apiOnlyMe`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
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
        path: 'evidenceFullLoad',
        select: ['_id', 'milestone']
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
        let milestones = await Milestone.find({
          team
        });

        for (let i = 0; i < milestones.length; i++) {
          let milestone = milestones[i].toObject();
          let form = await this.fillFormSections(milestone.form, req.user);
          milestones[i] = { ...milestone, ...form };
        }

        res.json({
          count: transmittals.total,
          pages: transmittals.pages,
          hasPrevious: options.page && options.page > 1 && transmittals.pages && transmittals.pages >= options.page,
          hasNext: options.page && transmittals.pages && transmittals.pages > options.page,
          data: transmittals.docs.map((transmittal)=>({
            ...transmittal.toObject(),
            detailedEvidence: transmittal.evidenceFullLoad,
            evidenceFullLoad: transmittal.evidenceFullLoad.map(e => e._id),
            milestones: milestones.filter((milestone) => milestone.type.toString() === transmittal.type.toString())
          })),
          status: 200
        });
      }
    } catch (e) {
      console.error(e);
      /* istanbul ignore next */
      logger.error(`TransmittalController.apiOnlyMe:`, e.toString());
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      res.status(500).json(e);
    }
  }

private getForm(filter: any): Promise<IFormModel> {
  const keyCache = `form-${filter._id}`;
  logger.debug(`keyCache ${keyCache}`);
  return new Promise((resolve, reject) => {
    redisClient.get(keyCache, async (error, result) => {
      if (result) {
        logger.debug(`FROM CACHE`);
        resolve(JSON.parse(result));
      } else {
        logger.debug(`NEW CACHE`);
        FormModel
          .findOne(filter, {
            'company': false,
            'updatedAt': false,
            'createdAt': false,
            'active': false,
            'sections.shortName': false,
            'sections.questions.shortName': false,
            '__v': false
          })
          .populate([{
            path: 'sections.questions.damages',
            select: ['name', 'positions', 'kinds', 'parts', 'partFallback', 'kindFallback'],
            populate: [{
              path: 'positions',
              select: ['name'],
              options: {
                sort: {
                  name: 1
                }
              }
            }, {
              path: 'kinds',
              select: ['name'],
              options: {
                sort: {
                  name: 1
                }
              }
            }, {
              path: 'parts',
              select: ['name'],
              options: {
                sort: {
                  name: 1
                }
              }
            }, {
              path: 'kindFallback',
              select: ['name'],
              options: {
                sort: {
                  name: 1
                }
              }
            }, {
              path: 'partFallback',
              select: ['name'],
              options: {
                sort: {
                  name: 1
                }
              }
            }]
          }])
          .lean()
          .exec((err, form: IFormModel) => {
            if (err) {
              /* istanbul ignore next */
              return reject(err);
            }
            if (form) {
              redisClient.set(keyCache, JSON.stringify(form), 'ex', 60);
              return resolve(form);
            }
            return reject('No se encontro formularío');
          });
      }
    });
  });
}

  public async fillFormSections(formID : String, user: IUser){
    try {
      if (!formID){
        return {};
      }

      let form = await this.getForm({
        _id: formID,
        team: user.team
      });

      const team = user.team;
      // generate array of scale ids
      const scalesIds: any[] = [];
      form.sections.forEach((section) => {
        section.questions.forEach((question) => {
          const scaleID = question.scale ? question.scale.toString() : null;
          if (scaleID && !scalesIds.includes(scaleID)) {
            scalesIds.push(scaleID);
          }
        });
      });

      const extra: IAnyObject = {
        accessories: []
      };
      const extraSection: any = {
        _id: 'extraSection',
        name: '',
        questions: [],
        weight: 0,
        order: form.sections.length + 1
      };
      const extraScales: any = [];
      const response: any = {};

      if (form.shippingVenue) {
        extraSection.questions.push({
          _id: 'shippingVenue',
          question: form.shippingVenueText,
          venues: user.venue.sendTo,
          kind: KindQuestion.venue,
          order: extraSection.questions.length + 1
        });
      }
      if (form.shipping) {
        extraSection.questions.push({
          _id: 'shipping',
          question: form.shippingText,
          scale: 'shipping',
          kind: KindQuestion.scale,
          order: extraSection.questions.length + 1
        });
        extraScales.push({
          _id: 'shipping',
          name: 'shipping',
          choices: [
            {
              _id: 'false',
              choice: 'No',
              backgroundColor: 'red',
              requireImage: form.shippingImage,
              requireComment: false,
              requireAccesories: false,
              requireConciliation: false,
              value: 0,
              order: 1
            }, {
              _id: 'true',
              choice: 'Si',
              backgroundColor: 'green',
              requireImage: false,
              requireComment: false,
              requireAccesories: false,
              requireConciliation: false,
              value: 1,
              order: 2
            }
          ]
        });
      }

      if (form.receptionVenue) {
        extraSection.questions.push({
          _id: 'receptionVenue',
          question: form.receptionVenueText,
          venues: user.venue.receiveFrom,
          kind: KindQuestion.venue,
          order: extraSection.questions.length + 1
        });
      }
      if (form.reception) {
        extraSection.questions.push({
          _id: 'reception',
          question: form.receptionText,
          scale: 'reception',
          kind: KindQuestion.scale,
          order: extraSection.questions.length + 1
        });
        extraScales.push({
          _id: 'reception',
          name: 'reception',
          choices: [
            {
              _id: 'false',
              choice: 'No',
              backgroundColor: 'red',
              requireImage: form.receptionImage,
              requireComment: false,
              requireAccesories: false,
              requireConciliation: false,
              value: 0,
              order: 1
            }, {
              _id: 'true',
              choice: 'Si',
              backgroundColor: 'green',
              requireImage: false,
              requireComment: false,
              requireAccesories: false,
              requireConciliation: false,
              value: 1,
              order: 2
            }
          ]
        });
      }

      if (form.carrier && (form.reception || form.shipping)) {
        extraSection.questions.push({
          _id: 'carrier',
          question: form.carrierText,
          carriers: form.reception ? user.venue.receptionCarriers : user.venue.shippingCarriers,
          kind: KindQuestion.carrier,
          order: extraSection.questions.length + 1
        });
      }

      if (form.conciliation) {
        extraSection.questions.push({
          _id: 'conciliation',
          question: form.conciliationText,
          scale: 'conciliation',
          kind: KindQuestion.scale,
          order: extraSection.questions.length + 1
        });
        extraScales.push({
          _id: 'conciliation',
          name: 'conciliation',
          choices: [
            {
              _id: 'false',
              choice: 'No',
              backgroundColor: 'red',
              requireImage: false,
              requireComment: false,
              requireAccesories: false,
              requireConciliation: false,
              value: 0,
              order: 1
            }, {
              _id: 'true',
              choice: 'Si',
              backgroundColor: 'green',
              requireImage: form.conciliationImage,
              requireComment: false,
              requireAccesories: false,
              requireConciliation: false,
              value: 1,
              order: 2
            }
          ]
        });
      }

      let scales = await this.getScales({
        _id: {
          $in: scalesIds
        },
        team
      });

      scales = [...scales, ...extraScales];
      if (extraSection.questions.length) {
        (form as any).sections = [...form.sections, extraSection];
      }
      const baseQuestion = {
        _id: '',
        question: '',
        scale: null,
        risk: '',
        observe: '',
        accessories: null,
        damages: null,
        venues: [],
        carriers: [],
        conciliation: false,
        kind: '',
        weight: 0,
        order: 0,
        optional: false,
        hint: ''
      };
      // get scales from db

      return {
          form: {
            _id: form._id,
            name: form.name,
            description: form.description,
            // norrmalize questions in sections
            sections: form.sections.map((section) => {
              return {
                _id: section._id,
                name: section.name,
                questions: section.questions.map((question) => {
                  return {
                    ...baseQuestion,
                    ...question
                  };
                }),
                weight: section.weight,
                order: section.order
              };
            })
          },
          scales,
          extra,
          ...response
        };
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`TransmittalController.apiOnlyMe:`, e);
    }
  }

  private getScales(filter: any): Promise<IScaleModel[]> {
    const keyCache = `scales-${JSON.stringify(filter)}`;
    return new Promise((resolve, reject) => {
      redisClient.get(keyCache, async (error, result) => {
        if (result) {
          resolve(JSON.parse(result));
        } else {
          ScaleModel
            .find(filter, {
              'updatedAt': false,
              'createdAt': false,
              'active': false,
              'company': false,
              'minValue': false,
              'maxValue': false,
              'choices.na': false,
              'team': false,
              '__v': false
            })
            .lean()
            .exec((err, scales: IScaleModel[]) => {
              if (err) {
                /* istanbul ignore next */
                return reject(err);
              }
              redisClient.set(keyCache, JSON.stringify(scales), 'ex', 30);
              return resolve(scales);
            });
        }
      });
    });
  }


  public async attachEvidence(req: IRequest, res: Response): Promise<any> {
    const { user } = req;
    const { files, transmittal } = req.body;
    logger.info(`TransmittalController.attachEvidence`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
    try {
      if (files) {
        const transmittalData = await Transmittal
          .findOneAndUpdate({
            _id: transmittal,
            team: user.team._id
          }, {
            $push: { evidenceFullLoad: files },
            status: ChoicesStatusTransmittal.inTransit
          }, { new: true });
        return res.status(200).json({
          data: transmittalData,
          status: 201
        });
      }
      return res.status(400).json({
        message: 'El archivo es requerido',
        status: 400
      });
      //  TODO: need update socket from here
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`TransmittalController.uploadFile: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      return res.status(400).json(e);
    }
  }

  public async xlsExport(req: IRequest, res: Response): Promise<any> {
    logger.info(`TransmittalController.xlsExport email: ${req.user.email}`);
    const team = req.user.team._id;
    try {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=distribution-${moment().format('YYYY-MM-DD')}.xlsx`);
      const options = {
        stream: res,
        useStyles: true,
        useSharedStrings: true
      };
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
      const workbook = new excel.stream.xlsx.WorkbookWriter(options);
      const worksheet = workbook.addWorksheet('Rotación de unidades', {
        pageSetup: {
          fitToPage: true, fitToHeight: 100, fitToWidth: 1
        }
      });
      worksheet.columns = columns;

      const cursor = Transmittal
        .find({
          team
        }, {
          number: true,
          transporter: true,
          items: true,
          files: true,
          createdBy: true,
          createdAt: 1,
        })
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
        // .allowDiskUse(true)
        .batchSize(40)
        .cursor();

      cursor.on('data', async (transmittal) => {
        // const row = await this.processParticipant(participant);
        for (const item of transmittal.items) {
          worksheet.addRow({
            transmittalNumber: transmittal.number,
            requestNumber: item.request?.number,
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
        cursor.close();
        workbook.commit();
        return res.status(200);
      });

      cursor.on('error', (error) => {
        cursor.close();
        logger.error(error.message);
        return res.status(500).json(error);
      });

      // code to handle connection abort or finish of data send
      req.connection.on('close', async () => {
        cursor.close();
        return res.status(200);
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`TransmittalController.xlsExport: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      return res.status(500).json(e);
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
    let { transmittal, milestone } = req.body;
    logger.info(`TransmittalController.uploadFile`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
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

        if (transmittal?.length){
          transmittal = transmittal.replace(/["']/g, "");

          transmittaltFile.transmittal = transmittal;
        }

        if (milestone?.length){
          milestone = milestone.replace(/["']/g, "");

          transmittaltFile.milestone = milestone;
        }

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
        if(transmittal?.length){
          const newTransmittal = await Transmittal
            .findOneAndUpdate({ _id: transmittal }, { $push: { files: transmittaltFile } }, { new: true })
            .populate(this.populate);
          io.to(`transmittal-list-${user.team._id}`).emit('UPDATE_TRANSMITTAL', {
            transmittal: newTransmittal
          });
        }
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
        logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
        /* istanbul ignore next */
        logger.error(e);
        /* istanbul ignore next */
        res.status(400).json(e);
      }
    } else {
      logger.error(`TransmittalController.uploadFile: The file are required.`);
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      res.status(400).json({
        message: 'La imagen es obligatoria.',
        status: 400
      });
    }
  }

  // public async transmittalResume(req: IRequest, res: Response) {
  //   const team = req.user.team._id;
  //   const {from, to} = req.query;
  //
  //   let transmittals = await Transmittal.aggregate([{$match: {
  //       team: team,
  //       createdAt:{
  //         $gte:from,
  //         $lt:to
  //       }
  //     }}, {$lookup: {
  //       from: 'transmittalitems',
  //       localField: '_id',
  //       foreignField: 'transmittal',
  //       as: 'items'
  //     }}, {$lookup: {
  //       from: 'cars',
  //       localField: 'items.car',
  //       foreignField: '_id',
  //       as: 'car_data'
  //     }}, {$lookup: {
  //       from: 'transmittalfiles',
  //       localField: 'evidenceFullLoad',
  //       foreignField: '_id',
  //       as: 'evidenceFullLoad'
  //     }}, {$lookup: {
  //       from: 'participants',
  //       localField: '_id',
  //       foreignField: 'transmittal',
  //       as: 'participant'
  //     }}, {$lookup: {
  //       from: 'participants',
  //       localField: 'items._id',
  //       foreignField: 'transmittalItem',
  //       as: 'participantItems'
  //     }}]);
  //
  //
  // }

  public async downloadTransmittalFiles(req: IRequest, res: Response) {
    const { id } = req.params;
    const team = req.user.team._id;
    try {
      console.log('**downloadTransmittalFiles', id);
      const transmittal = await Transmittal
        .findOne({ _id: id, team })
        .populate({
          path: 'files'
        });
      if (transmittal) {
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
        const filename = `transmittal-${transmittal.number}.zip`;
        archive.on('end', () => {
          console.log(`${filename}: Archive wrote ${(archive.pointer() / (1024 * 1024)).toFixed(2)}MB`);
        });
        res.attachment(filename);
        const filesToDownload: any = [];
        const filesToCompress: any = [];
        for (const file of transmittal.files) {
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
      logger.error(`TransmittalController.downloadItemFiles: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
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
