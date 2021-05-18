import * as excel from 'exceljs';
import * as tempfile from 'tempfile';
import {ObjectID} from 'bson';
import {Response} from 'express';
import * as fs from 'fs';
import * as GraphicsMagick from 'gm';
import * as HtmlPdf from 'html-pdf';
import * as Joi from 'joi';
import * as moment from 'moment-timezone';
import * as path from 'path';
import * as QRCode from 'qrcode';
import * as Raven from 'raven';
import {queue} from '../../app';
import Alert from '../../app/models/alert.model';
import CarModel, {ICarModel} from '../../app/models/car.model';
import Team, {ITeamModel} from '../../app/models/team.model';
import User from '../../app/models/user.model';
import UserModel, {IUserModel} from '../../app/models/user.model';
import Venue, {IVenueModel} from '../../app/models/venue.model';
import GPSPosition from '../models/gpsPosition.model';
import {IAnyObject, IRequest} from '../../interfaces/global.interface';
import {io} from '../../server';
import logger from '../../services/logger.service';
import redisClient from '../../services/redis.service';
import GeneralUtils from '../../utils/general.utils';
import FormModel, {IFormModel, KindQuestion} from '../models/form.model';
import ParticipantModel from '../models/participant.model';
import ParticipantFile from '../models/participantFile.model';
import ScaleModel, {IScaleModel} from '../models/scale.model';
import * as bluebird from 'bluebird';
import {IParticipant} from '../../interfaces/participant.interface';
import {IVenueDay} from '../../interfaces/venueDay.interface';
import ActivityHistory, {ChoicesTypeActivity} from '../../billing/models/activityHistory.model';
import TriggerHandler from "../commands/triggerHandler";
// import {ValidationResult} from 'joi';


// import * as puppeteer from 'puppeteer';
const DERCO_TEAM = '5bf2de34caf8ef7096105cda';

class FormController {

  constructor() {
    this.list = this.list.bind(this);
    this.detail = this.detail.bind(this);
    this.pdf = this.pdf.bind(this);
    this.complete = this.complete.bind(this);
    this.changePreferred = this.changePreferred.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
    this.damagesDashboardPerDay = this.damagesDashboardPerDay.bind(this);
    this.participantWithDamages = this.participantWithDamages.bind(this);
    this.timingDashboard = this.timingDashboard.bind(this);
  }

  public async pdf(req: IRequest, res: Response): Promise<any> {
    const {debug, timezone} = req.query as { debug: string, timezone: string };
    const {id} = req.params;
    const team = req.user.team._id;
    try {
      const config: HtmlPdf.CreateOptions = {
        directory: '/tmp',
        format: 'Letter',
        orientation: 'portrait',
        border: {
          top: '0.3in',
          right: '0.5in',
          bottom: '0.3in',
          left: '0.5in'
        },
        /*
        header: {
          height: '2mm',
          contents: `<div class="header">
              Reporte generado por OSA Andes. Página <span>{{page}}</span>/<span>{{pages}}</span>
          </div>`
        },
        footer: {
          contents: {
            default: `<div class="footer">
                Reporte generado por OSA Andes. Página <span>{{page}}</span>/<span>{{pages}}</span>
            </div>`
          }
        },
        */
        type: 'pdf',
        quality: '75'
      };

      const venuesPermissions = req.user.venuesPermissions();
      const participant = await ParticipantModel
        .findOne({
          _id: id,
          team,
          $or: [{
            venue: {
              $in: venuesPermissions
            }
          }, {
            venue: {
              $exists: false
            }
          }, {
            venue: null
          }]
        }, {
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
        })
        .populate([{
          path: 'user',
          select: ['firstName', 'lastName', 'venue'],
          populate: [{
            path: 'venue',
            populate: [{
              path: 'company'
            }]
          }]
        }, {
          path: 'receiveFrom',
          select: 'name'
        }, {
          path: 'venue',
          select: 'name'
        }, {
          path: 'sendTo',
          select: 'name'
        }, {
          path: 'carrierBy',
          select: 'name'
        }, {
          path: 'car',
          select: ['vin', 'internalNumber', 'engineNumber', 'brand', 'denomination', 'color', 'patent']
        }, {
          path: 'sections.answers.images'
        }, {
          path: 'shippingImages'
        }, {
          path: 'receptionImages'
        }, {
          path: 'conciliationImages'
        }]).lean();
      moment.locale('es');
      moment.tz.setDefault(timezone ? timezone : 'America/Santiago');
      const css = fs.readFileSync(path.join(__dirname, '../../../views/') + 'form/carDetail/style.css', 'utf8');
      const templatePath: string = path.join(__dirname, '../../../views/') + 'form/carDetail/index.pug';
      const participantCompany = participant.user.venue && participant.user.venue.company || {};
      const html = GeneralUtils.generateHtmlFromPugFile(templatePath, {
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
        getAnswer: ((scale: any, answer: any) => {
          if (answer && answer.hasOwnProperty('answer') && answer.answer) {
            const choice = scale.choices.find((choice: any) => choice._id.toString() === answer.answer.toString());
            return choice ? choice.choice : '';
          }
          return '';
        }),
        requireAccesory: ((scale: any, answer: any) => {
          if (answer && answer.hasOwnProperty('answer') && answer.answer) {
            const choice = scale.choices.find((choice: any) => choice._id.toString() === answer.answer.toString());
            return choice ? choice.requireAccesories : false;
          }
          return false;
        }),
        getDamageItem: ((items: any, item: string) => {
          if (item) {
            const result = items.find((i: any) => i._id.toString() === item.toString());
            if (result && result.hasOwnProperty('name')) {
              return result.name;
            }
          }
          return '-';
        }),
        logo: participantCompany.image && participantCompany.image.hasOwnProperty('url') ? decodeURI(participantCompany.image.url) : false,
        accesorySelected: (answer: any, item: any) => {
          return item && answer.accesoriesAnswered ? answer.accesoriesAnswered.find((accesory: any) => {
            return accesory.item === item._id.toString();
          }) : false;
        }
      });
      if (debug) {
        res.send(html);
      } else {
        /*const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(`http://localhost:3030/report/forms/pdf/${id}.pdf?debug=true`);
        const buffer = await page.pdf({
          format: 'Letter',
          margin: {
            top: '0.3in',
            right: '0.5in',
            bottom: '0.3in',
            left: '0.5in'
          }
        });
        res.type('application/pdf');
        res.send(buffer);
        browser.close();
        */
        HtmlPdf.create(html, config).toStream((err, pdfStream) => {
          if (err) {
            console.log(err);
            res.sendStatus(500);
          } else {
            // set header
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-disposition', `inline; filename=${participant._id.toString()}.pdf`);
            // res.setHeader('Content-disposition', `attachment; filename=${participant._id.toString()}.pdf`);
            // send a status code of 200 OK
            res.statusCode = 200;
            // once we are done reading end the response
            pdfStream.on('end', () => {
              // done reading
              res.end();
            });
            // pipe the contents of the PDF directly to the response
            pdfStream.pipe(res);
          }
        });
      }
    } catch (e) {
      Raven.captureException(e, {req});
      res.status(500).json(e.message);
    }
  }

