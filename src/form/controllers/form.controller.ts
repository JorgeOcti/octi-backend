import {ObjectID} from 'bson';
import {Response} from 'express';
import * as GraphicsMagick from 'gm';
import * as moment from 'moment-timezone';
import {queue} from '../../app';
import Alert from '../../app/models/alert.model';
import CarModel from '../../app/models/car.model';
import UserModel from '../../app/models/user.model';
import {IAnyObject, IRequest} from '../../interfaces/global.interface';
import {io} from '../../server';
import redisClient from '../../services/redis.service';
import FormModel, {IFormModel} from '../models/form.model';
import ParticipantModel from '../models/participant.model';
import ParticipantFile from '../models/participantFile.model';
import ScaleModel, {IScaleModel} from '../models/scale.model';
// import * as cp from 'console-probe';

class FormController {

  constructor() {
    this.list = this.list.bind(this);
    this.detail = this.detail.bind(this);
    this.complete = this.complete.bind(this);
    this.changePreferred = this.changePreferred.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
  }

  public async list(req: IRequest, res: Response) {
    const company = req.user.company;
    try {
      const forms = await this.getForms(company, {
        _id: {
          $in: req.user.userForms.map((form) => form._id)
        }
      });
      res.json({
        data: forms,
        status: 200
      });
    } catch (e) {
      res.status(400).json({
        message: 'Ha ocurrido un error',
        status: 400
      });
    }
  }

