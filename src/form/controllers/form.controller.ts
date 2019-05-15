import {ObjectID} from 'bson';
import {Response} from 'express';
import * as fs from 'fs';
import * as GraphicsMagick from 'gm';
import * as HtmlPdf from 'html-pdf';
import * as moment from 'moment-timezone';
import * as path from 'path';
import * as QRCode from 'qrcode';
import * as Raven from 'raven';
import {queue} from '../../app';
import Alert from '../../app/models/alert.model';
import CarModel from '../../app/models/car.model';
import UserModel, {IUserModel} from '../../app/models/user.model';
import User from '../../app/models/user.model';
import Venue, {IVenueModel} from '../../app/models/venue.model';
import {IAnyObject, IRequest} from '../../interfaces/global.interface';
import {io} from '../../server';
import logger from '../../services/logger.service';
import redisClient from '../../services/redis.service';
import GeneralUtils from '../../utils/general.utils';
import FormModel, {IFormModel, KindQuestion} from '../models/form.model';
import ParticipantModel from '../models/participant.model';
import ParticipantFile from '../models/participantFile.model';
import ScaleModel, {IScaleModel} from '../models/scale.model';

// import * as puppeteer from 'puppeteer';

class FormController {

  constructor() {
    this.list = this.list.bind(this);
    this.detail = this.detail.bind(this);
    this.pdf = this.pdf.bind(this);
    this.complete = this.complete.bind(this);
    this.changePreferred = this.changePreferred.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
  }

  public async pdf(req: IRequest, res: Response): Promise<any> {
    const {debug} = req.query;
    const {id} = req.params;
    const {team} = req.user;
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
          select: ['vin', 'internalNumber', 'brand', 'denomination', 'color']
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
        getDamageItem: ((items: any, item: string) => {
          const result = items.find((i: any) => i._id.toString() === item.toString());
          if (result && result.hasOwnProperty('name')) {
            return result.name;
          }
          return '';
        }),
        logo: participantCompany.image && participantCompany.image.hasOwnProperty('url') ? decodeURI(participantCompany.image.url) : false,
        accesorySelected: (answer: any, item: any) => {
          return item ? answer.accesoriesSelected.map((a: any) => a.toString()).includes(item._id.toString()) : false;
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
      res.status(500).json(e.message);
    }
  }