  public async list(req: IRequest, res: Response): Promise<any> {
    const team = req.user.team._id;
    logger.info(`list forms`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
    try {
      const updatedUser = await User.findById(req.user._id).populate([{
        path: 'userForms',
        select: ['_id']
      }]);
      if (updatedUser) {
        const forms = await this.getForms({
          _id: {
            $in: updatedUser.userForms.map((form) => form._id)
          },
          team
        });
        res.json({
          data: forms,
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
      Raven.captureException(e, {req});
      /* istanbul ignore next */
      logger.error(`Async Error.`);
      res.status(400).json({
        message: 'Ha ocurrido un error',
        status: 400
      });
    }
  }

  public async detail(req: IRequest, res: Response): Promise<any> {
    const {id} = req.params;
    const team = req.user.team._id;
    logger.info(`detail forms`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, {form: ${id}}}`);
    try {
      if (await User.find({_id: req.user._id, userForms: id}).count() < 1) {
        return res.status(403).json({
          message: 'No tienes permisos para esta operación'
        });
      }
      const user = (await UserModel.findById(req.user._id, {
        venue: true
      }).populate([{
        path: 'venue',
        populate: [{
          path: 'sendTo',
          select: ['name'],
          options: {
            sort: {
              name: 1
            }
          }
        }, {
          path: 'receiveFrom',
          select: ['name'],
          options: {
            sort: {
              name: 1
            }
          }
        }, {
          path: 'receptionCarriers',
          select: ['name'],
          options: {
            sort: {
              name: 1
            }
          }
        }, {
          path: 'shippingCarriers',
          select: ['name'],
          options: {
            sort: {
              name: 1
            }
          }
        }]
      }]) as IUserModel);
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
      res.json({
        data: {
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
        },
        status: 200
      });
    } catch (e) {
      Raven.captureException(e, {req});
      /* istanbul ignore next */
      logger.error(`detail form: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      /* istanbul ignore next */
      logger.error(e);
      /* istanbul ignore next */
      Raven.captureException(e, {req});
      /* istanbul ignore next */
      res.status(500).json({
        message: 'No se encontro formularío',
        status: 500
      });
    }
  }

  public async complete(req: IRequest, res: Response): Promise<any> {
    const {id} = req.params;
    let {vin} = req.body;
    const {answers} = req.body;
    const { company, venue, team } = req.user;
    logger.info(`complete`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}}`);
    // validate answers in body
    if (!answers) {
      return res.status(400).json({
        message: 'Debes enviar las respuestas',
        status: 400
      });
    }
    // validate vin in body
    if (!vin) {
      return res.status(400).json({
        message: 'Debes enviar el vin',
        status: 400
      });
    }
    vin = vin.replace(/[\W_]+/g, '');
    try {
      const updatedUser = await User.findById(req.user._id).populate([{path: 'venue'}]);
      if (!updatedUser) {
        return res.status(404).json({
          message: 'No se ha encontrado el formulario solicitado.',
          status: 404
        });
      }
      const car = await CarModel.findOne({
        $or: [{vin: {$eq: vin}}, {vin2: {$eq: vin}}],
        team
      });
      if (car) {
        const form = await this.getFormWithScale({
          _id: id,
          team
        });
        if (form) {
          // initialize participant
          const participantObject: any = {
            name: form.name,
            team,
            company,
            form: form._id,
            car,
            description: form.description,
            user: req.user._id,
            venue: updatedUser.venue,
            active: form.active
          };

          if (form.reception) {
            participantObject.reception = form.reception;
            participantObject.receptionText = form.receptionText;
            participantObject.receptionVenue = form.receptionVenue;
            participantObject.receptionVenueText = form.receptionVenueText;
            if ('reception' in answers) {
              const {reception} = answers;
              participantObject.receptionConfirmation = [true, 'true'].includes(reception.value);
              if (reception.images) {
                participantObject.receptionImages = reception.images.map((image: string) => (new ObjectID(image)));
              }
            }
            if ('receptionVenue' in answers) {
              const {receptionVenue} = answers;
              participantObject.receiveFrom = receptionVenue.value;
            }
          }

          if (form.shipping) {
            participantObject.shipping = form.shipping;
            participantObject.shippingText = form.shippingText;
            participantObject.shippingVenue = form.shippingVenue;
            participantObject.shippingVenueText = form.shippingVenueText;
            if ('shipping' in answers) {
              const {shipping} = answers;
              participantObject.shippingConfirmation = [true, 'true'].includes(shipping.value);
              if (shipping.images) {
                participantObject.shippingImages = shipping.images.map((image: string) => (new ObjectID(image)));
              }
            }
            if ('shippingVenue' in answers) {
              const {shippingVenue} = answers;
              participantObject.sendTo = shippingVenue.value;
            }
          }

          if (form.carrier) {
            participantObject.carrier = form.carrier;
            participantObject.carrierText = form.carrierText;
            if ('carrier' in answers) {
              const {carrier} = answers;
              participantObject.carrierBy = carrier.value;
            }
          }

          if (form.conciliation && 'conciliation' in answers) {
            const conciliation = answers.conciliation;
            participantObject.conciliation = [true, 'true'].includes(conciliation.value);
            participantObject.conciliationText = form.conciliationText;
            if (conciliation.images) {
              participantObject.conciliationImages = conciliation.images.map((image: string) => (new ObjectID(image)));
            }
          }
          const newParticipant = new ParticipantModel(participantObject);
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
              const answer = GeneralUtils.getObjectProperty(answers, questionID, null);
              // find choice selected
              const choice = question.scale ? question.scale.choices.find((choice) => {
                return answer ? choice._id.toString() === answer.value : false;
              }) : null;
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
                sumQualifications += (qualification * question.weight);
                sumWeigths += question.weight;
              }

              // concat allImages
              if (choice && choice.requireImage && answer && answer.images && answer.images.length) {
                allImages = [...answer.images, ...allImages];
              }

              // delete images no used
              if (choice && !choice.requireImage && answer && answer.images && answer.images.length) {
                answer.images.forEach(async (image: string) => {
                  const deleteFile = await ParticipantFile.findById(image);
                  if (deleteFile) {
                    await deleteFile.remove();
                  }
                });
              }

              // generate answer
              newAnswers.push({
                _id: question._id,
                question: question.question,
                shortName: question.shortName,
                scale: question.scale,
                conciliation: question.conciliation,
                accessories: question.accessories,
                damages: question.damages,
                damagesSelected: answer && answer.damages ? answer.damages : [],
                accesoriesAnswered: (question.kind === KindQuestion.accessory || choice && choice.requireAccesories) && answer && answer.accesories ?
                  await this.processAccesoryItems(answer.accesories) : [],
                risk: question.risk,
                comment: (question.kind === KindQuestion.text || choice && choice.requireComment) && answer && answer.comment ?
                  answer.comment
                  : '',
                observe: question.observe,
                answer: answer ? new ObjectID(answer.value) : null,
                images: answer && answer.images && answer.images.length ?
                  answer.images.map((image: string) => (new ObjectID(image)))
                  : [],
                qualification,
                na,
                weight: question.weight,
                kind: question.kind,
                order: question.order,
                hint: question.hint,
                optional: question.optional
              });
            }
            // calculate section qualification
            const sectionQualification = sumQualifications ? sumQualifications / sumWeigths : 0;
            sumSectionQualifications += (sectionQualification * section.weight);
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
          const formQualification = sumSectionQualifications ? sumSectionQualifications / sumSectionWeigths : 0;
          newParticipant.qualification = formQualification;
          try {
            const updateTeam = await Team.findOneAndUpdate({_id: team._id}, {$inc: {formsNumber: 1}}, {new: true});
            if (updateTeam) {
              newParticipant.number = updateTeam.formsNumber;
            }
            // save the participant
            await newParticipant.save();

            // associate file to participant
            if (allImages.length) {
              await ParticipantFile.update({_id: {$in: allImages}}, {participant: newParticipant}, {multi: true});
            }

            car.lastForm = newParticipant;
            await car.save();
            const today = moment().startOf('day');
            const tomorrow = moment(today).add(1, 'days');
            const count = await ParticipantModel.count({
              user: req.user,
              createdAt: {
                $gte: today.toDate(),
                $lt: tomorrow.toDate()
              }
            });

            if (form.triggers && form.triggers.length){
              let triggersHandler = new TriggerHandler(form, newParticipant);
              await triggersHandler.execute({})
            }

            /* Search alerts */
            const alerts = await Alert
              .find({
                team,
                $or: [
                  {$and: [{lte: {$gte: formQualification}}, {lte: {$gt: 0}}]},
                  {$and: [{gte: {$lte: formQualification}}, {gte: {$gt: 0}}]}
                ]
              }).populate([{
                path: 'users',
                select: ['firstName', 'lastName', 'email', 'venue', 'venuesAccess']
              }]);
            /* Send alerts if exist */
            if (alerts.length) {
              alerts.forEach((alert) => {
                alert.users.forEach((user: IUserModel) => {
                  const userName = `${user.firstName} ${user.lastName}`;
                  if (user.venuesPermissions(true).includes(venue._id) && user.email && user.email.length) {
                    queue.create('email', {
                      from: '',
                      title: `Alert qualification`,
                      to: `""<${user.email}>`,
                      subject: `ALERTA: ${alert.name}`,
                      text: `Hola ${userName}
                        Se ha evaluado un VIN con calificación ${formQualification.toFixed(0)}%

                        Datos del Vehiculo
                        VIN: ${car ? car.vin : ''}
                        MARCA: ${car && car.brand ? car.brand : ''}

                        Para ver el detalle has click aquí
                        ${process.env.SITE_URL}cars/${car._id}

                        © 2021 OSA SpA. Todos los derechos reservados.`,
                      view: 'alerts/lowQualification',
                      context: {
                        userName,
                        brand: car && car.brand ? car.brand : '',
                        vin: car && car.vin ? car.vin : '',
                        qualification: formQualification.toFixed(0),
                        url: `${process.env.SITE_URL}cars/${car._id}`
                      }
                    }).priority('high').attempts(5).save();
                  }
                });
              });
            }
            // send refresh with websocket to dashboard list
            io.to(`dashboard-vin-view-${team._id}`).emit('REFRESH', {
              update: true,
              car: newParticipant._id,
              notification:{
                title: 'Vehículo revisado',
                text: `${req.user.firstName} ${req.user.lastName} reviso ${car.brand} (${car.denomination}) en ${updatedUser.venue.name}.`
              }
            });

            // send refresh with websocket to dashboard detail
            io.to(`dashboard-vin-detail-${car._id}`).emit(`ADD_PARTICIPANT`, await ParticipantModel
              .findById(newParticipant._id, {number: 1, name: 1, user: 1, venue: 1, createdAt: 1, qualification: 1})
              .populate([{
                path: 'user',
                select: ['firstName', 'lastName']
              }, {
                path: 'venue',
                select: ['name']
              }])
            );

            await ActivityHistory.create({
              team,
              company,
              user: req.user._id,
              type: ChoicesTypeActivity.checklist,
              car: {
                _id: car._id,
                vin: car.vin
              }
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
      Raven.captureException(e, {req});
      /* istanbul ignore next */
      console.log(e);
      /* istanbul ignore next */
      return res.status(400).json({
        message: e,
        status: 400
      });
    }
  }

  public async uploadFile(req: IRequest, res: Response): Promise<any> {
    const {id} = req.params;
    const { company } = req.user;
    const file: any = GeneralUtils.getFileFromRequest(req.files, 'file');
    logger.info(`uploadFile`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, {form: ${id}, file: ${JSON.stringify(file)}}}`);
    if (file) {
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
            res.status(400).json(error);
          } else {
            await participantFile.save();
            res.status(201).json({
              data: {
                _id: participantFile._id,
                file: participantFile.file
              },
              status: 201
            });
          }
        });
      } catch (e) {
        Raven.captureException(e, {req});
        /* istanbul ignore next */
        logger.error(`async error:`);
        /* istanbul ignore next */
        logger.error(e);
        /* istanbul ignore next */
        res.status(400).json(e);
      }

    } else {
      logger.error(`uploadFile: La imagen es obligatoria.`);
      res.status(400).json({
        message: 'La imagen es obligatoria.',
        status: 400
      });
    }
  }

  public async changePreferred(req: IRequest, res: Response): Promise<any> {
    let {form} = req.body;
    const team = req.user.team._id;
    logger.info(`changePreferred`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}}`);
    try {
      const user = await UserModel.findOne({_id: req.user._id, team, active: true});
      // validate exist user
      if (user) {
        form = await FormModel.findOne({_id: form, team});
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
          logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
          res.status(400).json({
            message: 'Formulario no encontrado',
            status: 400
          });
        }
      } else {
        logger.error(`changePreferred: Usuario no encontrado`);
        logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
        res.status(400).json({
          message: 'Usuario no encontrado',
          status: 400
        });
      }
    } catch (e) {
      Raven.captureException(e, {req});
      /* istanbul ignore next */
      logger.error(`changePreferred: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
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
      const damaged = await ParticipantModel.aggregate([{
        $match: {
          team,
          'venue': {
            $in: req.user.venuesPermissions()
          },
          'sections.answers.kind': 'damage',
          'sections.answers.damagesSelected._id': {$exists: true}
        }
      }, {
        $group: {
          _id: {
            $dateToString: {format: '%Y-%m-%d', date: '$createdAt'}
          },
          count: {$sum: 1}
        }
      }]);

      const undamaged = await ParticipantModel.aggregate([{
        $match: {
          team,
          'venue': {
            $in: req.user.venuesPermissions()
          },
          'sections.answers.kind': 'damage',
          'sections.answers.damagesSelected._id': {$exists: false}
        }
      }, {
        $group: {
          _id: {
            $dateToString: {format: '%Y-%m-%d', date: '$createdAt'}
          },
          count: {$sum: 1}
        }
      }]);

      const allVenues: any[] = [];
      if (damaged) {
        damaged.forEach((item) => {
          if (item._id.venue && !allVenues.includes(item._id.venue.toString())) {
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
      venues.forEach((venue) => damagesData[venue] = {damaged: 0, undamaged: 0});

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
      Raven.captureException(e, {req});
      /* istanbul ignore next */
      logger.error(`dashboard damages: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
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

  public async damagesDashboardPerDay(req: IRequest, res: Response): Promise<any> {
    try {
      const days = 15;
      moment.locale('es');
      moment.tz.setDefault('America/Santiago');
      const participants = await ParticipantModel.find({
        venue: {
          $in: req.user.venuesPermissions()
        },
        createdAt: {
          $gte: moment().endOf('day').subtract(days, 'd').toDate()
        }
      }, {
        _id: true,
        venue: true,
        // user: true,
        createdAt: true,
        'sections.answers.damagesSelected': true
      }).populate([{
        path: 'venue',
        select: ['_id', 'name']
      } /*,{
        path: 'user',
        select: ['_id', 'email']
      }*/]).lean();
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
          ...await bluebird.all(promises.splice(0, 500))
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
        data[dayKey][venueId][participant.hasDamages ? 'damaged' : 'undamaged']++;
        // data[dayKey][venueId][userId][participant.hasDamages ? 'damaged' : 'undamaged']++;
      }
      res.json(data);
    } catch (e) {
      Raven.captureException(e, {req});
      /* istanbul ignore next */
      logger.error(`dashboard damages: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
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
      const userObject = await User.findOne({_id: req.user._id});

      // Derco
      if (userObject && userObject.team.toString() === '5bf2de34caf8ef7096105cda') {
        const total = 2;
        // el lead time supuesto es de 48 horas
        const threshold = 60 * 24 * 3;

        // despacho:  5b0487db835536612bab1b61
        // recepcion: 5b1ae5799ebea419025b3e41
        const reception = await FormModel.findOne({_id: '5b0487db835536612bab1b61'});
        const cars = await CarModel.find({
          team,
          lastForm: {$ne: null}
        });

        const carsDict: any = {};
        for (const car of cars){
          carsDict[car._id.toString()] = car;
        }

        let receptions: any[] = [];
        for (let i = 0; i < total; i++) {
          const aux = await ParticipantModel.find({
            team,
            form: reception!._id,
            createdAt: {
              $gt: moment().subtract((i + 1) * 30, 'days').toDate(),
              $lt: moment().subtract(i * 30, 'days').toDate()
            }
          }, ['car', 'createdAt'], {
            sort: {
              createdAt: -1
            }
          });
          receptions = receptions.concat(aux);
        }

        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Revisiones', {
          properties: {
            defaultRowHeight: 30
          }, pageSetup: {
            fitToPage: true, fitToHeight: 100, fitToWidth: 1
          }
        });

        worksheet.columns = [{
          header: 'VIN', key: 'vin', width: 30
        }, {
          header: 'Marca', key: 'brand', width: 30
        }, {
          header: 'Fecha carga', key: 'createdAt', width: 30
        }, {
          header: 'Mes carga', key: 'createdAtMonth', width: 30
        }, {
          header: 'Fecha revisión', key: 'checkedAt', width: 30
        }, {
          header: 'Mes revisión', key: 'checkedAtMonth', width: 30
        }, {
          header: 'Delta tiempo', key: 'leadtime', width: 20
        }, {
          header: 'On time', key: 'ontime', width: 20
        }
        ];

        for (const reception of receptions) {
          const carID = reception.car.toString();

          if (carID in carsDict) {
            const car = carsDict[carID];

            const t0 = moment(car.createdAt).subtract(4, 'hours');
            const t1 = moment(reception.createdAt).subtract(4, 'hours');

            const hour = parseInt(t0.format('HH'), 10);
            if (hour >= 20 || hour <= 2)
              continue;

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
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=revisiones-03-07-2019.xlsx');
        return res.sendFile(tempFilePath);

      }
    } catch (e) {
      Raven.captureException(e, {req});
      /* istanbul ignore next */
      logger.error(`dashboard timing derco: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      /* istanbul ignore next */
      logger.error(e);
      res.status(400).json({
        message: 'Ha ocurrido un error',
        status: 400
      });
    }
  }

  private static async getDercoDeliveryParticipants(team: ITeamModel, from: moment.Moment, to: moment.Moment): Promise<IParticipant[]> {

    const receptionForm = await FormModel.findOne({_id: '5b1ae5799ebea419025b3e41'});
    return ParticipantModel.aggregate([
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
      {$unwind: '$related_car'},
      {
        $match: {
          'related_car.team': team,
          'related_car.lastForm': {$ne: null},
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
      {$unwind: '$to'}
    ]);

  }

  private async getDeliveryParticipants(team: ITeamModel, from: moment.Moment, to: moment.Moment) : Promise<IParticipant[]>{
    const distributors = await Venue.find({team, type: 'distributor'});
    const receivers = await Venue.find({team, type: 'receiver'});

    const receptions = await ParticipantModel.aggregate([
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
          venue: {$in: receivers.map((v) => v._id)},
          receiveFrom: {$in: distributors.map((v) => v._id)},
          reception: true,
          createdAt: {
            $gte: from,
            $lte: to
          },
          'recived_participants.venue': {$in: distributors.map((v) => v._id)},
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
        $sort: {'recived_participants.createdAt': -1}
      },
      {
        $lookup: {
          from: 'venues',
          localField: 'venue',
          foreignField: '_id',
          as: 'venue'
        }
      },
      {$unwind: '$venue'},
      {
        $lookup: {
          from: 'venues',
          localField: 'recived_participants.venue',
          foreignField: '_id',
          as: 'recived_participants.venue'
        }
      },
      {$unwind: '$recived_participants.venue'},
      {
        $group: {
          _id: '$_id',
          car: {$first: '$car'},
          venue: {$first: '$venue'},
          createdAt: {$first: '$createdAt'},
          recived_participants: {$push: '$recived_participants'}
        }
      },
      {
        $project: {
          car: 1,
          venue: 1,
          createdAt: 1,
          'recived_participants': {'$arrayElemAt': ['$recived_participants', 0]}
        }
      }
    ]);

    return receptions.filter((reception, index) => {
      return index === receptions.findIndex(obj => {
        return obj.recived_participants._id.toString() === reception.recived_participants._id.toString();
      });
    });
  }

  private static isDercoUser(user: IUserModel) : boolean{
    return user && user.team.toString() === DERCO_TEAM;
  }

  private static parseReception(reception : IParticipant, distributorTable : any) : any {

    const recivedparticipant : IParticipant = (reception as any).recived_participants as IParticipant;
    const sendingVenue : IVenueModel = recivedparticipant.venue;

    const daysLimit = distributorTable[sendingVenue._id.toString()] &&
    distributorTable[sendingVenue._id.toString()][reception.venue._id.toString()] ?
      distributorTable[sendingVenue._id.toString()][reception.venue._id.toString()] :
      5;
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

  private static parseDercoReception(reception: IParticipant, distributorTable : any, dercoDistributionVenue: IVenueModel) : any {
    const car: ICarModel = (reception as any).related_car as ICarModel;
    // TODO: Get The real origin Venue
    const sendingVenue = dercoDistributionVenue;
    const venue = (reception as any).to as IVenueModel;

    const daysLimit = distributorTable[sendingVenue._id.toString()] &&
      distributorTable[sendingVenue._id.toString()][venue._id.toString()] ?
      distributorTable[sendingVenue._id.toString()][venue._id.toString()] :
      5;
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
      const {team} = req.user as {team: ITeamModel};
      const userObject = await User.findOne({_id: req.user._id});
      const distributors = await Venue.find({team, type: 'distributor'}, {}).populate({
        path: 'sendToDays.venue',
        select: ['_id']
      });

      const start: any = req.query.start;
      const to: any = req.query.end;

      let startDate: any = start && start !== '' ? moment(start, 'YYYY-MM-DD') :
        moment().subtract(3, 'months').startOf('month').startOf('day');

      const toDate: any = to && to !== '' ? moment(to, 'YYYY-MM-DD') :
        moment().endOf('month').endOf('day');



      const distributorTable : any = {};
      distributors.map((distributor: IVenueModel) => {
        const distributorId = distributor._id.toString();
        if (!(distributorId in distributors))
          distributorTable[distributorId] = {};

        distributor.sendToDays.map((venueDay : IVenueDay) => {
          const venueId = venueDay.venue._id.toString();
          distributorTable[distributorId][venueId] = venueDay.shippingMaxDays;
        });
      });

      const data : any = {};

      for (let i : moment.Moment = startDate; i <= toDate; i=i.add(1, 'month') ) {
        const month = i.format('MM-YYYY');
        data[month] = [];
      }

      startDate = start && start !== '' ? moment(start, 'YYYY-MM-DD') :
        moment().subtract(3, 'months').startOf('month').startOf('day');

      const isDercoUser : boolean = FormController.isDercoUser(userObject!);
      const receptions : IParticipant[] = isDercoUser ?
        await FormController.getDercoDeliveryParticipants(team, startDate.toDate(), toDate.toDate()) :
        await this.getDeliveryParticipants(team, startDate.toDate(), toDate.toDate());

      for (const reception of receptions) {
        const value : any  = isDercoUser ? FormController.parseDercoReception(reception, distributorTable, distributors[0]) :
          FormController.parseReception(reception, distributorTable);
        const month = value.date_send.format('MM-YYYY');
        data[month].push(value);
      }

      return res.json(data);

    } catch (e) {
      Raven.captureException(e, {req});
      /* istanbul ignore next */
      logger.error(`dashboard timing: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      /* istanbul ignore next */
      logger.error(e);
      res.status(400).json({
        message: 'Ha ocurrido un error',
        status: 400
      });
    }

  }

  public async apiRevisionsGapExport(req: IRequest, res: Response): Promise<any> {

    if (!req.user.hasPermission('exportRevisionsGap')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }

    try {
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Daños', {
        properties: {
          defaultRowHeight: 30
        }, pageSetup: {
          fitToPage: true, fitToHeight: 100, fitToWidth: 1
        }
      });
      worksheet.autoFilter = {from: 'A1', to: 'F1'};

      worksheet.columns = [{
        header: 'VIN', key: 'vin', width: 30
      }, {
        header: 'Marca', key: 'brand', width: 30
      }, {
        header: 'Total revisiones', key: 'participants', width: 30
      }, {
        header: 'Fecha despacho', key: 'p0CreatedAt', width: 30
      }, {
        header: 'Sucursal despacho', key: 'p0Venue', width: 30
      }, {
        header: 'Calificación despacho', key: 'p0Qualification', width: 30
      }, {
        header: 'Gas despacho', key: 'p0Gas', width: 30
      }, {
        header: 'Pintura despacho', key: 'p0Paint', width: 30
      }, {
        header: 'Lata despacho', key: 'p0SheetMetal', width: 30
      }, {
        header: 'Fecha recepción', key: 'p1CreatedAt', width: 30
      }, {
        header: 'Sucursal recepción', key: 'p1Venue', width: 30
      }, {
        header: 'Calificación recepción', key: 'p1Qualification', width: 30
      }, {
        header: 'Gas recepción', key: 'p1Gas', width: 30
      }, {
        header: 'Pintura recepción', key: 'p1Paint', width: 30
      }, {
        header: 'Lata recepción', key: 'p1SheetMetal', width: 30
      }];

      const team = req.user.team._id;

      const periods = 6;
      for(let i = 0; i < periods; i++) {

        const t0 = moment().subtract(i + 1, 'months');
        const t1 = moment().subtract(i, 'months');

        const cars = await CarModel.find({
          team,
          lastForm: {$exists: true},
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

            const participants = car.participants!.sort((p0: any, p1: any) => p0.createdAt >= p1.createdAt ? 1 : 0);

            let p0:any = null;
            let p1:any = null;

            // only one form
            if (participants.length < 2) {
              if (participants[0].form.toString() == f0)
                p0 = participants[0];

              else if (participants[0].form.toString() == f1)
                p1 = participants[0];

            }
            else {
              const length = participants.length;
              p0 = participants[0];
              p1 = participants[length-1];
            }

            let choice0Gas = null;
            let choice1Gas = null;
            if (p0) {
              const answer0Gas = p0.sections.map((s: any) => s.answers).reduce((x: any[], y: any[]) => [...x, ...y], []).find((a: any) => a._id.toString() == gasQuestion);
              if (answer0Gas)
                choice0Gas = answer0Gas.scale.choices.find((c: any) => c._id.toString() == answer0Gas.answer.toString());
            }

            if (p1) {
              const answer1Gas = p1.sections.map((s: any) => s.answers).reduce((x: any[], y: any[]) => [...x, ...y], []).find((a: any) => a._id.toString() == gasQuestion);
              if (answer1Gas)
                choice1Gas = answer1Gas.scale.choices.find((c: any) => c._id.toString() == answer1Gas.answer.toString());
            }

            let choice0Paint = null;
            let choice1Paint = null;
            if (p0) {
              const answer0Paint = p0.sections.map((s: any) => s.answers).reduce((x: any[], y: any[]) => [...x, ...y], []).find((a: any) => a._id.toString() == paintQuestion);
              if (answer0Paint)
                choice0Paint = answer0Paint.scale.choices.find((c: any) => c._id.toString() == answer0Paint.answer.toString());
            }

            if (p1) {
              const answer1Paint = p1.sections.map((s: any) => s.answers).reduce((x: any[], y: any[]) => [...x, ...y], []).find((a: any) => a._id.toString() == paintQuestion);
              if (answer1Paint)
                choice1Paint = answer1Paint.scale.choices.find((c: any) => c._id.toString() == answer1Paint.answer.toString());
            }

            // lata
            let choice0SheetMetal = null;
            let choice1SheetMetal = null;
            if (p0) {
              const answer0SheetMetal = p0.sections.map((s: any) => s.answers).reduce((x: any[], y: any[]) => [...x, ...y], []).find((a:any) => a._id.toString() == sheetMetalQuestion);
              if (answer0SheetMetal)
                choice0SheetMetal = answer0SheetMetal.scale.choices.find((c: any) => c._id.toString() == answer0SheetMetal.answer.toString());
            }

            if (p1) {
              const answer1SheetMetal = p1.sections.map((s: any) => s.answers).reduce((x: any[], y: any[]) => [...x, ...y], []).find((a:any) => a._id.toString() == sheetMetalQuestion);
              if (answer1SheetMetal)
                choice1SheetMetal = answer1SheetMetal.scale.choices.find((c: any) => c._id.toString() == answer1SheetMetal.answer.toString());
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
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=revisiones-${moment().format('YYYY-MM-DD')}.xlsx`);
        return res.sendFile(tempFilePath);

      }
    } catch (e) {
      Raven.captureException(e, { req });
      /* istanbul ignore next */
      logger.error(`dashboard revisiones: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
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

      const form = await FormModel.findById('5b0487db835536612bab1b61');
      const answer = new ObjectID('5b64b2e8de5557c85fa14fa0');

      const days: string[] = [];
      const daysDict: any = {};
      if (form) {

        const total = 30 * 6;
        const t0 = moment().subtract(total, 'days');
        for (let i = 0; i < total; i++) {
          const day = moment().subtract(total - i, 'days').format('YYYY-MM-DD');
          daysDict[day] = {
            'clean': 0,
            'notClean': 0
          };
          days.push(day);
        }


        const cleanDispatch = await ParticipantModel.aggregate([
          {
            $match: {
              team,
              form: form._id,
              'sections.answers.answer': answer,
              createdAt: {$gt: t0.toDate()}
            }
          },
          {
            $group: {
              _id: {
                $dateToString: {format: '%Y-%m-%d', date: '$createdAt'}
              },
              count: {$sum: 1}
            }
          }
        ]);

        for (const datum of cleanDispatch) {
          const day = datum._id;
          const sum = datum.count;
          console.log(datum);
          daysDict[day].clean = sum;
        }

        const notCleanDispatch = await ParticipantModel.aggregate([
          {
            $match: {
              team,
              form: form._id,
              'sections.answers.answer': {$ne: answer},
              createdAt: {$gt: t0.toDate()}
            }
          },
          {
            $group: {
              _id: {
                $dateToString: {format: '%Y-%m-%d', date: '$createdAt'}
              },
              count: {$sum: 1}
            }
          }
        ]);

        for (const datum of notCleanDispatch) {
          const day = datum._id;
          const sum = datum.count;
          console.log(day);
          daysDict[day].notClean = sum;
        }
      }
      res.json({
        days,
        clean: days.map((d) => daysDict[d].clean),
        notClean: days.map((d) => daysDict[d].notClean)
      });
    } catch (e) {
      Raven.captureException(e, {req});
      /* istanbul ignore next */
      logger.error(`dashboard timing: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      /* istanbul ignore next */
      logger.error(e);
      res.status(400).json({
        message: 'Ha ocurrido un error',
        status: 400
      });
    }

  }

  private autoRotate(path: string): Promise<any> {
    // doc http://aheckmann.github.io/gm/docs.html
    /**** REQUIRE: imagemagick and graphicsmagick *****
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

  private getForms(filter: any): Promise<IFormModel[]> {
    return new Promise((resolve, reject) => {
      FormModel
        .find(filter, {
          _id: 1,
          name: 1
        })
        .lean()
        .exec((err, forms: IFormModel[]) => {
          if (err) {
            /* istanbul ignore next */
            return reject(err);
          }
          return resolve(forms);
        });
    });
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

  private getFormWithScale(filter: any): Promise<IFormModel> {
    return new Promise((resolve, reject) => {
      FormModel
        .findOne(filter)
        .populate([{
          path: 'sections.questions.scale'
        }, {
          path: 'sections.questions.damages',
          select: ['name', 'positions', 'kinds', 'parts'],
          populate: [{
            path: 'positions',
            select: ['name']
          }, {
            path: 'kinds',
            select: ['name']
          }, {
            path: 'parts',
            select: ['name']
          }]
        }])
        .exec((err, form) => {
          if (err) {
            /* istanbul ignore next */
            return reject(err);
          }
          if (form) {
            return resolve(form);
          }
          return reject('No se encontro formularío');
        });
    });
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

  public async createPosition(req: IRequest, res: Response): Promise<any> {

    try {
      const { company, venue } = req.user;
      const team = req.user.team._id;
      const {lat, lng, accuracy, provider} = req.body;

      const os = 'user-agent' in req.headers ? req.headers['user-agent'] : '';

      const gpsPosition = new GPSPosition({
        lat,
        lng,
        user: req.user,
        company,
        team,
        venue,
        os,
        accuracy,
        provider
      });

      await gpsPosition.save();

      res.json({
        status: 200
      });


    } catch (e) {
      Raven.captureException(e, {req});
      /* istanbul ignore next */
      logger.error(`position create. Error`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
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