  public async detail(req: IRequest, res: Response): Promise<any> {
    const {id} = req.params;
    const company = req.user.company;
    if (req.user.userForms.filter((form) => form._id.toString() === id).length === 0) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    try {
      const form = await this.getForm(id, company);
      // generate array of scale ids
      const scalesIds: any[] = [];
      form.sections.forEach((section) => {
        section.questions.forEach((question) => {
          const scaleID = question.scale.toString();
          if (!scalesIds.includes(scaleID)) {
            scalesIds.push(scaleID);
          }
        });
      });

      const extra: IAnyObject = {
        accessories: []
      };
      const extraSection: any = {
        _id: '',
        name: '',
        questions: [],
        order: form.sections.length + 1
      };
      const extraScales: any = [];
      if (form.shipping) {
        extraSection.questions.push({
          _id: 'shipping',
          question: form.shippingText,
          scale: 'shipping',
          conciliation: false
        });
        extraScales.push({
          _id: 'shipping',
          name: 'shipping',
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
              requireImage: form.shippingImage,
              requireComment: false,
              requireAccesories: false,
              requireConciliation: false,
              value: 1,
              order: 2
            }
          ],
          order: extraScales.length + 1
        });
      }
      if (form.reception) {
        extraSection.questions.push({
          _id: 'reception',
          question: form.receptionText,
          scale: 'reception',
          conciliation: false
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
          ],
          order: extraScales.length + 1
        });
      }
      if (form.conciliation) {
        extraSection.questions.push({
          _id: 'conciliation',
          question: form.conciliationText,
          scale: 'conciliation',
          conciliation: true
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
          ],
          order: extraScales.length + 1
        });
      }

      // delete keys from object returned by api
      const deleteKeys: string[] = ['shipping', 'shippingText', 'shippingImage', 'reception', 'receptionText', 'receptionImage', 'conciliation', 'conciliationText', 'conciliationImage'];
      deleteKeys.forEach((key: string) => {
        if (form.hasOwnProperty(key)) {
          delete (form as any)[key];
        }
      });
      let scales = await this.getScales(scalesIds, company);

      scales = [...scales, ...extraScales];
      if (extraSection.questions.length) {
        (form as any).sections = [...form.sections, extraSection];
      }

      // get scales from db
      res.json({
        data: {
          form,
          scales,
          extra
        },
        status: 200
      });
    } catch (e) {
      console.log('e', e);
      res.status(400).json({
        message: 'No se encontro formularío',
        status: 400
      });
    }
  }

  public async complete(req: IRequest, res: Response) {
    const {id} = req.params;
    let {vin} = req.body;
    const {answers} = req.body;
    const {company, venue} = req.user;

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
      const car = await CarModel.findOne({
        $or: [{vin: {$eq: vin}}, {vin2: {$eq: vin}}],
        company
      });
      if (car) {
        const form = await this.getFormWithScale(id, company);
        if (form) {
          // initialize participant
          const participantObject: any = {
            name: form.name,
            company,
            form: form._id,
            car,
            description: form.description,
            user: req.user._id,
            venue,
            active: form.active
          };
          if (form.reception && 'reception' in answers) {
            const reception = answers.reception;
            participantObject.reception = [true, 'true'].includes(reception.value);
            participantObject.receptionText = form.receptionText;
            if (reception.images) {
              participantObject.receptionImages = reception.images.map((image: string) => (new ObjectID(image)));
            }
          }
          if (form.shipping && 'shipping' in answers) {
            const shipping = answers.shipping;
            participantObject.shipping = [true, 'true'].includes(shipping.value);
            participantObject.shippingText = form.shippingText;
            if (shipping.images) {
              participantObject.shippingImages = shipping.images.map((image: string) => (new ObjectID(image)));
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
          // array images ids
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
              const answer = answers.hasOwnProperty(questionID) ? answers[questionID] : null;
              // find choice selected
              const choice = question.scale.choices.find((choice) => {
                return answer ? choice._id.toString() === answer.value : false;
              });
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
                accesoriesSelected: choice && choice.requireAccesories && answer && answer.accesories ? answer.accesories.map((accesory: any) => new ObjectID(accesory)) : [],
                risk: question.risk,
                observe: question.observe,
                answer: answer ? new ObjectID(answer.value) : null,
                // images: answer.images && answer.images.length ? await ParticipantFile.find({_id: {$in: answer.images}}, {_id:1}) : [],
                images: answer && answer.images && answer.images.length ? answer.images.map((image: string) => (new ObjectID(image))) : [],
                qualification,
                na,
                weight: question.weight,
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
                company,
                $or: [
                  {$and: [{lte: {$gte: formQualification}}, {lte: {$gt: 0}}]},
                  {$and: [{gte: {$lte: formQualification}}, {gte: {$gt: 0}}]}
                ]
              }).populate([{
                path: 'users',
                select: ['firstName', 'lastName', 'email', 'venue']
              }]);
            /* Send alerts if exist */
            if (alerts.length) {
              alerts.forEach((alert) => {
                alert.users.forEach((user) => {
                  const userName = `${user.firstName} ${user.lastName}`;
                  // console.log('venue._id.toString()', venue._id.toString());
                  // console.log('user.venue.toString()', user.venue.toString());
                  if (venue._id.toString() === user.venue.toString() && user.email && user.email.length) {
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

                        © 2018 OSA SpA. Todos los derechos reservados.`,
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
              .findById(newParticipant._id, {name: 1, user: 1, createdAt: 1, qualification: 1})
              .populate({
                path: 'user',
                select: ['firstName', 'lastName']
              })
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
            console.log(e);
            // return error, if the form could not be recorded
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
      return res.status(400).json({
        message: e,
        status: 400
      });
    }
  }

  public async uploadFile(req: IRequest, res: Response): Promise<any> {
    const {id} = req.params;
    const company = req.user.company;
    if (req.file) {
      const file: any = req.file;
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
        res.status(400).json(e);
      }

    } else {
      res.status(400).json({
        message: 'La imagen es obligatoria.',
        status: 400
      });
    }
  }

  public async changePreferred(req: IRequest, res: Response) {
    let {form} = req.body;
    const company = req.user.company;
    try {
      const user = await UserModel.findOne({_id: req.user._id, company,  active: true});
      // validate exist user
      if (user) {
        form = await FormModel.findOne({_id: form, company});
        // validate exist form
        if (form) {
          user.preferred = form;
          await user.save();
          res.status(200).json({
            message: 'Se ha actualizado',
            status: 200
          });
        } else {
          res.status(400).json({
            message: 'Formualrio no encontrado',
            status: 400
          });
        }
      } else {
        res.status(400).json({
          message: 'Usuario no encontrado',
          status: 400
        });
      }
    } catch (e) {
      res.status(400).json({
        message: 'Ha ocurrido un error',
        status: 400
      });
    }
  }

  private autoRotate(path: string) {
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
            reject(err);
          } else {
            resolve();
          }
        });
    });
  }

  private getForms(company: ObjectID, filter?: any): Promise<IFormModel[]> {
    const keyCache = `forms${filter ? JSON.stringify(filter) : ''}`;
    if (filter) {
      filter = {
        company,
        ...filter
      };
    } else {
      filter = {
        company
      };
    }
    return new Promise((resolve, reject) => {
      redisClient.get(keyCache, async (error, result) => {
        if (result) {
          console.log(`cache: ${keyCache}`);
          resolve(JSON.parse(result));
        } else {
          FormModel
            .find(filter, {
              _id: 1,
              name: 1
            })
            .lean()
            .exec((err, forms: IFormModel[]) => {
              if (err) {
                return reject(err);
              }
              redisClient.setex(keyCache, 60 * 2, JSON.stringify(forms));
              return resolve(forms);
            });
        }
      });
    });
  }

  private getForm(id: string, company: ObjectID): Promise<IFormModel> {
    const keyCache = `form-${id}`;
    return new Promise((resolve, reject) => {
      redisClient.get(keyCache, async (error, result) => {
        if (result) {
          console.log(`cache: ${keyCache}`);
          resolve(JSON.parse(result));
        } else {
          FormModel
            .findOne({_id: id, company}, {
              'company': false,
              'updatedAt': false,
              'createdAt': false,
              'active': false,
              'sections.shortName': false,
              'sections.questions.shortName': false,
              '__v': false
            })
            .lean()
            .exec((err, form: IFormModel) => {
              if (err) {
                return reject(err);
              }
              if (form) {
                redisClient.setex(keyCache, 60 * 2, JSON.stringify(form));
                return resolve(form);
              }
              return reject('No se encontro formularío');
            });
        }
      });
    });
  }

  private getFormWithScale(id: string, company: ObjectID): Promise<IFormModel> {
    return new Promise((resolve, reject) => {
      FormModel
        .findOne({_id: id, company})
        .populate('sections.questions.scale')
        .exec((err, form) => {
          if (err) {
            return reject(err);
          }
          if (form) {
            return resolve(form);
          }
          return reject('No se encontro formularío');
        });
    });
  }

  private getScales(ids: any[], company: ObjectID): Promise<IScaleModel[]> {
    const keyCache = `scales-${ids.toString()}`;
    return new Promise((resolve, reject) => {
      redisClient.get(keyCache, async (error, result) => {
        if (result) {
          resolve(JSON.parse(result));
        } else {
          ScaleModel
            .find({
              _id: {$in: ids},
              company
            }, {
              'updatedAt': false,
              'createdAt': false,
              'active': false,
              'company': false,
              'minValue': false,
              'maxValue': false,
              'choices.na': false,
              '__v': false
            })
            .lean()
            .exec((err, scales: IScaleModel[]) => {
              if (err) {
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
