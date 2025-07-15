import * as bluebird from 'bluebird';
import * as crypto from 'crypto';
import * as excel from 'exceljs';
import { Response } from 'express';
import * as fs from 'fs';
import * as GraphicsMagick from 'gm';
import * as Joi from 'joi';
import * as moment from 'moment-timezone';
import mongoose, {
  CustomLabels,
  LeanDocument,
  PaginateOptions,
  PaginateResult,
  Types
} from 'mongoose';
import * as path from 'path';
import puppeteer from 'puppeteer';
import * as QRCode from 'qrcode';
import * as tempfile from 'tempfile';
import carTracker from '../../app/controllers/tracker/car.tracker';
import type { IVenueDay } from '../../app/interfaces/venueDay.interface';
import Car, { ICarModel } from '../../app/models/car.model';
import Team, { ITeamModel } from '../../app/models/team.model';
import {
  default as User,
  default as UserModel
} from '../../app/models/user.model';
import Venue, { IVenueModel } from '../../app/models/venue.model';
import { IUserModel } from '../../app/schemas/user.schema';
import { ChoicesTypeActivity } from '../../billing/models/activiHistory.types';
import ActivityHistory from '../../billing/models/activityHistory.model';
import TransmittalController from '../../distribution/controllers/transmittal.controller';
import Milestone, {
  ChoicesStepMilestone
} from '../../distribution/models/milestone.model';
import { ChoicesStatusTransmittal } from '../../distribution/models/transmitall.types';
import Transmittal from '../../distribution/models/transmittal.model';
import TransmittalItem from '../../distribution/models/transmittalItem.model';
import type { IAnyObject, IRequest } from '../../interfaces/global.interface';
import RequestController from '../../request/controllers/request.controller';
import type { IOperationTypeModel } from '../../request/models/operationType.model';
import RequestItem from '../../request/models/requestItem.model';
import logger from '../../services/logger.service';
import redisClient from '../../services/redis.service';
import { socket } from '../../services/socket.service';
import GeneralUtils from '../../utils/general.utils';
import type { IFormTrigger } from '../interfaces/form.interface';
import type { IParticipant } from '../interfaces/participant.interface';
import Form, {
  IFormModel,
  KindForm,
  KindQuestion,
  KindQuestionImage
} from '../models/form.model';
import GPSPosition from '../models/gpsPosition.model';
import Participant, {
  IParticipantAnswerModel,
  IParticipantSectionModel
} from '../models/participant.model';
import ParticipantFile from '../models/participantFile.model';
import ScaleModel, { IScaleModel } from '../models/scale.model';
import { KindTrigger } from '../models/trigger.types';
import TriggerHandler from './triggers/triggerHandler';
import axios from 'axios';
import Inventory from '../../inventory/models/inventory.model';
import InventoryController from '../../inventory/controllers/inventory.controller';
import InventoryFileModel from '../../inventory/models/inventoryFile.model';
import { IInventoryFile } from '../../inventory/interfaces/inventoryFile.interface';
import DraftModel from '../models/draft.model';
import { IPDFContext, IParticipantSection, IParticipantChoices, IParticipantAnswerTypes, IDamageSelected, IParticipantCompany, IParticipantFile} from '../interfaces/pdfContext.interface';

const DERCO_TEAM = '5bf2de34caf8ef7096105cda';

class FormController {
  readonly aggregateCustomLabels: CustomLabels = {
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
    this.list = this.list.bind(this);
    this.detail = this.detail.bind(this);
    this.pdf = this.pdf.bind(this);
    this.pdfForm = this.pdfForm.bind(this);
    this.pdfAforo = this.pdfAforo.bind(this);
    this.complete = this.complete.bind(this);
    this.deliveriesOfTheday = this.deliveriesOfTheday.bind(this);
    this.changePreferred = this.changePreferred.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
    this.damagesDashboardPerDay = this.damagesDashboardPerDay.bind(this);
    this.participantWithDamages = this.participantWithDamages.bind(this);
    this.timingDashboard = this.timingDashboard.bind(this);
    this.getControls = this.getControls.bind(this);
    this.allControls = this.allControls.bind(this);
    this.allControlsByVIN = this.allControlsByVIN.bind(this);
    this.getExternalOrder = this.getExternalOrder.bind(this);
    this.completeWebQuestion = this.completeWebQuestion.bind(this);
    this.copyFormFileToInventoryFile = this.copyFormFileToInventoryFile.bind(this);
  }

  public async getExternalOrder(req: IRequest, res: Response): Promise<any> {
    const { order } = req.body;
    try {
      const config = {
        headers: {
          'x-apikey': ' Tr2cRKGiZe9Z2dzGL0WVnhjgWDZ1pYXxDe38vaQd90pnemhN'
        }
      };
      const instance = axios.create(config);
      const response = await instance.get(
        `https://ipa.prd.derco.services/osa-integration/v1/pedidos/${order}`
      );
      console.dir(response.data);
      return res.json({
        data: response.data,
        status: response.status
      });
    } catch (e) {
      console.log(e);
      // Raven.captureException(e, { req });
      return res.status(500).json(e.message);
    }
  }

  /**
   * Maps a Participant model object to an IPDFContext interface
   * @param participant - The participant object from the database
   * @param css - CSS string for styling
   * @param timezone - Timezone for date formatting
   * @returns IPDFContext - Mapped context object for PDF generation
   *
   * Example usage:
   * const context = await this.mapPdfContext(participant, css, timezone);
   */
  private async mapPdfContext(participant: any, css?: string): Promise<IPDFContext> {
    let participantCompany: IParticipantCompany | undefined;

    const qr = await QRCode.toDataURL(participant.car.vin, {
      errorCorrectionLevel: 'H',
      margin: 0,
      rendererOpts: {
        quality: 1
      }
    });

    if (participant.user?.venue?.company) {
      participantCompany = {
        name: participant.user.venue.company.name || '',
        image: participant.user.venue.company.image && participant.user.venue.company.image.hasOwnProperty('url')
          ? {
              url: decodeURI(participant.user.venue.company.image.url),
              filename: participant.user.venue.company.image.filename || '',
              mimetype: participant.user.venue.company.image.mimetype || ''
          }: undefined
      }
    }

    let origin: string = '';
    let destination: string = '';


    if (participant.reception && participant.receiveFrom) {
      origin = participant.receiveFrom.name;
    }
    if (participant.shipping && participant.venue) {
      origin = participant.venue.name;
    }
    if (participant.reception && participant.venue) {
      destination = participant.venue.name;
    } else if (participant.shipping && participant.sendTo) {
      destination = participant.sendTo.name;
    }

    let signature: IParticipantFile | undefined;
    if (participant.form?.triggers?.length > 0) {
      let fileTriggers: IFormTrigger[] = participant.form.triggers.filter(
        (trigger: IFormTrigger) =>
          trigger.kind === KindTrigger.file && trigger.enabled
      );
      if (fileTriggers.length) {
        let trigger: IFormTrigger = fileTriggers[0];
        let signatureAnswer = participant?.sections
          .reduce(
            (
              previousValue: any[],
              currenSection: IParticipantSectionModel
            ) => previousValue.concat(currenSection.answers),
            []
          )
          .find((answer: IParticipantAnswerModel) => {
            return (
              answer._id.toString() === trigger.config.signature.toString()
            );
          });
        if (signatureAnswer) {
          signature = signatureAnswer.images[0];
        }
      }
    }

    return {
      qr: qr,
      css: css?.replace(/(\r\n|\n|\r)/gm, ''),
      company: participantCompany,
      signature: signature,
      moment: moment,
      name: participant.name || '',
      description: participant.description || '',
      number: participant.number || 0,
      webQuestion: {
        answer: participant.webQuestion?.answer || ''
      },
      user: {
        firstName: participant.user?.firstName || '',
        lastName: participant.user?.lastName || ''
      },
      carrier: {
        is: participant.carrier || false,
        text: participant.carrierBy?.name || undefined,
      },
      sections: this.mapParticipantSections(participant.sections || []),
      shipping: {
        is: participant.shipping || false,
        text: participant.shippingText || undefined,
        images: participant.shippingImages?.map((img: any) => img.url || img) || undefined
      },
      reception: {
        is: participant.reception || false,
        text: participant.receptionText || undefined,
        images: participant.receptionImages?.map((img: any) => img.url || img) || undefined
      },
      conciliation: {
        is: participant.conciliation || false,
        text: participant.conciliationText || undefined,
        images: participant.conciliationImages?.map((img: any) => img.url || img) || undefined
      },
      car: {
        vin: participant.car?.vin || '',
        internalNumber: participant.car?.internalNumber || '',
        engineNumber: participant.car?.engineNumber || '',
        brand: participant.car?.brand || '',
        denomination: participant.car?.denomination || '',
        color: participant.car?.color || '',
        patent: participant.car?.patent || ''
      },
      createdAt: participant.createdAt,
      origin: origin || '',
      destination: destination || '',
    };
  }

  private mapParticipantSections(sections: any[]): IParticipantSection[] {
    return sections.map(section => ({
      name: section.name || '',
      answers: this.mapParticipantAnswers(section.answers || [])
    }));
  }

  /**
   * Maps participant answers to strongly typed IParticipantAnswerTypes
   * @param answers - Array of raw answer objects from the database
   * @returns Array of typed participant answers based on question kind
   */
  private mapParticipantAnswers(answers: any[]): IParticipantAnswerTypes[] {
    return answers.map(answer => {
      let damagesSelected: IDamageSelected[] | undefined = undefined;
      let answerChoice: IParticipantChoices | undefined = undefined;

      for(const damage of answer.damagesSelected || []) {
        let part: string | undefined = undefined;
        let position: string | undefined = undefined;
        let kind: string | undefined = undefined;
        if (damage && damage.hasOwnProperty('part') && damage.part) {
          answer.damages.parts.find((item: any) => {
            if (item._id.toString() === damage.part.toString()) {
              part = item.name;
              return true;
            }
            return false;
          });
        }
        if (damage && damage.hasOwnProperty('position') && damage.position) {
          answer.damages.positions.find((item: any) => {
            if (item._id.toString() === damage.position.toString()) {
              position = item.name;
              return true;
            }
            return false;
          });
        }
        if (damage && damage.hasOwnProperty('kind') && damage.kind) {
          answer.damages.kinds.find((item: any) => {
            if (item._id.toString() === damage.kind.toString()) {
              kind = item.name;
              return true;
            }
            return false;
          });
        }
        damagesSelected = damagesSelected || [];
        damagesSelected.push({
          part: part || '',
          position: position || '',
          kind: kind || '',
          severity: damage.severity || undefined,
          images: damage.images?.map((img: any) => ({
            filename: img.filename || img.file?.filename || '',
            url: img.url || img.file?.url || '',
            mimetype: img.mimetype || img.file?.mimetype || ''
          })) || []
        });
      }

      // Base properties shared by all answer types
      const baseAnswer = {
        question: answer.question || '',
        kind: answer.kind || '',
        comment: answer.comment || '',
        qualification: answer.qualification || 0,
        order: answer.order || 0,
        hint: answer.hint || undefined,
        optional: answer.optional || false,
      };

      // Map images if they exist
      const mappedImages = answer.images?.map((img: any) => ({
        filename: img.filename || img.file?.filename || '',
        url: img.url || img.file?.url || '',
        mimetype: img.mimetype || img.file?.mimetype || ''
      }));

      // Return typed answer based on kind
      switch (answer.kind) {
        case 'scale':
          if (answer.answer) {
            const choice = answer.scale.choices.find(
              (choice: any) =>
                choice._id.toString() === answer.answer.toString()
            );
            answerChoice = choice ? choice: undefined;
          }
          return {
            ...baseAnswer,
            answer: answerChoice || '',
            images: mappedImages,
            scale: answer.scale ? {
              name: answer.scale.name || '',
              choices: answer.scale.choices?.map((choice: any) => ({
                id: choice._id?.toString() || choice.id || '',
                choice: choice.choice || '',
                backgroundColor: choice.backgroundColor || '',
                order: choice.order || 0
              })) || []
            } : {
              name: '',
              choices: []
            }
          } as const;

        case 'numeric-scale':
          return {
            ...baseAnswer,
            images: mappedImages,
            score: answer.score || 0,
            minValue: answer.minValue || 0,
            maxValue: answer.maxValue || 100,
            scale: answer.scale ? {
              name: answer.scale.name || '',
              choices: answer.scale.choices?.map((choice: any) => ({
                id: choice._id?.toString() || choice.id || '',
                choice: choice.choice || '',
                backgroundColor: choice.backgroundColor || '',
                order: choice.order || 0
              })) || []
            } : {
              name: '',
              choices: []
            }
          } as const;

        case 'accessory':
          if (answer.answer) {
            const choice = answer.scale.choices.find(
              (choice: any) =>
                choice._id.toString() === answer.answer.toString()
            );
            answerChoice = choice ? choice: undefined;
          }
          return {
            ...baseAnswer,
            images: mappedImages,
            answer: answerChoice || '',
            accessories: answer.accessories ? {
              question: answer.accessories.question || '',
              items: answer.accessories.items?.map((item: any) => ({
                item: item.item || '',
                amount: item.amount || false
              })) || []
            } : {
              question: '',
              items: []
            },
            accesoriesAnswered: answer.accesoriesAnswered?.map((acc: any) => {
              const item = answer.accessories.items.find((item: any) => item._id.toString() === acc.item.toString());
              return item
            }) || [],
            scale: answer.scale ? {
              name: answer.scale.name || '',
              choices: answer.scale.choices?.map((choice: any) => ({
                id: choice._id?.toString() || choice.id || '',
                choice: choice.choice || '',
                backgroundColor: choice.backgroundColor || '',
                order: choice.order || 0
              })) || []
            } : undefined
          } as const;

        case 'damage':
          return {
            ...baseAnswer,
            images: mappedImages,
            damagesSelected: answer.damagesSelected?.map((damage: any) => ({
              part: damage.part || '',
              position: damage.position || '',
              kind: damage.kind || '',
              severity: damage.severity
            })) || []
          } as const;

        case 'image':
          return {
            ...baseAnswer,
            images: mappedImages || []
          } as const;

        case 'matrix':
          return {
            ...baseAnswer,
            images: mappedImages,
            matrix: answer.matrix ? {
              name: answer.matrix.name || '',
              questions: answer.matrix.questions?.map((q: any) => ({
                question: q.question || '',
                name: q.name || '',
                type: q.type || 'text',
                value: q.value,
                images: q.images?.map((img: any) => ({
                  filename: img.filename || img.file?.filename || '',
                  url: img.url || img.file?.url || '',
                  mimetype: img.mimetype || img.file?.mimetype || ''
                }))
              })) || []
            } : {
              name: '',
              questions: []
            },
            matrixValues: answer.matrixValues?.map((row: any[]) =>
              row.map((item: any) => ({
                question: item.question || '',
                name: item.name || '',
                type: item.type || 'text',
                value: item.value,
                images: item.images?.map((img: any) => ({
                  filename: img.filename || img.file?.filename || '',
                  url: img.url || img.file?.url || '',
                  mimetype: img.mimetype || img.file?.mimetype || ''
                }))
              }))
            ) || []
          } as const;

        case 'venue':
        case 'carrier':
        case 'text':
        default:
          // For text, venue, carrier and other simple types
          return {
            ...baseAnswer,
            images: mappedImages
          } as const;
      }
    });
  }