  public async list(req: IRequest, res: Response): Promise<any> {
    const {team} = req.user;
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
    const {team} = req.user;
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
        order: 0
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
    const {team, venue, company} = req.user;
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
      const updatedUser = await User.findById(req.user._id);
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
                accesoriesSelected: (question.kind === KindQuestion.accessory || choice && choice.requireAccesories) && answer && answer.accesories ?
                  answer.accesories.map((accesory: any) => new ObjectID(accesory))
                  : [],
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
                order: question.order
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

                        © 2019 OSA SpA. Todos los derechos reservados.`,
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
            io.to(`dashboard-vin-view-${company._id}`).emit('REFRESH', {
              update: true,
              car: car._id
            });

            // send refresh with websocket to dashboard detail
            io.to(`dashboard-vin-detail-${car._id}`).emit(`ADD_PARTICIPANT`, await ParticipantModel
              .findById(newParticipant._id, {name: 1, user: 1, venue: 1, createdAt: 1, qualification: 1})
              .populate([{
                path: 'user',
                select: ['firstName', 'lastName']
              }, {
                path: 'venue',
                select: ['name']
              }])
            );

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
    const company = req.user.company;
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
    const {team} = req.user;
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
      const {team} = req.user;
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
            venue: '$venue'
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
            venue: '$venue'
          },
          count: {$sum: 1}
        }
      }]);

      const allVenues: any[] = [];
      damaged.forEach((item) => {
        if (!allVenues.includes(item._id.venue.toString())) {
          allVenues.push(item._id.venue.toString());
        }
      });
      undamaged.forEach((item) => {
        if (!allVenues.includes(item._id.venue.toString())) {
          allVenues.push(item._id.venue.toString());
        }
      });

      const venuesPermissions = req.user.venuesPermissions(true);
      var venues: string[] = []
      venuesPermissions.forEach((v) => {
        if(allVenues.includes(v) && !venues.includes(v))
          venues.push(v);
      });

      const damagesData: any = {};
      venues.forEach((venue) => damagesData[venue] = {damaged: 0, undamaged: 0});

      damaged.forEach((item) => {
        damagesData[item._id.venue].damaged = item.count;
      });
      undamaged.forEach((item) => {
        damagesData[item._id.venue].undamaged = item.count;
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

  public async timingDashboard(req: IRequest, res: Response): Promise<any> {

    try {
      const {team} = req.user;
      const distributor = await Venue.findOne({team, type: "distributor"})
      const receivers = await Venue.find({team, type: 'receiver'});

      // autos que han llegado al distribuidor
      const threshold = 60 * 24 * 5;
      const participants = await ParticipantModel.find({venue: distributor});

      const total = 6;
      const months: string[] = [];
      const receivedPerMonth: any = {};
      for (let i = 0; i <= total; i++) {
        const month = moment().subtract(total - i, 'months').startOf('month').format('YYYY-MM');
        months.push(month);
        receivedPerMonth[month] = {
          overdue: 0,
          ontime: 0
        };
      }

      const receiverVenues: any[] = [];
      const receptions = await ParticipantModel.find({
        team,
        venue: { $in: receivers.map((v) => v._id )},
        receiveFrom: (distributor as IVenueModel)._id
      }, ['car', 'venue', 'createdAt'], {
        sort: {
          createdAt: 1
        }
      });

      const firstReceptions: any = {};
      for (const reception of receptions) {
        const car = reception.car.toString();
        if (car in firstReceptions) {
        } else {
          firstReceptions[car] = reception;
        }
      }

      for (const participant of participants) {

        const received = firstReceptions[participant.car.toString()];

        if (received) {
          if (!receiverVenues.includes(received.venue.toString())) {
            receiverVenues.push(received.venue);
          }

          const t0 = moment(participant.createdAt);
          const month = t0.format('YYYY-MM');
          const t1 = moment(received.createdAt);
          const dm = t1.diff(t0, 'minutes');
          if (dm < threshold) {
            receivedPerMonth[month].ontime += 1;
          } else {
            receivedPerMonth[month].overdue += 1;
          }
        }
      }

      const data: any = {months, overdue: [], ontime: []};

      data.overdue = Array(months.length).fill(0);
      data.ontime = Array(months.length).fill(0);

      // tslint:disable-next-line:forin
      for (const index in months) {
        const month = months[index];
        data.overdue[index] = receivedPerMonth[month].overdue;
        data.ontime[index] = receivedPerMonth[month].ontime;
      }

      res.json(data);

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

  public async timingDashboardPerVenue(req: IRequest, res: Response): Promise<any> {

    try {
      const {team} = req.user;
      const {period} = req.query

      //TODO: how to setup this?
      const distributor = await Venue.findOne({team, type: "distributor"})
      if (distributor) {
        const receivers = await Venue.find({team, type: 'receiver'});

        const receiversDict: any = {}
        receivers.forEach((r) => receiversDict[r._id.toString()] = r)

        // autos que han llegado al distribuidor
        const t0 = moment(period).startOf('month')
        const t1 = moment(period).endOf('month')

        const threshold = 60 * 24 * 5;
        const participants = await ParticipantModel.find({
          venue: distributor._id,
          createdAt: {$gt: t0.toDate(), $lt: t1.toDate()},
        });

        const receptions = await ParticipantModel.find({
          team,
          venue: {$in: receivers.map((v) => v._id)},
          receiveFrom: distributor._id,
          createdAt: {$gt: t0.toDate()},
        }, ['car', 'venue', 'createdAt'], {
          sort: {
            createdAt: 1
          }
        });

        const firstReceptions: any = {};
        for (const reception of receptions) {
          const car = reception.car.toString();
          if (car in firstReceptions) {
          } else {
            firstReceptions[car] = reception;
          }
        }

        const receivedPerVenue: any = {}
        const venues: string[] = [];
        for (const participant of participants) {

          const received = firstReceptions[participant.car.toString()];

          if (received) {
            if (received.createdAt < participant.createdAt) {
              continue;
            }
            const venue = received.venue.toString()
            if (!venues.includes(venue)) {
              venues.push(venue);
              receivedPerVenue[venue] = 0;
            }

            const t0 = moment(participant.createdAt);
            const t1 = moment(received.createdAt);
            const dm = t1.diff(t0, 'minutes');

            receivedPerVenue[venue] += 1
            if (dm < threshold) {
              //receivedPerMonth[month].ontime += 1;
            } else {
              //receivedPerMonth[month].overdue += 1;
            }
          }
        }

        const perVenue: number[] = venues.map((v) => receivedPerVenue[v]);
        const data: any = {venues, perVenue}

        res.json(data);
      }

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

  private autoRotate(path: string) {
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
            resolve();
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
    return new Promise((resolve, reject) => {
      redisClient.get(keyCache, async (error, result) => {
        if (result) {
          resolve(JSON.parse(result));
        } else {
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
              select: ['name', 'positions', 'kinds', 'parts'],
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
              }]
            }])
            .lean()
            .exec((err, form: IFormModel) => {
              if (err) {
                /* istanbul ignore next */
                return reject(err);
              }
              if (form) {
                redisClient.setex(keyCache, 60, JSON.stringify(form));
                return resolve(form);
              }
              return reject('No se encontro formularío');
            });
        }
      });
    });
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
              redisClient.setex(keyCache, 30, JSON.stringify(scales));
              return resolve(scales);
            });
        }
      });
    });
  }

}

export default new FormController();