  public async pdfForm(req: IRequest, res: Response): Promise<any> {
    const { debug, timezone } = req.query as {
      debug: string;
      timezone: string;
    };
    const { id } = req.params;
    const team = req.user.team._id;

    moment.locale('es');
    moment.tz.setDefault(timezone ? timezone : 'America/Santiago');

    try {
      logger.info(
        `FormController.pdf email: ${req.user.email}, participant: ${id}`
      );
      const venuesPermissions = req.user.venuesPermissions();
      const participant = await Participant.findOne(
        {
          $and: [
            {
              _id: id,
              team,
              venue: {
                $in: venuesPermissions
              }
            }
          ]
        },
        {
          template: true,
          name: true,
          number: true,
          user: true,
          sections: true,
          shipping: true,
          shippingText: true,
          shippingImages: true,
          carrier: true,
          carrierText: true,
          carrierImages: true,
          reception: true,
          receptionText: true,
          receptionImages: true,
          conciliation: true,
          conciliationText: true,
          conciliationImages: true,
          createdAt: true
        }
      )
        .allowDiskUse(true)
        .populate([
          {
            path: 'user',
            select: ['firstName', 'lastName', 'venue'],
            populate: [
              {
                path: 'venue',
                populate: [
                  {
                    path: 'company'
                  }
                ]
              }
            ]
          },
          {
            path: 'receiveFrom',
            select: 'name'
          },
          {
            path: 'venue',
            select: 'name'
          },
          {
            path: 'sendTo',
            select: 'name'
          },
          {
            path: 'carrierBy',
            select: 'name'
          },
          {
            path: 'car',
            select: [
              'vin',
              'internalNumber',
              'engineNumber',
              'brand',
              'denomination',
              'color',
              'patent'
            ]
          },
          {
            path: 'sections.answers.images'
          },
          {
            path: 'shippingImages'
          },
          {
            path: 'receptionImages'
          },
          {
            path: 'conciliationImages'
          },
          {
            path: 'form',
            select: ['triggers']
          }
        ])
        .lean();

      if (participant) {
        let template: string =
          path.join(__dirname, '../../../views/') + participant.form.template;

        if (participant.form?.triggers?.length > 0) {
          let fileTriggers: IFormTrigger[] = participant.form.triggers.filter(
            (trigger: IFormTrigger) =>
              trigger.kind === KindTrigger.file && trigger.enabled
          );
          if (fileTriggers.length) {
            let trigger: IFormTrigger = fileTriggers[0];
            template =
              path.join(__dirname, '../../../views/') + trigger.config.template;
          }
        }
        const css = fs.readFileSync(
          path.join(__dirname, '../../../views/') + 'form/carDetail/style.css',
          'utf8'
        );

        const context = await this.mapPdfContext(participant, css);

        const html = GeneralUtils.generateHtmlFromPugFile(template, context);

        if (debug) {
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
            format: 'Letter',
            printBackground: true,
            displayHeaderFooter: true,
            footerTemplate: `
              <div style="width: 100%; font-size: 10px; text-align: center; padding: 10px;">
              Página <span class="pageNumber"></span> / <span class="totalPages"></span>
              </div>`,
            margin: {
              top: '0.3in',
              right: '0.5in',
              bottom: '0.5in',
              left: '0.5in'
            }
            });
          await browser.close();

          // Return Buffer
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader(
            'Content-disposition',
            `inline; filename=${participant._id.toString()}.pdf`
          );
          return res.send(pdfBuffer);
        }
      }

    } catch (e) {
      console.log(e);
      // Raven.captureException(e, { req });
      return res.status(500).json(e.message);
    }
  }


  public async pdf(req: IRequest, res: Response): Promise<any> {
    const { debug, timezone } = req.query as {
      debug: string;
      timezone: string;
    };
    const { id } = req.params;
    const team = req.user.team._id;
    try {
      logger.info(
        `FormController.pdf email: ${req.user.email}, participant: ${id}`
      );
      const venuesPermissions = req.user.venuesPermissions();
      const participant = await Participant.findOne(
        {
          $and: [
            {
              _id: id,
              team,
              venue: {
                $in: venuesPermissions
              }
            }
          ]
        },
        {
          name: true,
          number: true,
          user: true,
          sections: true,
          qualification: true,
          shipping: true,
          shippingText: true,
          shippingImages: true,
          carrier: true,
          reception: true,
          receptionText: true,
          receptionImages: true,
          conciliation: true,
          conciliationText: true,
          conciliationImages: true,
          createdAt: true
        }
      )
        .allowDiskUse(true)
        .populate([
          {
            path: 'user',
            select: ['firstName', 'lastName', 'venue'],
            populate: [
              {
                path: 'venue',
                populate: [
                  {
                    path: 'company'
                  }
                ]
              }
            ]
          },
          {
            path: 'receiveFrom',
            select: 'name'
          },
          {
            path: 'venue',
            select: 'name'
          },
          {
            path: 'sendTo',
            select: 'name'
          },
          {
            path: 'carrierBy',
            select: 'name'
          },
          {
            path: 'car',
            select: [
              'vin',
              'internalNumber',
              'engineNumber',
              'brand',
              'denomination',
              'color',
              'patent'
            ]
          },
          {
            path: 'sections.answers.images'
          },
          {
            path: 'shippingImages'
          },
          {
            path: 'receptionImages'
          },
          {
            path: 'conciliationImages'
          },
          {
            path: 'form',
            select: ['triggers']
          }
        ])
        .lean();

      let template: string =
        path.join(__dirname, '../../../views/') + 'form/carDetail/index.pug';

      moment.locale('es');
      moment.tz.setDefault(timezone ? timezone : 'America/Santiago');
      if (participant) {
        const css = fs.readFileSync(
          path.join(__dirname, '../../../views/') + 'form/carDetail/style.css',
          'utf8'
        );
        const participantCompany =
          (participant.user.venue && participant?.user.venue.company) || {};

        let context: any = {
          css: css.replace(/(\r\n|\n|\r)/gm, ''),
          participant,
          qr: await QRCode.toDataURL(participant.car.vin, {
            errorCorrectionLevel: 'H',
            margin: 0,
            rendererOpts: {
              quality: 1
            }
          }),
          moment,
          origin: () => {
            if (participant.reception && participant.receiveFrom) {
              return participant.receiveFrom.name;
            }
            if (participant.shipping && participant.venue) {
              return participant.venue.name;
            }
            return false;
          },
          destination: () => {
            if (participant.reception && participant.venue) {
              return participant.venue.name;
            }
            if (participant.shipping && participant.sendTo) {
              return participant.sendTo.name;
            }
            return false;
          },
          carrier: () => {
            if (participant.carrier && participant.carrierBy) {
              return participant.carrierBy.name;
            }
            return false;
          },
          getAnswer: (scale: any, answer: any) => {
            if (answer && answer.hasOwnProperty('answer') && answer.answer) {
              const choice = scale.choices.find(
                (choice: any) =>
                  choice._id.toString() === answer.answer.toString()
              );
              return choice ? choice.choice : '';
            }
            return '';
          },
          requireAccesory: (scale: any, answer: any) => {
            if (answer && answer.hasOwnProperty('answer') && answer.answer) {
              const choice = scale.choices.find(
                (choice: any) =>
                  choice._id.toString() === answer.answer.toString()
              );
              return choice ? choice.requireAccesories : false;
            }
            return false;
          },
          getDamageItem: (items: any, item: string) => {
            if (item) {
              const result = items.find(
                (i: any) => i._id.toString() === item.toString()
              );
              if (result && result.hasOwnProperty('name')) {
                return result.name;
              }
            }
            return '-';
          },
          logo:
            participantCompany.image &&
            participantCompany.image.hasOwnProperty('url')
              ? decodeURI(participantCompany.image.url)
              : false,
          accesorySelected: (answer: any, item: any) => {
            return item && answer.accesoriesAnswered
              ? answer.accesoriesAnswered.find((accesory: any) => {
                  return accesory.item === item._id.toString();
                })
              : false;
          }
        };

        if (participant.form?.triggers?.length > 0) {
          let fileTriggers: IFormTrigger[] = participant.form.triggers.filter(
            (trigger: IFormTrigger) =>
              trigger.kind === KindTrigger.file && trigger.enabled
          );
          if (fileTriggers.length) {
            let trigger: IFormTrigger = fileTriggers[0];
            template =
              path.join(__dirname, '../../../views/') + trigger.config.template;
            let signature = participant?.sections
              .reduce(
                (
                  previousValue: any[],
                  currenSection: IParticipantSectionModel
                ) => previousValue.concat(currenSection.answers),
                []
              )
              .find((answer: IParticipantAnswerModel) => {
                return (
                  answer._id.toString() === trigger.config.signature.toString()
                );
              });
            if (signature) {
              context.signature = signature.images.map(
                (f: any) => f.file.url
              )[0];
            }
          }
        }

        const html = GeneralUtils.generateHtmlFromPugFile(template, context);

        if (debug) {
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
            format: 'Letter',
            printBackground: true,
            margin: {
              top: '0.3in',
              right: '0.5in',
              bottom: '0.3in',
              left: '0.5in'
            }
          });
          await browser.close();

          // Return Buffer
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader(
            'Content-disposition',
            `inline; filename=${participant._id.toString()}.pdf`
          );
          return res.send(pdfBuffer);
        }
      }
    } catch (e) {
      console.log(e);
      // Raven.captureException(e, { req });
      return res.status(500).json(e.message);
    }
  }

   private getAccessories(participant: IParticipant, question: string): string {
    let text = '';
    if (!participant || !participant.sections) {
      return text;
    }

    for (const section of participant.sections) {
      for (const answer of section.answers) {
        if (answer.kind === KindQuestion.accessory && answer.question === question) {
          let itemsDict = this.createObjectFromItems(answer.accessories.items || []);
          text = answer.accesoriesAnswered
            .map((item) => itemsDict[item.item] ?? '-')
            .join('\n')
        }
      }
    }
    return text;
  }

  private createObjectFromItems(items: any[]) {
    let dict: any = {};
    items.map((item) => {
      return (dict[item._id.toString()] = item.item);
    });
    return dict;
  }

  public async pdfAforo(req: IRequest, res: Response): Promise<any> {
    const { debug, timezone } = req.query as {
      debug: string;
      timezone: string;
    };
    const { id } = req.params;
    const team = req.user.team._id;
    try {
      logger.info(
        `FormController.pdf email: ${req.user.email}, participant: ${id}`
      );
      const venuesPermissions = req.user.venuesPermissions();
      const participant = await Participant.findOne(
        {
          $and: [
            {
              _id: id,
              team,
              venue: {
                $in: venuesPermissions
              }
            }
          ]
        },
        {
          name: true,
          number: true,
          user: true,
          sections: true,
          qualification: true,
          shipping: true,
          shippingText: true,
          shippingImages: true,
          carrier: true,
          reception: true,
          receptionText: true,
          receptionImages: true,
          conciliation: true,
          conciliationText: true,
          conciliationImages: true,
          createdAt: true,
          startAt: true,
          webQuestion: true,
        }
      )
        .allowDiskUse(true)
        .populate([
          {
            path: 'user',
            select: ['firstName', 'lastName', 'venue'],
            populate: [
              {
                path: 'venue',
                populate: [
                  {
                    path: 'company'
                  }
                ]
              }
            ]
          },
          {
            path: 'receiveFrom',
            select: 'name'
          },
          {
            path: 'venue',
            select: 'name'
          },
          {
            path: 'sendTo',
            select: 'name'
          },
          {
            path: 'carrierBy',
            select: 'name'
          },
          {
            path: 'car',
            select: [
              'vin',
              'internalNumber',
              'engineNumber',
              'brand',
              'denomination',
              'color',
              'patent'
            ],
            populate: [
              {
                path: 'company'
              }
            ]
          },
          {
            path: 'sections.answers.images'
          },
          {
            path: 'shippingImages'
          },
          {
            path: 'receptionImages'
          },
          {
            path: 'conciliationImages'
          },
          {
            path: 'form',
            select: ['triggers']
          }
        ])
        .lean();

      if (!participant) {
        return res.status(404).json({
          message: 'No se encontro el participante',
          status: 404
        });
      }

      let hasRetention = true;
      const thirtSection = participant.sections[2];
      if (thirtSection) {
        const commentAnswer = thirtSection.answers[6];
        const imageAnswer = thirtSection.answers[7];
        if (
          commentAnswer &&
          commentAnswer.comment === '' &&
          imageAnswer &&
          imageAnswer.images.length === 0
        ) {
          hasRetention = false;
        }
      }

      const accesories = this.getAccessories(participant as IParticipant, participant.sections[1].answers[1].question);
      const aforoType = this.getAccessories(participant as IParticipant, participant.sections[0].answers[0].question);

      const tempParticipant: {
        sections: any[];
      } = participant;
      const sectionsToShow: {name: string, answers: any[], hasAnswer?: boolean, useGrid?: boolean}[] = [
        {
          name: "PARTICIPANTES",
          useGrid: true,
          answers: [
            {
              name: '',
              comment: tempParticipant.sections[0].answers[1].comment,
              images: tempParticipant.sections[0].answers[1].images,
            }
          ]
        },
        {
          name: "RECURSOS UTILIZADOS",
          useGrid: true,
          answers:[
            {
              name: '',
              comment: accesories,
              images: []
            }
          ]
        },
                {
          name: "OBSERVACIONES",
          useGrid: true,
          answers:[
            {
              name: '',
              comment: tempParticipant.sections[1].answers[2].comment || 'N/A',
              images: [],
            }
          ]
        },
        {
          name: "EVIDENCIA APERTURA",
          useGrid: true,
          answers: [
            {
              name: 'FOTOGRAFÍA FRONTAL CONTENEDOR',
              comment: tempParticipant.sections[0].answers[2].comment,
              images: tempParticipant.sections[0].answers[2].images,
            },{
              name: 'FOTOGRAFÍA SELLO',
              comment: tempParticipant.sections[0].answers[3].comment,
              images: tempParticipant.sections[0].answers[3].images,
            },
            {
              name: 'FOTOGRAFÍA CONTENEDOR ABIERTO',
              comment: tempParticipant.sections[0].answers[4].comment,
              images: tempParticipant.sections[0].answers[4].images,
            }
          ]
        },
        {
          name: "EVIDENCIA CARGA RETENIDA",
          useGrid: true,
          answers: [
            {
              name: "OBSERVACIONES",
              comment: tempParticipant.sections[2].answers[0].comment,
              images: tempParticipant.sections[2].answers[0].images,
            },
            {
              name: "FOTOGRAFÍAS CARGA RETENIDA",
              comment: tempParticipant.sections[2].answers[1].comment,
              images: tempParticipant.sections[2].answers[1].images,
            },
          ]
        },
        {
          name: "EVIDENCIA PROCESO AFORO",
          useGrid: true,
          answers: [
            {
              name: "OBSERVACIONES",
              comment: tempParticipant.sections[1].answers[3].comment,
              images: tempParticipant.sections[1].answers[3].images,
            },
            {
              name: "FOTOGRAFÍAS PROCESO AFORO",
              comment: tempParticipant.sections[1].answers[4].comment,
              images: tempParticipant.sections[1].answers[4].images,
            },
          ]
        },
        {
          name: "EVIDENCIA CIERRE",
          useGrid: true,
          answers: [
            {
              name: "CONTENEDOR PREVIO AL CIERRE",
              comment: tempParticipant.sections[3].answers[0].comment,
              images: tempParticipant.sections[3].answers[0].images,
            },
            {
              name: "NUEVO SELLO",
              comment: tempParticipant.sections[3].answers[1].comment,
              images: tempParticipant.sections[3].answers[1].images,
            }
          ]
        }
      ];

      sectionsToShow.forEach((section: any) => {
        section.hasAnswer = false;
        section.answers.forEach((answer: any) => {
          if (answer.images.length > 0 || answer.comment !== '') {
            section.hasAnswer = true;
          }
        });
      });

      let template: string =
        path.join(__dirname, '../../../views/') + 'form/pdf/aforo.pug';

      moment.locale('es');
      moment.tz.setDefault(timezone ? timezone : 'America/Santiago');
      if (participant) {
        const participantCompany =
          (participant.user.venue && participant?.user.venue.company) || {};

        let context: any = {
          participant,
          hasRetention,
          aforoType,
          companyName: participant.webQuestion?.answer ?? participant.car.company.name,
          sectionsToShow: sectionsToShow.filter(section => section.hasAnswer),
          moment,
          hasAnswer: (answer: any) => {
            return answer.images.length > 0 || answer.comment !== '';
          },
          origin: () => {
            if (participant.reception && participant.receiveFrom) {
              return participant.receiveFrom.name;
            }
            if (participant.shipping && participant.venue) {
              return participant.venue.name;
            }
            return false;
          },
          destination: () => {
            if (participant.reception && participant.venue) {
              return participant.venue.name;
            }
            if (participant.shipping && participant.sendTo) {
              return participant.sendTo.name;
            }
            return false;
          },
          carrier: () => {
            if (participant.carrier && participant.carrierBy) {
              return participant.carrierBy.name;
            }
            return false;
          },
          getAnswer: (scale: any, answer: any) => {
            if (answer && answer.hasOwnProperty('answer') && answer.answer) {
              const choice = scale.choices.find(
                (choice: any) =>
                  choice._id.toString() === answer.answer.toString()
              );
              return choice ? choice.choice : '';
            }
            return '';
          },
          requireAccesory: (scale: any, answer: any) => {
            if (answer && answer.hasOwnProperty('answer') && answer.answer) {
              const choice = scale.choices.find(
                (choice: any) =>
                  choice._id.toString() === answer.answer.toString()
              );
              return choice ? choice.requireAccesories : false;
            }
            return false;
          },
          getDamageItem: (items: any, item: string) => {
            if (item) {
              const result = items.find(
                (i: any) => i._id.toString() === item.toString()
              );
              if (result && result.hasOwnProperty('name')) {
                return result.name;
              }
            }
            return '-';
          },
          logo:
            participantCompany.image &&
            participantCompany.image.hasOwnProperty('url')
              ? decodeURI(participantCompany.image.url)
              : false,
          accesorySelected: (answer: any, item: any) => {
            return item && answer.accesoriesAnswered
              ? answer.accesoriesAnswered.find((accesory: any) => {
                  return accesory.item === item._id.toString();
                })
              : false;
          }
        };

        if (participant.form?.triggers?.length > 0) {
          let fileTriggers: IFormTrigger[] = participant.form.triggers.filter(
            (trigger: IFormTrigger) =>
              trigger.kind === KindTrigger.file && trigger.enabled
          );
          if (fileTriggers.length) {
            let trigger: IFormTrigger = fileTriggers[0];
            template =
              path.join(__dirname, '../../../views/') + trigger.config.template;
            let signature = participant?.sections
              .reduce(
                (
                  previousValue: any[],
                  currenSection: IParticipantSectionModel
                ) => previousValue.concat(currenSection.answers),
                []
              )
              .find((answer: IParticipantAnswerModel) => {
                return (
                  answer._id.toString() === trigger.config.signature.toString()
                );
              });
            if (signature) {
              context.signature = signature.images.map(
                (f: any) => f.file.url
              )[0];
            }
          }
        }

        const html = GeneralUtils.generateHtmlFromPugFile(template, context);

        if (debug) {
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
            format: 'Letter',
            printBackground: true,
            displayHeaderFooter: true,
            footerTemplate: `
            <div style="width: 100%; font-size: 10px; text-align: center; padding: 10px;">
              Página <span class="pageNumber"></span> / <span class="totalPages"></span>
            </div>`,
          // this is needed to prevent content from being placed over the footer
          margin: {
            top: '0.3in',
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
            `inline; filename=${participant._id.toString()}.pdf`
          );
          return res.send(pdfBuffer);
        }
      }
    } catch (e) {
      console.error(e);
      // Raven.captureException(e, { req });
      return res.status(500).json(e.message);
    }
  }

  public async userForms(req: IRequest, res: Response): Promise<any> {
    try {
      const team = req.user.team._id;
      const { deliveries } = req.query as Record<string, string>;
      logger.info(
        `FormController.userForms: email: ${
          req.user.email
        } query: ${JSON.stringify(req.query)}`
      );
      const forms = await Form.find(
        {
          team,
          _id: {
            $in: req.user.userForms.map((form) => form._id)
          },
          deliveryToCustomer: deliveries === '1',
          active: true
        },
        {
          _id: true,
          name: true
        }
      );
      return res.json({
        results: forms,
        status: 200
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`FormController.userForms: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      res.status(500).json({
        message: 'Ha ocurrido un error',
        status: 500
      });
    }
  }

  public async list(req: IRequest, res: Response): Promise<any> {
    const team = req.user.team._id;
    const { forContainer, forUnit } = req.query as {
      forContainer: string;
      forUnit: string;
    };
    try {
      const filter: any = {
        team: team,
        hidden: false,
        $and: [
          {
            _id: {
              $in: req.user.userForms.map((form) => form._id)
            }
          },
          {
            active: true
          }
        ]
      };

      if (forContainer === '1') {
        filter['unitsToUse.container'] = true;
      }

      if (forUnit === '1') {
        filter['unitsToUse.units'] = true;
      }

      logger.info(
        `FormController.list: email: ${req.user.email} query: ${JSON.stringify(
          req.query
        )}`
      );
      logger.debug(
        `FormController.list: email: ${req.user.email} filter: ${JSON.stringify(
          filter
        )}`
      );
      const forms = await this.getForms(filter);
      return res.json({
        data: forms,
        status: 200
      });
    } catch (e) {
      // Raven.captureException(e, { req });
      /* istanbul ignore next */
      logger.error(`Async Error.`);
      return res.status(400).json({
        message: 'Ha ocurrido un error',
        status: 400
      });
    }
  }

  public async detail(req: IRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const team = req.user.team._id;
    try {
      logger.info(
        `FormController.detail email: ${req.user.email}, form: ${id}`
      );
      if (
        (await User.find({
          _id: req.user._id,
          userForms: id
        }).countDocuments()) < 1
      ) {
        return res.status(403).json({
          message: 'No tienes permisos para esta operación'
        });
      }
      const user = (await UserModel.findById(req.user._id, {
        venue: true
      }).populate([
        {
          path: 'venue',
          populate: [
            {
              path: 'sendTo',
              select: ['name'],
              options: {
                sort: {
                  name: 1
                }
              }
            },
            {
              path: 'receiveFrom',
              select: ['name'],
              options: {
                sort: {
                  name: 1
                }
              }
            },
            {
              path: 'receptionCarriers',
              select: ['name'],
              options: {
                sort: {
                  name: 1
                }
              }
            },
            {
              path: 'shippingCarriers',
              select: ['name'],
              options: {
                sort: {
                  name: 1
                }
              }
            }
          ]
        }
      ])) as IUserModel;
      const form = await this.getForm({
        _id: id,
        team
      });
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
            },
            {
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
            },
            {
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
          carriers: form.reception
            ? user.venue.receptionCarriers
            : user.venue.shippingCarriers,
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
            },
            {
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

      let hasExtraSection = extraSection.questions.length > 0;
      scales =  hasExtraSection ? [...scales, ...extraScales] : scales;
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
      return res.json({
        data: {
          form: {
            _id: form._id,
            name: form.name,
            description: form.description,
            autosave: form.autosave || false,
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
        },
        status: 200
      });
    } catch (e) {
      // Raven.captureException(e, { req });
      /* istanbul ignore next */
      logger.error(`detail form: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      // Raven.captureException(e, { req });
      /* istanbul ignore next */
      res.status(500).json({
        message: 'No se encontro formularío',
        status: 500
      });
    }
  }

  private async copyFormFileToInventoryFile(
    ids: string[],
    inventory: string,
    car: ICarModel,
    user: IUserModel
  ): Promise<IInventoryFile[]> {
    const participantFiles = await ParticipantFile.find({
      _id: { $in: ids.map((id: string) => new mongoose.Types.ObjectId(id)) }
    });
    const files: IInventoryFile[] = [];
    if (participantFiles.length) {
      const inventoryItem = await Inventory.findById(inventory);
      if (inventoryItem) {
        for (const file of participantFiles) {
          const newFile = new InventoryFileModel({
            company: car.company,
            inventory: inventoryItem._id,
            user: user._id,
            file: file.file
          });
          await newFile.save();
          files.push(newFile);
        }
      }
    }
    return files;
  }

  public async completeWebQuestion(req: IRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const { value } = req.body;
    try {
      logger.info(
        `FormController.completeWebQuestion email: ${req.user.email}, participant: ${id}`
      );
      const participant = await Participant.findOne({
        _id: new mongoose.Types.ObjectId(id),
        team: req.user.team._id
      });
      if (!participant) {
        return res.status(404).json({
          message: 'No se ha encontrado el formulario solicitado.',
          status: 404
        });
      }

      if (participant.webQuestion) {
        participant.webQuestion.answer = value;
      }

      await participant.save();

      return res.json({
        data: {
          id,
          value
        },
        status: 200
      });
    } catch (e) {
      logger.error(e);
      return res.status(500).json({
        message: 'Error al completar la pregunta',
        status: 500
      });
    }
  }

  public async complete(req: IRequest, res: Response): Promise<any> {
    const { id } = req.params;
    let {
      vin,
      answers,
      transmittalItem,
      transmittal,
      reliability,
      inventory,
      containerFound
    } = req.body;
    let carId = req.body.id;
    const { company, team } = req.user;
    logger.info(`FormController.complete email: ${req.user.email}`);
    // validate answers in body
    if (!answers) {
      return res.status(400).json({
        message: 'Debes enviar las respuestas',
        status: 400
      });
    }
    logger.info(
      `FormController.complete email: ${
        req.user.email
      }, answers: ${JSON.stringify(answers)}`
    );
    // validate vin in body
    if (!vin && !transmittal && !id) {
      return res.status(400).json({
        message: 'Debes enviar el vin o OT o id',
        status: 400
      });
    }
    const updatedUser = await User.findById(req.user._id).populate([
      { path: 'venue' }
    ]);
    if (!updatedUser) {
      return res.status(404).json({
        message: 'No se ha encontrado el formulario solicitado.',
        status: 404
      });
    }
    req.user.venue = updatedUser.venue;
    try {
      let car: any = null;
      if (vin) {
        vin = vin.replace(/[\W_]+/g, '');
        let carFilter = req.user.company.handler
          ? {
              $and: [
                { $or: [{ vin: { $eq: vin } }, { vin2: { $eq: vin } }] },
                { $or: [{ company: company }, { handlerCompany: company }] }
              ]
            }
          : {
              $or: [{ vin: { $eq: vin } }, { vin2: { $eq: vin } }],
              team
            };
        car = await Car.findOne(carFilter);
      } else if (carId) {
        car = await Car.findOne({ _id: carId });
      }

      let inventoryCar: any = null;
      let inventoryItem: any = null;
      let images: string[] = [];
      if (inventory) {
        let check = await InventoryController.checkCarToInventory(
          req.user as IUserModel,
          vin,
          inventory
        );
        const { ok, message, code } = check;
        if (!ok) {
          logger.error(`InventoryController.checkCarToInventory: ${message}`);
          return res.status(400).json({
            message,
            status: code
          });
        }
        inventoryCar = check.inventoryCar;
        inventoryItem = check.inventory;
      }

      if (car || transmittal) {
        const form = await this.getFormWithScale({
          _id: id,
          team
        });
        if (form) {
          const keyRawAnswers = crypto
            .createHash('md5')
            .update(JSON.stringify(answers))
            .digest('hex');
          const today = moment().startOf('day');
          const tomorrow = moment(today).add(1, 'days');
          let query: any = {
            $and: [
              {
                form: form._id,
                venue: updatedUser.venue,
                keyRawAnswers,
                createdAt: {
                  $gte: today.toDate(),
                  $lt: tomorrow.toDate()
                }
              }
            ]
          };

          if (car) {
            query['$and'].push({ car: car._id });
          }

          if (transmittal) {
            query['$and'].push({
              transmittal: new Types.ObjectId(transmittal)
            });
          }

          const existControl = await Participant.findOne(query);
          if (existControl) {
            const today = moment().startOf('day');
            const count = await Participant.find({
              user: req.user,
              createdAt: {
                $gt: today.toDate()
              }
            }).countDocuments();

            return res.json({
              data: {
                id,
                count,
                vin,
                qualification: 0,
                exist: true
              },
              status: 200
            });
          }
          // initialize participant
          const participantObject: any = {
            name: form.name,
            team: car.team,
            company: car.company,
            form: form._id,
            deliveryToCustomer: form.deliveryToCustomer,
            car,
            transmittal: transmittal,
            description: form.description,
            user: req.user._id,
            venue: updatedUser.venue,
            active: form.active,
            kind: transmittal ? KindForm.transmittal : form.kind,
            deliveryInfo: {},
            rawAnswers: answers,
            rawBody: req.body,
            reliability,
            keyRawAnswers
          };

          if (form.webQuestion) {
            participantObject.webQuestion = form.webQuestion;
          }

          let draft = await DraftModel.findOne({
            car: car._id,
            venue: updatedUser.venue,
            form: id
          });

          if (draft) {
            participantObject.startDate = draft.createdAt;
          }

          if (req.user.company.handler) {
            participantObject.handlerCompany = company;
          }

          if (form.reception) {
            participantObject.reception = form.reception;
            participantObject.receptionText = form.receptionText;
            participantObject.receptionVenue = form.receptionVenue;
            participantObject.receptionVenueText = form.receptionVenueText;
            if ('reception' in answers) {
              const { reception } = answers;
              participantObject.receptionConfirmation = [true, 'true'].includes(
                reception.value
              );
              if (reception.images) {
                participantObject.receptionImages = reception.images.map(
                  (image: string) => new Types.ObjectId(image)
                );
              }
            }
            if ('receptionVenue' in answers) {
              const { receptionVenue } = answers;
              participantObject.receiveFrom = receptionVenue.value;
            }
            // add meta to car
            /*if (car?._id) {
              await Car.updateOne({ _id: car._id }, {
                'meta.location.venue': updatedUser.venue,
                'meta.location.checkedDate': new Date()
              });
            }*/
          }

          if (form.shipping) {
            participantObject.shipping = form.shipping;
            participantObject.shippingText = form.shippingText;
            participantObject.shippingVenue = form.shippingVenue;
            participantObject.shippingVenueText = form.shippingVenueText;
            if ('shipping' in answers) {
              const { shipping } = answers;
              participantObject.shippingConfirmation = [true, 'true'].includes(
                shipping.value
              );
              if (shipping.images) {
                participantObject.shippingImages = shipping.images.map(
                  (image: string) => new mongoose.Types.ObjectId(image)
                );
              }
            }
            if ('shippingVenue' in answers) {
              const { shippingVenue } = answers;
              participantObject.sendTo = shippingVenue.value;
            }
          }

          if (form.carrier) {
            participantObject.carrier = form.carrier;
            participantObject.carrierText = form.carrierText;
            if ('carrier' in answers) {
              const { carrier } = answers;
              participantObject.carrierBy = carrier.value;
            }
          }

          if (form.conciliation && 'conciliation' in answers) {
            const conciliation = answers.conciliation;
            participantObject.conciliation = [true, 'true'].includes(
              conciliation.value
            );
            participantObject.conciliationText = form.conciliationText;
            if (conciliation.images) {
              participantObject.conciliationImages = conciliation.images.map(
                (image: string) => new mongoose.Types.ObjectId(image)
              );
            }
          }
          const newParticipant = new Participant(participantObject);
          // var sum sections
          let sumSectionWeigths = 0;
          let sumSectionQualifications = 0;
          // array of images ids
          let allImages: any = [];
          for (const section of form.sections) {
            // var sum questions
            let sumWeigths = 0;
            let sumQualifications = 0;
            // array of answers
            const newAnswers: any[] = [];
            for (const question of section.questions) {
              // calculate qualification and set vars of the answer
              const questionID = question._id.toString();
              // get selected answer
              const answer = GeneralUtils.getObjectProperty(
                answers,
                questionID,
                null
              );

              if (
                question.kind === KindQuestion.image &&
                [KindQuestionImage.picture, KindQuestionImage.photo].includes(
                  question.imageType as KindQuestionImage
                )
              ) {
                if (answer && answer.images && answer.images.length) {
                  images = [...images, ...answer.images];
                }
              }
              // find choice selected
              const choice = question.scale
                ? question.scale.choices.find((choice) => {
                    return answer
                      ? choice._id.toString() === answer.value
                      : false;
                  })
                : null;
              // calculate qualification
              let qualification = 0;
              if (choice) {
                qualification = (100 / question.scale.maxValue) * choice.value;
              }

              // no apply
              let na: boolean = false;
              if (choice && choice.na) {
                na = true;
              } else {
                sumQualifications += qualification * question.weight;
                sumWeigths += question.weight;
              }

              // concat allImages
              if (
                choice &&
                choice.requireImage &&
                answer &&
                answer.images &&
                answer.images.length
              ) {
                allImages = [...answer.images, ...allImages];
              }

              // delete images no used
              if (
                choice &&
                !choice.requireImage &&
                answer &&
                answer.images &&
                answer.images.length
              ) {
                answer.images.forEach(async (image: string) => {
                  const deleteFile = await ParticipantFile.findById(image);
                  if (deleteFile) {
                    await ParticipantFile.deleteOne({ _id: image });
                  }
                });
              }

              const matrixValues: any[] =
                (question.kind === KindQuestion.matrix) &&
                answer && answer.matrix ? answer.matrix : [];

              // generate answer
              const comment =
                (question.kind === KindQuestion.text ||
                  (choice && choice.requireComment)) &&
                answer &&
                answer.comment
                  ? answer.comment
                  : '';
              if (question?.kindUpdate === 'participant.clientName') {
                newParticipant.deliveryInfo.name = comment;
              } else if (question?.kindUpdate === 'participant.clientEmail') {
                newParticipant.deliveryInfo.email = comment;
              } else if (question?.kindUpdate === 'participant.clientRut') {
                newParticipant.deliveryInfo.rut = comment;
              } else if (question?.kindUpdate === 'participant.order') {
                newParticipant.deliveryInfo.order = comment;
              } else if (question?.kindUpdate === 'participant.parking') {
                newParticipant.deliveryInfo.parking = comment;
              } else if (
                question?.kindUpdate === 'participant.clientSignature'
              ) {
                newParticipant.deliveryInfo.signature = answer?.images?.length
                  ? answer.images.map(
                      (image: string) => new mongoose.Types.ObjectId(image)
                    )
                  : [];
              } else if (
                question?.kindUpdate === 'participant.clientIdentifyCard'
              ) {
                newParticipant.deliveryInfo.identifyCard = answer?.images
                  ?.length
                  ? answer.images.map(
                      (image: string) => new mongoose.Types.ObjectId(image)
                    )
                  : [];
              } else if (question?.kindUpdate === 'participant.plateEvidence')
                newParticipant.deliveryInfo.plateEvidence = answer?.images
                  ?.length
                  ? answer.images.map(
                      (image: string) => new mongoose.Types.ObjectId(image)
                    )
                  : [];

              newAnswers.push({
                _id: question._id,
                question: question.question,
                kindUpdate: question?.kindUpdate,
                shortName: question.shortName,
                scale: question.scale,
                conciliation: question.conciliation,
                accessories: question.accessories,
                damages: question.damages,
                damagesSelected: answer && answer.damages ? answer.damages : [],
                accesoriesAnswered:
                  (question.kind === KindQuestion.accessory ||
                    (choice && choice.requireAccesories)) &&
                  answer &&
                  answer.accesories
                    ? await this.processAccesoryItems(answer.accesories)
                    : [],
                risk: question.risk,
                comment,
                observe: question.observe,
                answer: answer
                  ? new mongoose.Types.ObjectId(answer.value)
                  : null,
                images: answer?.images?.length
                  ? answer.images.map(
                      (image: string) => new mongoose.Types.ObjectId(image)
                    )
                  : [],
                qualification,
                na,
                matrix: question.matrix,
                matrixValues: matrixValues,
                weight: question.weight,
                kind: question.kind,
                order: question.order,
                hint: question.hint,
                optional: question.optional,
                minValue: question.minValue,
                maxValue: question.maxValue,
                score: answer && answer.score ? answer.score : -1,
                requireSeverity: question.requireSeverity
              });
            }
            // calculate section qualification
            const sectionQualification = sumQualifications
              ? sumQualifications / sumWeigths
              : 0;
            sumSectionQualifications += sectionQualification * section.weight;
            sumSectionWeigths += section.weight;
            // generate answer section
            newParticipant.sections.push({
              _id: section._id,
              name: section.name,
              shortName: section.shortName,
              answers: newAnswers,
              qualification: sectionQualification,
              weight: section.weight,
              order: section.order
            });
          }
          // calculate participant qualification
          const formQualification = sumSectionQualifications
            ? sumSectionQualifications / sumSectionWeigths
            : 0;
          newParticipant.qualification = formQualification;

          newParticipant.hasDamages = newParticipant.sections.some(
            (section: any) => {
              return section.answers.some((answer: any) => {
                return answer.damagesSelected.length > 0;
              });
            }
          );

          try {
            const updateTeam = await Team.findOneAndUpdate(
              { _id: team._id },
              { $inc: { formsNumber: 1 } },
              { new: true }
            );

            if (updateTeam) {
              newParticipant.number = updateTeam.formsNumber;
            }
            // save the participant
            await newParticipant.save();
            req.user.company.handler
              ? await carTracker.fromParticipant({
                  id: newParticipant._id,
                  handlerCompany: req.user.company
                })
              : await carTracker.fromParticipant({ id: newParticipant._id });

            if (inventoryCar) {
              logger.info('Actualizando inventoryCar');
              let files: IInventoryFile[] = [];
              if (images && images.length > 0) {
                files = await this.copyFormFileToInventoryFile(
                  images,
                  inventory,
                  car,
                  req.user as IUserModel
                );
              }
              let inventoriedCar = await InventoryController.inventoryCar(
                req.user as IUserModel,
                inventoryItem,
                inventoryCar,
                files,
                containerFound
              );
              inventoriedCar.participant = newParticipant._id;
              await inventoryCar.save();
            }

            // associate transmittalItem to participant
            if (transmittalItem?.length) {
              newParticipant.transmittalItem = transmittalItem;
              await newParticipant.save();

              let transmittalItemData = await TransmittalItem.findOneAndUpdate(
                { _id: transmittalItem },
                { $push: { revisions: newParticipant._id } },
                { new: true }
              ).populate(TransmittalController.itemPopulate);

              let transmittalObject = await Transmittal.findOne({
                _id: transmittalItemData!!.transmittal
              });

              // update request when check item
              const milestone = await Milestone.findOne({
                step: ChoicesStepMilestone.checkItem,
                team,
                type: transmittalObject!!.type
              });

              if (milestone?.requestItemStatus) {
                const requestItem = await RequestItem.findOneAndUpdate(
                  { transmittalItem },
                  { $set: { status: milestone.requestItemStatus } },
                  { new: true }
                ).populate(RequestController.itemPopulate);
                if (requestItem) {
                  socket()
                    .to(`request-list-${team._id}`)
                    .emit('UPDATE_REQUEST_ITEM', {
                      idRequest: requestItem.request._id,
                      item: requestItem
                    });
                  socket()
                    .to(`request-detail-${team._id}`)
                    .emit('UPDATE_REQUEST_ITEM', {
                      idRequest: requestItem.request._id,
                      item: requestItem
                    });
                }
              }
              // end update request when check item
              socket()
                .to(`transmittal-list-${team._id}`)
                .emit('UPDATE_TRANSMITTAL_ITEM', {
                  transmittalItem: transmittalItemData
                });
            }

            if (transmittal && transmittal?.length) {
              // update request when check item
              const updatedTransmittal = await Transmittal.findOne({
                _id: transmittal
              });
              const milestone = await Milestone.findOne({
                step: ChoicesStepMilestone.finishTransmittal,
                team,
                type: updatedTransmittal?.type
              });
              let requestItems: any[];

              await TransmittalItem.updateMany(
                { transmittal: transmittal },
                { $set: { arrivalDate: moment().toDate() } }
              );
              requestItems = await RequestItem.find({ transmittal, team })
                .populate(RequestController.itemPopulate)
                .lean();

              if (milestone && milestone?.requestItemStatus) {
                await RequestItem.updateMany(
                  { transmittal },
                  { $set: { status: milestone.requestItemStatus } }
                );
                requestItems = await RequestItem.find({ transmittal, team })
                  .populate(RequestController.itemPopulate)
                  .lean();
              }
              const newTransmittal = await Transmittal.findOneAndUpdate(
                {
                  _id: transmittal
                },
                {
                  $set: {
                    status: ChoicesStatusTransmittal.completed
                  }
                },
                {
                  new: true
                }
              ).populate([
                {
                  path: 'revision',
                  select: ['_id', 'hasDamages']
                },
                {
                  path: 'transporter.carrier',
                  select: ['name']
                },
                {
                  path: 'type',
                  select: ['name']
                },
                {
                  path: 'evidenceFullLoad',
                  select: ['file', 'thumbnail', 'milestone']
                },
                {
                  path: 'transporter.driver',
                  select: ['firstName', 'lastName']
                },
                {
                  path: 'items',
                  select: [
                    'car',
                    'requestItem',
                    'destination',
                    'origin',
                    'loadingDate',
                    'arrivalDate',
                    'observation'
                  ],
                  populate: TransmittalController.itemPopulate
                },
                {
                  path: 'files',
                  select: ['file', 'thumbnail']
                },
                {
                  path: 'createdBy',
                  select: ['firstName', 'lastName']
                }
              ]);

              socket()
                .to(`transmittal-list-${team._id}`)
                .emit('UPDATE_TRANSMITTAL', {
                  transmittal: newTransmittal
                });

              if (requestItems.length) {
                for (const requestItem of requestItems) {
                  socket()
                    .to(`request-list-${team._id}`)
                    .emit('UPDATE_REQUEST_ITEM', {
                      idRequest: requestItem.request._id,
                      item: requestItem
                    });
                  socket()
                    .to(`request-detail-${team._id}`)
                    .emit('UPDATE_REQUEST_ITEM', {
                      idRequest: requestItem.request._id,
                      item: requestItem
                    });
                }
              }

              // end update request when finish transmittal
            }

            // associate file to participant
            if (allImages.length) {
              await ParticipantFile.updateOne(
                {
                  _id: { $in: allImages }
                },
                {
                  participant: newParticipant
                },
                {
                  multi: true
                }
              );
            }

            if (car) {
              car.lastForm = newParticipant;
              await car.save();

              // send refresh with websocket to dashboard list
              socket()
                .to(
                  form.deliveryToCustomer
                    ? `deliveries-view-${team._id}`
                    : `dashboard-vin-view-${team._id}`
                )
                .emit('REFRESH', {
                  update: true,
                  formId: form._id,
                  venueId: updatedUser.venue._id,
                  car: newParticipant._id,
                  notification: {
                    title: 'Vehículo revisado',
                    text: `${req.user.firstName} ${req.user.lastName} revisó ${car.brand} (${car.denomination}) en ${updatedUser.venue.name}.`
                  }
                });

              // send refresh with websocket to dashboard detail
              socket()
                .to(`dashboard-vin-detail-${team._id}-${car._id}`)
                .emit(
                  `ADD_PARTICIPANT`,
                  await Participant.findById(newParticipant._id, {
                    number: 1,
                    name: 1,
                    user: 1,
                    venue: 1,
                    createdAt: 1,
                    qualification: 1
                  })
                    .populate([
                      {
                        path: 'user',
                        select: ['firstName', 'lastName']
                      },
                      {
                        path: 'venue',
                        select: ['name']
                      },
                      {
                        path: 'company',
                        select: ['name']
                      }
                    ])
                    .lean(true)
                );
              await new ActivityHistory({
                team,
                company,
                user: req.user._id,
                type: ChoicesTypeActivity.checklist,
                car: {
                  _id: car._id,
                  vin: car.vin
                }
              }).save();

              if (form.triggers && form.triggers.length) {
                let triggersHandler = new TriggerHandler(form, newParticipant);
                await triggersHandler.execute({});
              }
            }
            const today = moment().startOf('day');
            const tomorrow = moment(today).add(1, 'days');
            const count = await Participant.find({
              user: req.user,
              createdAt: {
                $gte: today.toDate(),
                $lt: tomorrow.toDate()
              }
            }).countDocuments();

            logger.info(
              `FormController.complete: ${req.user.email} ${JSON.stringify({
                id,
                count,
                vin
              })}`
            );
            await DraftModel.deleteMany({
              car: car._id,
              venue: updatedUser.venue,
              form: id
            });

            return res.json({
              data: {
                id,
                count,
                vin,
                qualification: formQualification
              },
              status: 200
            });
          } catch (e) {
            /* istanbul ignore next */
            console.log(e);
            // return error, if the form could not be recorded
            /* istanbul ignore next */
            return res.status(400).json({
              message: e,
              status: 400
            });
          }
        } else {
          // return error, if the form could not find
          return res.status(400).json({
            message: 'No se ha encontrado el formularío',
            status: 400
          });
        }
      } else {
        return res.status(400).json({
          message: 'VIN no encontrado.',
          status: 400
        });
      }
    } catch (e) {
      // Raven.captureException(e, { req });
      /* istanbul ignore next */
      console.log(e);
      console.log(e.stack);
      /* istanbul ignore next */
      return res.status(400).json({
        message: e,
        status: 400
      });
    }
  }

  public async uploadFile(req: IRequest, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const { company } = req.user;
      const file: any = GeneralUtils.getFileFromRequest(req.files, 'file');
      if (file) {
        logger.info(
          `FormController.uploadFile email: ${
            req.user.email
          } form: ${id} file: ${JSON.stringify(file)}`
        );
        try {
          const participantFile = new ParticipantFile();
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
          file.form = id;

          participantFile.user = req.user._id;
          participantFile.company = company._id;
          participantFile.attach('file', file, async (error: any) => {
            if (error) {
              /* istanbul ignore next */
              return res.status(400).json(error);
            } else {
              await participantFile.save();
              return res.status(201).json({
                data: {
                  _id: participantFile._id,
                  file: participantFile.file
                },
                status: 201
              });
            }
          });
        } catch (e) {
          // Raven.captureException(e, { req });
          /* istanbul ignore next */
          logger.error(`async error:`);
          /* istanbul ignore next */
          logger.error(e);
          /* istanbul ignore next */
          return res.status(400).json(e);
        }
      } else {
        logger.error(`uploadFile: La imagen es obligatoria.`);
        return res.status(400).json({
          message: 'La imagen es obligatoria.',
          status: 400
        });
      }
    } catch (e) {
      // Raven.captureException(e, { req, user: req.user });
      /* istanbul ignore next */
      logger.error(`changePreferred: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      return res.status(400).json({
        message: 'Ha ocurrido un error',
        status: 400
      });
    }
  }

  public async changePreferred(req: IRequest, res: Response): Promise<any> {
    let { form } = req.body;
    const team = req.user.team._id;
    try {
      logger.info(
        `FormController.changePreferred email: ${
          req.user.email
        } body: ${JSON.stringify(req.body)}`
      );
      const user = await UserModel.findOne({
        _id: req.user._id,
        team,
        active: true
      });
      // validate exist user
      if (user) {
        form = await Form.findOne({ _id: form, team });
        // validate exist form
        if (form) {
          user.preferred = form;
          await user.save();
          res.status(200).json({
            message: 'Se ha actualizado',
            status: 200
          });
        } else {
          logger.error(`changePreferred: Formulario no encontrado`);
          logger.error(
            `{user: {_id: ${req.user._id}, email: ${req.user.email}}`
          );
          res.status(400).json({
            message: 'Formulario no encontrado',
            status: 400
          });
        }
      } else {
        logger.error(`changePreferred: Usuario no encontrado`);
        logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
        res.status(400).json({
          message: 'Usuario no encontrado',
          status: 400
        });
      }
    } catch (e) {
      // Raven.captureException(e, { req });
      /* istanbul ignore next */
      logger.error(`changePreferred: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      res.status(400).json({
        message: 'Ha ocurrido un error',
        status: 400
      });
    }
  }

  public async damagesDashboard(req: IRequest, res: Response): Promise<any> {
    try {
      const team = req.user.team._id;
      const damaged = await Participant.aggregate([
        {
          $match: {
            team,
            venue: {
              $in: req.user.venuesPermissions()
            },
            'sections.answers.kind': 'damage',
            'sections.answers.damagesSelected._id': { $exists: true }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        }
      ]);

      const undamaged = await Participant.aggregate([
        {
          $match: {
            team,
            venue: {
              $in: req.user.venuesPermissions()
            },
            'sections.answers.kind': 'damage',
            'sections.answers.damagesSelected._id': { $exists: false }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        }
      ]);

      const allVenues: any[] = [];
      if (damaged) {
        damaged.forEach((item) => {
          if (
            item._id.venue &&
            !allVenues.includes(item._id.venue.toString())
          ) {
            allVenues.push(item._id.venue.toString());
          }
        });
      }
      undamaged.forEach((item) => {
        if (item._id.venue && !allVenues.includes(item._id.venue.toString())) {
          allVenues.push(item._id.venue.toString());
        }
      });

      const venuesPermissions = req.user.venuesPermissions(true);
      const venues: string[] = [];
      venuesPermissions.forEach((v) => {
        if (allVenues.includes(v) && !venues.includes(v)) {
          venues.push(v);
        }
      });

      const damagesData: any = {};
      venues.forEach(
        (venue) => (damagesData[venue] = { damaged: 0, undamaged: 0 })
      );

      damaged.forEach((item) => {
        if (item._id.venue in damagesData) {
          damagesData[item._id.venue].damaged = item.count;
        }
      });
      undamaged.forEach((item) => {
        if (item._id.venue in damagesData) {
          damagesData[item._id.venue].undamaged = item.count;
        }
      });

      const data: any = {
        damaged: venues.map((v) => damagesData[v].damaged),
        undamaged: venues.map((v) => damagesData[v].undamaged),
        venues
      };
      res.json(data);
    } catch (e) {
      // Raven.captureException(e, { req });
      /* istanbul ignore next */
      logger.error(`dashboard damages: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      res.status(400).json({
        message: 'Ha ocurrido un error',
        status: 400
      });
    }
  }

  public participantWithDamages(participant: any): Promise<any> {
    return new Promise((resolve) => {
      participant.hasDamages = participant.sections.some((section: any) => {
        return section.answers.some((answer: any) => {
          return answer.damagesSelected.length > 0;
        });
      });
      resolve(participant);
    });
  }

  public async damagesDashboardPerDay(
    req: IRequest,
    res: Response
  ): Promise<any> {
    try {
      const days = 15;
      moment.locale('es');
      moment.tz.setDefault('America/Santiago');
      const participants = await Participant.find(
        {
          venue: {
            $in: req.user.venuesPermissions()
          },
          createdAt: {
            $gte: moment().endOf('day').subtract(days, 'd').toDate()
          },
          kind: { $ne: KindForm.transmittal }
        },
        {
          _id: true,
          venue: true,
          // user: true,
          createdAt: true,
          'sections.answers.damagesSelected': true
        }
      )
        .populate([
          {
            path: 'venue',
            select: ['_id', 'name']
          } /*,{
        path: 'user',
        select: ['_id', 'email']
      }*/
        ])
        .lean();
      const data: any = {};
      for (let i = 0; i < days; i++) {
        const key = moment()
          .subtract(i, 'days')
          .startOf('day')
          .format('YYYY-MM-DD');
        data[key] = {
          damaged: 0,
          undamaged: 0
        };
      }

      const promises = [];
      for (const participant of participants) {
        promises.push(this.participantWithDamages(participant));
      }
      let participantsWithDamages: any[] = [];
      while (promises.length) {
        participantsWithDamages = [
          ...participantsWithDamages,
          ...(await bluebird.all(promises.splice(0, 500)))
        ];
      }
      for (const participant of participantsWithDamages) {
        const venueId = participant.venue._id.toString();
        // const userId = participant.user._id.toString();
        const dayKey = moment(participant.createdAt).format('YYYY-MM-DD');
        if (!data.hasOwnProperty(dayKey)) {
          data[dayKey] = {
            damaged: 0,
            undamaged: 0
          };
        }
        if (!data[dayKey].hasOwnProperty(venueId)) {
          data[dayKey][venueId] = {
            name: participant.venue.name,
            damaged: 0,
            undamaged: 0
          };
        }
        // if (!data[dayKey][venueId].hasOwnProperty(userId)) {
        //   data[dayKey][venueId][userId] = {
        //     email: participant.user.email,
        //     damaged: 0,
        //     undamaged: 0
        //   };
        // }
        data[dayKey][participant.hasDamages ? 'damaged' : 'undamaged']++;
        data[dayKey][venueId][
          participant.hasDamages ? 'damaged' : 'undamaged'
        ]++;
        // data[dayKey][venueId][userId][participant.hasDamages ? 'damaged' : 'undamaged']++;
      }
      res.json(data);
    } catch (e) {
      // Raven.captureException(e, { req });
      /* istanbul ignore next */
      logger.error(`dashboard damages: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      res.status(400).json({
        message: 'Ha ocurrido un error',
        status: 400
      });
    }
  }

  public async timingDerco(req: IRequest, res: Response): Promise<any> {
    try {
      const team = req.user.team._id;
      const userObject = await User.findOne({ _id: req.user._id });

      // Derco
      if (
        userObject &&
        userObject.team.toString() === '5bf2de34caf8ef7096105cda'
      ) {
        const total = 2;
        // el lead time supuesto es de 48 horas
        const threshold = 60 * 24 * 3;

        // despacho:  5b0487db835536612bab1b61
        // recepcion: 5b1ae5799ebea419025b3e41
        const reception = await Form.findOne({
          _id: '5b0487db835536612bab1b61'
        });
        const cars = await Car.find({
          team,
          lastForm: { $ne: null }
        });

        const carsDict: any = {};
        for (const car of cars) {
          carsDict[car._id.toString()] = car;
        }

        let receptions: any[] = [];
        for (let i = 0; i < total; i++) {
          const aux = await Participant.find(
            {
              team,
              form: reception!._id,
              createdAt: {
                $gt: moment()
                  .subtract((i + 1) * 30, 'days')
                  .toDate(),
                $lt: moment()
                  .subtract(i * 30, 'days')
                  .toDate()
              }
            },
            ['car', 'createdAt'],
            {
              sort: {
                createdAt: -1
              }
            }
          );
          receptions = receptions.concat(aux);
        }

        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Revisiones', {
          properties: {
            // defaultRowHeight: 30
          },
          pageSetup: {
            fitToPage: true,
            fitToHeight: 100,
            fitToWidth: 1
          }
        });

        worksheet.columns = [
          {
            header: 'VIN',
            key: 'vin',
            width: 30
          },
          {
            header: 'Marca',
            key: 'brand',
            width: 30
          },
          {
            header: 'Fecha carga',
            key: 'createdAt',
            width: 30
          },
          {
            header: 'Mes carga',
            key: 'createdAtMonth',
            width: 30
          },
          {
            header: 'Fecha revisión',
            key: 'checkedAt',
            width: 30
          },
          {
            header: 'Mes revisión',
            key: 'checkedAtMonth',
            width: 30
          },
          {
            header: 'Delta tiempo',
            key: 'leadtime',
            width: 20
          },
          {
            header: 'On time',
            key: 'ontime',
            width: 20
          }
        ];

        for (const reception of receptions) {
          const carID = reception.car.toString();

          if (carID in carsDict) {
            const car = carsDict[carID];

            const t0 = moment(car.createdAt).subtract(4, 'hours');
            const t1 = moment(reception.createdAt).subtract(4, 'hours');

            const hour = parseInt(t0.format('HH'), 10);
            if (hour >= 20 || hour <= 2) continue;

            const dm = t1.diff(t0, 'minutes');

            if (dm > 10) {
              const ontime = dm < threshold ? 1 : 0;

              worksheet.addRow({
                vin: car.vin,
                brand: car.brand,
                createdAt: t0.format('YYYY-MM-DD HH:mm:ss'),
                createdAtMonth: t0.format('MM'),
                checkedAt: t1.format('YYYY-MM-DD HH:mm:ss'),
                checkedAtMonth: t1.format('MM'),
                leadtime: dm,
                ontime
              });
            }
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
          'attachment; filename=revisiones-03-07-2019.xlsx'
        );
        return res.sendFile(tempFilePath);
      }
    } catch (e) {
      // Raven.captureException(e, { req });
      /* istanbul ignore next */
      logger.error(`dashboard timing derco: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      res.status(400).json({
        message: 'Ha ocurrido un error',
        status: 400
      });
    }
  }

  private static async getDercoDeliveryParticipants(
    team: ITeamModel,
    from: moment.Moment,
    to: moment.Moment
  ): Promise<IParticipant[]> {
    const receptionForm = await Form.findOne({
      _id: '5b1ae5799ebea419025b3e41'
    });
    return Participant.aggregate([
      {
        $match: {
          team,
          form: receptionForm!._id,
          createdAt: {
            $gte: from,
            $lte: to
          }
        }
      },
      {
        $project: {
          car: 1,
          venue: 1,
          receiveFrom: 1,
          form: 1,
          createdAt: 1
        }
      },
      {
        $lookup: {
          from: 'cars',
          localField: 'car',
          foreignField: '_id',
          as: 'related_car'
        }
      },
      { $unwind: '$related_car' },
      {
        $match: {
          'related_car.team': team,
          'related_car.lastForm': { $ne: null },
          'related_car.createdAt': {
            $gte: from,
            $lte: to
          }
        }
      },
      {
        $lookup: {
          from: 'venues',
          localField: 'venue',
          foreignField: '_id',
          as: 'to'
        }
      },
      { $unwind: '$to' }
    ]);
  }

  private async getDeliveryParticipants(
    team: ITeamModel,
    from: moment.Moment,
    to: moment.Moment
  ): Promise<IParticipant[]> {
    const distributors = await Venue.find({ team, type: 'distributor' });
    const receivers = await Venue.find({ team, type: 'receiver' });

    const receptions = await Participant.aggregate([
      {
        $lookup: {
          from: 'participants',
          localField: 'car',
          foreignField: 'car',
          as: 'recived_participants'
        }
      },
      {
        $unwind: '$recived_participants'
      },
      {
        $match: {
          team,
          venue: { $in: receivers.map((v) => v._id) },
          receiveFrom: { $in: distributors.map((v) => v._id) },
          reception: true,
          createdAt: {
            $gte: from,
            $lte: to
          },
          'recived_participants.venue': { $in: distributors.map((v) => v._id) },
          'recived_participants.reception': false,
          'recived_participants.createdAt': {
            $gte: from,
            $lte: to
          }
        }
      },
      {
        $project: {
          car: 1,
          venue: 1,
          createdAt: 1,
          'recived_participants.createdAt': 1,
          'recived_participants.car': 1,
          'recived_participants.team': 1,
          'recived_participants.venue': 1,
          'recived_participants._id': 1
        }
      },
      {
        $sort: { 'recived_participants.createdAt': -1 }
      },
      {
        $lookup: {
          from: 'venues',
          localField: 'venue',
          foreignField: '_id',
          as: 'venue'
        }
      },
      { $unwind: '$venue' },
      {
        $lookup: {
          from: 'venues',
          localField: 'recived_participants.venue',
          foreignField: '_id',
          as: 'recived_participants.venue'
        }
      },
      { $unwind: '$recived_participants.venue' },
      {
        $group: {
          _id: '$_id',
          car: { $first: '$car' },
          venue: { $first: '$venue' },
          createdAt: { $first: '$createdAt' },
          recived_participants: { $push: '$recived_participants' }
        }
      },
      {
        $project: {
          car: 1,
          venue: 1,
          createdAt: 1,
          recived_participants: { $arrayElemAt: ['$recived_participants', 0] }
        }
      }
    ]);

    return receptions.filter((reception, index) => {
      return (
        index ===
        receptions.findIndex((obj) => {
          return (
            obj.recived_participants._id.toString() ===
            reception.recived_participants._id.toString()
          );
        })
      );
    });
  }

  private static isDercoUser(user: IUserModel): boolean {
    return user && user.team.toString() === DERCO_TEAM;
  }

  private static parseReception(
    reception: IParticipant,
    distributorTable: any
  ): any {
    const recivedparticipant: IParticipant = (reception as any)
      .recived_participants as IParticipant;
    const sendingVenue: IVenueModel = recivedparticipant.venue;

    const daysLimit =
      distributorTable[sendingVenue._id.toString()] &&
      distributorTable[sendingVenue._id.toString()][
        reception.venue._id.toString()
      ]
        ? distributorTable[sendingVenue._id.toString()][
            reception.venue._id.toString()
          ]
        : 5;
    const threshold = daysLimit * 60 * 24;
    const t0 = moment(recivedparticipant.createdAt);
    const t1 = moment(reception.createdAt);
    const dm = t1.diff(t0, 'minutes');

    return {
      date_send: t0,
      date_recived: t1,
      reception_id: reception._id,
      send_id: recivedparticipant._id,
      from: sendingVenue.abbreviation || sendingVenue.name,
      to: reception.venue.abbreviation || reception.venue.name,
      atTime: dm <= threshold,
      daysLimit
    };
  }

  private static parseDercoReception(
    reception: IParticipant,
    distributorTable: any,
    dercoDistributionVenue: IVenueModel
  ): any {
    const car: ICarModel = (reception as any).related_car as ICarModel;
    // TODO: Get The real origin Venue
    const sendingVenue = dercoDistributionVenue;
    const venue = (reception as any).to as IVenueModel;

    const daysLimit =
      distributorTable[sendingVenue._id.toString()] &&
      distributorTable[sendingVenue._id.toString()][venue._id.toString()]
        ? distributorTable[sendingVenue._id.toString()][venue._id.toString()]
        : 5;
    const threshold = daysLimit * 60 * 24;
    const t0 = moment(car.createdAt);
    const t1 = moment(reception.createdAt);
    const dm = t1.diff(t0, 'minutes');

    return {
      date_send: t0,
      date_recived: t1,
      reception_id: reception._id,
      from: sendingVenue!.abbreviation || sendingVenue!.name,
      to: venue.abbreviation || venue.name,
      atTime: dm <= threshold,
      daysLimit
    };
  }

  public async timingDashboard(req: IRequest, res: Response): Promise<any> {
    try {
      const { team } = req.user as { team: ITeamModel };
      const userObject = await User.findOne({ _id: req.user._id });
      const distributors = await Venue.find(
        { team, type: 'distributor' },
        {}
      ).populate({
        path: 'sendToDays.venue',
        select: ['_id']
      });

      const start: any = req.query.start;
      const to: any = req.query.end;

      let startDate: any =
        start && start !== ''
          ? moment(start, 'YYYY-MM-DD')
          : moment().subtract(3, 'months').startOf('month').startOf('day');

      const toDate: any =
        to && to !== ''
          ? moment(to, 'YYYY-MM-DD')
          : moment().endOf('month').endOf('day');

      const distributorTable: any = {};
      distributors.map((distributor: IVenueModel) => {
        const distributorId = distributor._id.toString();
        if (!(distributorId in distributors))
          distributorTable[distributorId] = {};

        distributor.sendToDays.map((venueDay: IVenueDay) => {
          const venueId = venueDay.venue._id.toString();
          distributorTable[distributorId][venueId] = venueDay.shippingMaxDays;
        });
      });

      const data: any = {};

      for (
        let i: moment.Moment = startDate;
        i <= toDate;
        i = i.add(1, 'month')
      ) {
        const month = i.format('MM-YYYY');
        data[month] = [];
      }

      startDate =
        start && start !== ''
          ? moment(start, 'YYYY-MM-DD')
          : moment().subtract(3, 'months').startOf('month').startOf('day');

      const isDercoUser: boolean = FormController.isDercoUser(userObject!);
      const receptions: IParticipant[] = isDercoUser
        ? await FormController.getDercoDeliveryParticipants(
            team,
            startDate.toDate(),
            toDate.toDate()
          )
        : await this.getDeliveryParticipants(
            team,
            startDate.toDate(),
            toDate.toDate()
          );

      for (const reception of receptions) {
        const value: any = isDercoUser
          ? FormController.parseDercoReception(
              reception,
              distributorTable,
              distributors[0]
            )
          : FormController.parseReception(reception, distributorTable);
        const month = value.date_send.format('MM-YYYY');
        data[month].push(value);
      }

      return res.json(data);
    } catch (e) {
      // Raven.captureException(e, { req });
      /* istanbul ignore next */
      logger.error(`dashboard timing: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      res.status(400).json({
        message: 'Ha ocurrido un error',
        status: 400
      });
    }
  }

  public async apiRevisionsGapExport(
    req: IRequest,
    res: Response
  ): Promise<any> {
    if (!req.user.hasPermission('exportRevisionsGap')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }

    try {
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Daños', {
        properties: {
          // defaultRowHeight: 30
        },
        pageSetup: {
          fitToPage: true,
          fitToHeight: 100,
          fitToWidth: 1
        }
      });
      worksheet.autoFilter = { from: 'A1', to: 'F1' };

      worksheet.columns = [
        {
          header: 'VIN',
          key: 'vin',
          width: 30
        },
        {
          header: 'Marca',
          key: 'brand',
          width: 30
        },
        {
          header: 'Total revisiones',
          key: 'participants',
          width: 30
        },
        {
          header: 'Fecha despacho',
          key: 'p0CreatedAt',
          width: 30
        },
        {
          header: 'Sucursal despacho',
          key: 'p0Venue',
          width: 30
        },
        {
          header: 'Calificación despacho',
          key: 'p0Qualification',
          width: 30
        },
        {
          header: 'Gas despacho',
          key: 'p0Gas',
          width: 30
        },
        {
          header: 'Pintura despacho',
          key: 'p0Paint',
          width: 30
        },
        {
          header: 'Lata despacho',
          key: 'p0SheetMetal',
          width: 30
        },
        {
          header: 'Fecha recepción',
          key: 'p1CreatedAt',
          width: 30
        },
        {
          header: 'Sucursal recepción',
          key: 'p1Venue',
          width: 30
        },
        {
          header: 'Calificación recepción',
          key: 'p1Qualification',
          width: 30
        },
        {
          header: 'Gas recepción',
          key: 'p1Gas',
          width: 30
        },
        {
          header: 'Pintura recepción',
          key: 'p1Paint',
          width: 30
        },
        {
          header: 'Lata recepción',
          key: 'p1SheetMetal',
          width: 30
        }
      ];

      const team = req.user.team._id;

      const periods = 6;
      for (let i = 0; i < periods; i++) {
        const t0 = moment().subtract(i + 1, 'months');
        const t1 = moment().subtract(i, 'months');

        const cars = await Car.find({
          team,
          lastForm: { $exists: true },
          createdAt: {
            $gte: t0,
            $lte: t1
          }
        }).populate({
          path: 'participants',
          populate: {
            path: 'venue',
            model: 'Venue'
          }
        });

        const f0 = '5b0487db835536612bab1b61';
        const f1 = '5b1ae5799ebea419025b3e41';

        const gasQuestion = '5b64b543cee543c2afda41bd';
        const paintQuestion = '5b64b1f6cc5e14f59724f8d1';
        const sheetMetalQuestion = '5b64b22245f69e40fc5713fb';

        for (const car of cars) {
          if (car.participants!.length > 0) {
            const participants = car.participants!.sort((p0: any, p1: any) =>
              p0.createdAt >= p1.createdAt ? 1 : 0
            );

            let p0: any = null;
            let p1: any = null;

            // only one form
            if (participants.length < 2) {
              if (participants[0].form.toString() === f0) p0 = participants[0];
              else if (participants[0].form.toString() === f1)
                p1 = participants[0];
            } else {
              const length = participants.length;
              p0 = participants[0];
              p1 = participants[length - 1];
            }

            let choice0Gas = null;
            let choice1Gas = null;
            if (p0) {
              const answer0Gas = p0.sections
                .map((s: any) => s.answers)
                .reduce((x: any[], y: any[]) => [...x, ...y], [])
                .find((a: any) => a._id.toString() === gasQuestion);
              if (answer0Gas)
                choice0Gas = answer0Gas.scale.choices.find(
                  (c: any) => c._id.toString() === answer0Gas.answer.toString()
                );
            }

            if (p1) {
              const answer1Gas = p1.sections
                .map((s: any) => s.answers)
                .reduce((x: any[], y: any[]) => [...x, ...y], [])
                .find((a: any) => a._id.toString() === gasQuestion);
              if (answer1Gas)
                choice1Gas = answer1Gas.scale.choices.find(
                  (c: any) => c._id.toString() === answer1Gas.answer.toString()
                );
            }

            let choice0Paint = null;
            let choice1Paint = null;
            if (p0) {
              const answer0Paint = p0.sections
                .map((s: any) => s.answers)
                .reduce((x: any[], y: any[]) => [...x, ...y], [])
                .find((a: any) => a._id.toString() === paintQuestion);
              if (answer0Paint)
                choice0Paint = answer0Paint.scale.choices.find(
                  (c: any) =>
                    c._id.toString() === answer0Paint.answer.toString()
                );
            }

            if (p1) {
              const answer1Paint = p1.sections
                .map((s: any) => s.answers)
                .reduce((x: any[], y: any[]) => [...x, ...y], [])
                .find((a: any) => a._id.toString() === paintQuestion);
              if (answer1Paint)
                choice1Paint = answer1Paint.scale.choices.find(
                  (c: any) =>
                    c._id.toString() === answer1Paint.answer.toString()
                );
            }

            // lata
            let choice0SheetMetal = null;
            let choice1SheetMetal = null;
            if (p0) {
              const answer0SheetMetal = p0.sections
                .map((s: any) => s.answers)
                .reduce((x: any[], y: any[]) => [...x, ...y], [])
                .find((a: any) => a._id.toString() === sheetMetalQuestion);
              if (answer0SheetMetal)
                choice0SheetMetal = answer0SheetMetal.scale.choices.find(
                  (c: any) =>
                    c._id.toString() === answer0SheetMetal.answer.toString()
                );
            }

            if (p1) {
              const answer1SheetMetal = p1.sections
                .map((s: any) => s.answers)
                .reduce((x: any[], y: any[]) => [...x, ...y], [])
                .find((a: any) => a._id.toString() === sheetMetalQuestion);
              if (answer1SheetMetal)
                choice1SheetMetal = answer1SheetMetal.scale.choices.find(
                  (c: any) =>
                    c._id.toString() === answer1SheetMetal.answer.toString()
                );
            }

            const row = {
              vin: car.vin,
              brand: car.brand,

              p0CreatedAt: p0 ? p0.createdAt : '-',
              p0Venue: p0 ? p0.venue.name : '-',
              p0Qualification: p0 ? p0.qualification : '-',
              p0Gas: choice0Gas ? choice0Gas.choice : '-',
              p0Paint: choice0Paint ? choice0Paint.choice : '-',
              p0SheetMetal: choice0SheetMetal ? choice0SheetMetal.choice : '-',

              p1CreatedAt: p1 ? p1.createdAt : '-',
              p1Venue: p1 ? p1.venue.name : '-',
              p1Qualification: p1 ? p1.qualification : '-',
              p1Gas: choice1Gas ? choice1Gas.choice : '-',
              p1Paint: choice1Paint ? choice1Paint.choice : '-',
              p1SheetMetal: choice1SheetMetal ? choice1SheetMetal.choice : '-'
            };

            worksheet.addRow(row);
          }
        }

        /* formats */
        worksheet.getRow(1).eachCell((cell) => {
          cell.font = {
            bold: true
          };
        });

        // const idCol = worksheet.getColumn('id');
        // idCol.eachCell({includeEmpty: true}, (cell) => {
        //   cell.alignment = {vertical: 'middle', horizontal: 'center'};
        // });

        const tempFilePath = tempfile('.xlsx');
        await workbook.xlsx.writeFile(tempFilePath);
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=revisiones-${moment().format(
            'YYYY-MM-DD'
          )}.xlsx`
        );
        return res.sendFile(tempFilePath);
      }
    } catch (e) {
      // Raven.captureException(e, { req });
      /* istanbul ignore next */
      logger.error(`dashboard revisiones: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      res.status(400).json({
        message: 'Ha ocurrido un error',
        status: 400
      });
    }
  }

  public async cleaningDashboard(req: IRequest, res: Response): Promise<any> {
    try {
      const team = req.user.team._id;

      const form = await Form.findById('5b0487db835536612bab1b61');
      const answer = new mongoose.Types.ObjectId('5b64b2e8de5557c85fa14fa0');

      const days: string[] = [];
      const daysDict: any = {};
      if (form) {
        const total = 30 * 6;
        const t0 = moment().subtract(total, 'days');
        for (let i = 0; i < total; i++) {
          const day = moment()
            .subtract(total - i, 'days')
            .format('YYYY-MM-DD');
          daysDict[day] = {
            clean: 0,
            notClean: 0
          };
          days.push(day);
        }

        const cleanDispatch = await Participant.aggregate([
          {
            $match: {
              team,
              form: form._id,
              'sections.answers.answer': answer,
              createdAt: { $gt: t0.toDate() }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              count: { $sum: 1 }
            }
          }
        ]);

        for (const datum of cleanDispatch) {
          const day = datum._id;
          daysDict[day].clean = datum.count;
        }

        const notCleanDispatch = await Participant.aggregate([
          {
            $match: {
              team,
              form: form._id,
              'sections.answers.answer': { $ne: answer },
              createdAt: { $gt: t0.toDate() }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              count: { $sum: 1 }
            }
          }
        ]);

        for (const datum of notCleanDispatch) {
          const day = datum._id;
          daysDict[day].notClean = datum.count;
        }
      }
      res.json({
        days,
        clean: days.map((d) => daysDict[d].clean),
        notClean: days.map((d) => daysDict[d].notClean)
      });
    } catch (e) {
      // Raven.captureException(e, { req });
      /* istanbul ignore next */
      logger.error(`dashboard timing: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      res.status(400).json({
        message: 'Ha ocurrido un error',
        status: 400
      });
    }
  }

  public async deliveriesOfTheday(req: IRequest, res: Response): Promise<any> {
    try {
      logger.info(`FormController.deliveriesOfTheday email: ${req.user.email}`);
      const team = req.user.team._id;
      const participas = await Participant.find(
        {
          team,
          deliveryToCustomer: true,
          createdAt: {
            $gte: moment().subtract(2, 'days').startOf('day').toDate()
          }
        },
        {
          _id: true,
          name: true,
          sections: true,
          number: true,
          createdAt: true
        }
      )
        .populate([
          {
            path: 'car',
            select: {
              _id: true,
              vin: true,
              patent: true,
              color: true,
              denomination: true,
              brand: true,
              type: true,
              internalNumber: true
            }
          },
          {
            path: 'user',
            select: {
              _id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          {
            path: 'venue',
            select: {
              _id: true,
              name: true
            }
          },
          {
            path: 'sections.answers.images'
          },
          {
            path: 'sections.answers.damagesSelected.images'
          }
        ])
        .lean();
      return res.json({
        data: participas,
        status: 200
      });
    } catch (e) {
      // Raven.captureException(e, { req });
      /* istanbul ignore next */
      logger.error(`deliveriesOfTheday: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      return res.status(400).json({
        message: 'Ha ocurrido un error',
        status: 400
      });
    }
  }

  public async allControls(req: IRequest, res: Response): Promise<any> {
    try {
      logger.info(`FormController.allControls email: ${req.user.email}`);
      logger.info(
        `FormController.allControls email: ${
          req.user.email
        } query: ${JSON.stringify(req.query)}`
      );
      // const { page, pageSize } = req.query as Record<string, string>;
      // // paginate options
      // let options: PaginateOptions = {
      //   page: parseInt(page ? page : '1', 10),
      //   limit: parseInt(pageSize ? pageSize : '20', 10),
      //   customLabels: this.aggregateCustomLabels,
      //   allowDiskUse: true,
      //   sort: { number: 1 },
      //   lean: true
      // };

      // let countAggregate: PipelineStage[] = [
      //   {
      //     $match: {
      //       $and: [
      //         {
      //           team: new mongoose.Types.ObjectId(req.user.team._id),
      //           active: true,
      //           createdAt: {
      //             $gte: moment().startOf('day').subtract(2, 'days').toDate()
      //           }
      //         }
      //       ]
      //     }
      //   }
      // ];

      // options['countQuery'] = Participant.aggregate(countAggregate);
      // // let aggregate: PipelineStage[] = [...countAggregate];
      // let project: any = {
      //   _id: true,
      //   name: true,
      //   sections: true,
      //   venue: true,
      //   receiveFrom: true,
      //   sendTo: true,
      //   number: true,
      //   createdAt: true
      // };

      // let aggregate: PipelineStage[] = [
      //   ...countAggregate,
      //   {
      //     $project: {
      //       ...project,
      //       car: true,
      //       form: true,
      //       user: true,
      //       carrierBy: true
      //     }
      //   }
      // ];

      // project = {
      //   ...project,
      //   'user._id': true,
      //   'user.firstName': true,
      //   'user.lastName': true,
      //   'user.email': true
      // };
      // aggregate = [
      //   ...aggregate,
      //   {
      //     $lookup: {
      //       from: 'users',
      //       localField: 'user',
      //       foreignField: '_id',
      //       as: 'user'
      //     }
      //   },
      //   {
      //     $unwind: {
      //       path: '$user',
      //       preserveNullAndEmptyArrays: true
      //     }
      //   },
      //   {
      //     $project: {
      //       ...project,
      //       car: true,
      //       form: true,
      //       carrierBy: true
      //     }
      //   }
      // ];

      // project = {
      //   ...project,
      //   'form._id': true,
      //   'form.name': true,
      //   'form.action': true
      // };
      // aggregate = [
      //   ...aggregate,
      //   {
      //     $lookup: {
      //       from: 'forms',
      //       localField: 'form',
      //       foreignField: '_id',
      //       as: 'form'
      //     }
      //   },
      //   {
      //     $unwind: {
      //       path: '$form',
      //       preserveNullAndEmptyArrays: true
      //     }
      //   },
      //   {
      //     $project: {
      //       ...project,
      //       carrierBy: true,
      //       car: true
      //     }
      //   }
      // ];

      // project = {
      //   ...project,
      //   'carrierBy._id': true,
      //   'carrierBy.name': true
      // };

      // aggregate = [
      //   ...aggregate,
      //   {
      //     $lookup: {
      //       from: 'carriers',
      //       localField: 'carrierBy',
      //       foreignField: '_id',
      //       as: 'carrierBy'
      //     }
      //   },
      //   {
      //     $unwind: {
      //       path: '$carrierBy',
      //       preserveNullAndEmptyArrays: true
      //     }
      //   },
      //   {
      //     $project: {
      //       ...project,
      //       car: true
      //     }
      //   }
      // ];

      // project = {
      //   ...project,
      //   'car._id': true,
      //   'car.vin': true,
      //   'car.patent': true,
      //   'car.color': true,
      //   'car.denomination': true,
      //   'car.brand': true,
      //   'car.type': true,
      //   'car.internalNumber': true
      // };

      // aggregate = [
      //   ...aggregate,
      //   {
      //     $lookup: {
      //       from: 'cars',
      //       localField: 'car',
      //       foreignField: '_id',
      //       as: 'car'
      //     }
      //   },
      //   {
      //     $unwind: {
      //       path: '$car',
      //       preserveNullAndEmptyArrays: true
      //     }
      //   },
      //   {
      //     $project: {
      //       ...project
      //     }
      //   }
      // ];

      // const participants = await Participant.aggregatePaginate(
      //   Participant.aggregate(aggregate),
      //   options
      // );

      const team = req.user.team._id;
      const { page, pageSize } = req.query as Record<string, string>;
      const filter = {
        $and: [
          {
            team,
            active: true,
            createdAt: {
              $gte: moment().startOf('day').subtract(3, 'days').toISOString()
            }
          }
        ]
      };

      const options: PaginateOptions = {
        sort: {
          number: 1
        },
        customLabels: {
          totalDocs: 'total',
          docs: 'docs',
          limit: 'perPage',
          page: 'currentPage',
          hasNextPage: 'hasNextPage',
          hasPrevPage: 'hasPrevPage',
          totalPages: 'pages',
          pagingCounter: 'si'
        },
        select: {
          _id: true,
          name: true,
          sections: true,
          venue: true,
          receiveFrom: true,
          sendTo: true,
          number: true,
          createdAt: true
        },
        populate: [
          {
            path: 'car',
            select: {
              _id: true,
              vin: true,
              patent: true,
              color: true,
              denomination: true,
              brand: true,
              type: true,
              internalNumber: true
            }
          },
          {
            path: 'form',
            select: {
              _id: true,
              name: true,
              action: true
            }
          },
          {
            path: 'user',
            select: {
              _id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          {
            path: 'carrierBy',
            select: {
              _id: true,
              name: true
            }
          },
          {
            path: 'sections.answers.images'
          },
          {
            path: 'sections.answers.damagesSelected.images'
          }
        ],
        lean: true,
        allowDiskUse: true,
        page: parseInt(page ? page : '1', 10),
        limit: parseInt(pageSize ? pageSize : '10', 10)
      };
      const participants: any = await this.getControls(filter, options);
      if (
        options.page &&
        participants.pages &&
        participants.pages < options.page
      ) {
        return res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        return res.json({
          count: participants.total,
          pages: participants.pages,
          hasPrevPage: participants.hasPrevPage,
          hasNextPage: participants.hasNextPage,
          data: await Participant.populate(participants.docs, [
            {
              path: 'sections.answers.images'
            },
            {
              path: 'sections.answers.damagesSelected.images'
            }
          ]),
          status: 200
        });
      }
    } catch (e) {
      // Raven.captureException(e, { req });
      /* istanbul ignore next */
      logger.error(`allControls: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      return res.status(400).json({
        message: 'Ha ocurrido un error',
        status: 400
      });
    }
  }

  public async allControlsByVIN(req: IRequest, res: Response): Promise<any> {
    try {
      logger.info(`FormController.allControlsByVIN email: ${req.user.email}`);
      logger.info(
        `FormController.allControlsByVIN email: ${
          req.user.email
        } params: ${JSON.stringify(req.params)} query: ${JSON.stringify(
          req.query
        )}`
      );
      const team = req.user.team._id;
      const { page, pageSize } = req.query as Record<string, string>;
      const car = await Car.findOne(
        {
          $and: [{ vin: req.params.vin, team }]
        },
        { _id: true }
      );
      if (!car) {
        return res.status(400).json({
          message: 'Car not found.',
          status: 400
        });
      }

      const filter = {
        $and: [
          {
            team,
            car: car._id,
            active: true
          }
        ]
      };
      const options: PaginateOptions = {
        sort: {
          number: 1
        },
        customLabels: {
          totalDocs: 'total',
          docs: 'docs',
          limit: 'perPage',
          page: 'currentPage',
          hasNextPage: 'hasNextPage',
          hasPrevPage: 'hasPrevPage',
          totalPages: 'pages',
          pagingCounter: 'si'
        },
        select: {
          _id: true,
          name: true,
          sections: true,
          venue: true,
          receiveFrom: true,
          sendTo: true,
          number: true,
          createdAt: true
        },
        populate: [
          {
            path: 'car',
            select: {
              _id: true,
              vin: true,
              patent: true,
              color: true,
              denomination: true,
              brand: true,
              type: true,
              internalNumber: true
            }
          },
          {
            path: 'form',
            select: {
              _id: true,
              name: true,
              action: true
            }
          },
          {
            path: 'user',
            select: {
              _id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          {
            path: 'carrierBy',
            select: {
              _id: true,
              name: true
            }
          },
          {
            path: 'sections.answers.images'
          },
          {
            path: 'sections.answers.damagesSelected.images'
          }
        ],
        allowDiskUse: true,
        lean: true,
        page: parseInt(page ? page : '1', 10),
        limit: parseInt(pageSize ? pageSize : '10', 10)
      };
      const participants = await this.getControls(filter, options);
      if (
        options.page &&
        participants.pages &&
        (participants.pages as number) < options.page
      ) {
        return res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        return res.json({
          count: participants.total,
          pages: participants.pages,
          hasPrevPage: participants.hasPrevPage,
          hasNextPage: participants.hasNextPage,
          data: participants.docs,
          status: 200
        });
      }
    } catch (e) {
      // Raven.captureException(e, { req });
      /* istanbul ignore next */
      logger.error(`allControlsByVIN: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      /* istanbul ignore next */
      logger.error(e);
      return res.status(400).json({
        message: 'Ha ocurrido un error',
        status: 400
      });
    }
  }

  private getControls(
    filter: any,
    options: PaginateOptions
  ): Promise<PaginateResult<IOperationTypeModel>> {
    return new Promise((resolve, reject) => {
      Participant.paginate!(filter, options, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }

  private autoRotate(path: string): Promise<any> {
    // doc http://aheckmann.github.io/gm/docs.html
    /**** REQUIRE: imagemagick and graphicsmagick *****
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

  private async getForms(filter: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const forms = await Form.find(filter, {
        _id: 1,
        name: 1
      }).lean();
      return resolve(forms);
    });
  }

  private async getForm(filter: any): Promise<
    LeanDocument<
      IFormModel & {
        _id: Types.ObjectId;
      }
    >
  > {
    const keyCache = `form-${filter._id}`;
    logger.debug(`keyCache ${keyCache}`);
    return new Promise(async (resolve, reject) => {
      redisClient.get(keyCache, async (error, result) => {
        if (result) {
          logger.debug(`FROM CACHE`);
          resolve(JSON.parse(result));
        } else {
          logger.debug(`NEW CACHE`);
          const form = await Form.findOne(filter, {
            company: false,
            updatedAt: false,
            createdAt: false,
            active: false,
            'sections.shortName': false,
            'sections.questions.shortName': false,
            __v: false
          })
            .populate([
              {
                path: 'sections.questions.damages',
                select: [
                  'name',
                  'positions',
                  'kinds',
                  'parts',
                  'partFallback',
                  'kindFallback',
                  'severityOptions'
                ],
                populate: [
                  {
                    path: 'positions',
                    select: ['name'],
                    options: {
                      sort: {
                        name: 1
                      }
                    }
                  },
                  {
                    path: 'kinds',
                    select: ['name'],
                    options: {
                      sort: {
                        name: 1
                      }
                    }
                  },
                  {
                    path: 'parts',
                    select: ['name'],
                    options: {
                      sort: {
                        name: 1
                      }
                    }
                  },
                  {
                    path: 'kindFallback',
                    select: ['name'],
                    options: {
                      sort: {
                        name: 1
                      }
                    }
                  },
                  {
                    path: 'partFallback',
                    select: ['name'],
                    options: {
                      sort: {
                        name: 1
                      }
                    }
                  }
                ]
              }
            ])
            .lean();
          if (form) {
            redisClient.setex(keyCache, 60, JSON.stringify(form));
            resolve(form);
          }
          reject('No se encontro formularío');
        }
      });
    });
  }

  private async processAccesoryItems(accesories: any[]) {
    const accesorySchema = Joi.object({
      item: Joi.string(),
      amount: Joi.number()
    });
    const newAccesories: any[] = [];
    accesories.map((accesory: any) => {
      try {
        const newAccesory: any = accesorySchema.validate(accesory);
        newAccesories.push({
          item: newAccesory.value.item,
          amount: newAccesory.value.amount
        });
      } catch (e) {
        newAccesories.push({
          item: accesory,
          amount: 1
        });
      }
    });
    return newAccesories;
  }

  private async getFormWithScale(filter: any): Promise<IFormModel> {
    return new Promise(async (resolve, reject) => {
      const form = await Form.findOne(filter).populate([
        {
          path: 'sections.questions.scale'
        },
        {
          path: 'sections.questions.damages',
          select: ['name', 'positions', 'kinds', 'parts'],
          populate: [
            {
              path: 'positions',
              select: ['name']
            },
            {
              path: 'kinds',
              select: ['name']
            },
            {
              path: 'parts',
              select: ['name']
            }
          ]
        }
      ]);
      if (form) {
        return resolve(form);
      }
      return reject('No se encontro formularío');
    });
  }

  private async getScales(filter: any): Promise<
    LeanDocument<
      IScaleModel & {
        _id: Types.ObjectId;
      }
    >[]
  > {
    const keyCache = `scales-${JSON.stringify(filter)}`;
    return new Promise(async (resolve, reject) => {
      redisClient.get(keyCache, async (error, result) => {
        if (result) {
          resolve(JSON.parse(result));
        } else {
          const scales = await ScaleModel.find(filter, {
            updatedAt: false,
            createdAt: false,
            active: false,
            company: false,
            minValue: false,
            maxValue: false,
            'choices.na': false,
            team: false,
            __v: false
          }).lean();
          redisClient.setex(keyCache, 30, JSON.stringify(scales));
          resolve(scales);
        }
      });
    });
  }

  public async createPosition(req: IRequest, res: Response): Promise<any> {
    try {
      logger.info(
        `FormController.createPosition: email: ${
          req.user.email
        } body: ${JSON.stringify(req.body)}`
      );
      const { company, venue } = req.user;
      const team = req.user.team._id;
      const { lat, lng, accuracy, provider } = req.body;
      const os = 'user-agent' in req.headers ? req.headers['user-agent'] : '';

      await new GPSPosition({
        lat,
        lng,
        user: req.user,
        company,
        team,
        venue,
        os,
        accuracy,
        provider
      }).save();

      res.json({
        status: 200
      });
    } catch (e) {
      // Raven.captureException(e, { req });
      /* istanbul ignore next */
      logger.error(`FormController.createPosition: Error`);
      /* istanbul ignore next */
      logger.error(
        `email: ${req.user.email} body: ${JSON.stringify(req.body)}`
      );
      /* istanbul ignore next */
      logger.error(e);
      res.status(400).json({
        message: 'Ha ocurrido un error',
        status: 400
      });
    }
  }
}

export default new FormController();
