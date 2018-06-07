import {Response} from 'express';
import redisClient from '../../services/redis.service';
import FormModel, {IFormModel} from '../models/form.model';
import ScaleModel, {IScaleModel} from '../models/scale.model';
import ParticipantModel from '../models/participant.model';
import UserModel from '../../app/models/user.model';
import {ObjectID} from 'bson';
import {IRequest} from "../../interfaces/global.interface";

class FormController {

  constructor() {
    this.list = this.list.bind(this);
    this.detail = this.detail.bind(this);
    this.complete = this.complete.bind(this);
    this.changePreferred = this.changePreferred.bind(this);
  }

  public async list(req: IRequest, res: Response) {
    const company = req.user.company;
    try {
      const forms = await this.getForms(company);
      res.json({
        data: forms,
        status: 200
      });
    } catch (e) {
      res.status(400).json({
        error: 'Ha ocurrido un error',
        status: 400
      });
    }
  }

  public async detail(req: IRequest, res: Response) {
    const {id} = req.params;
    const company = req.user.company;
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
      // get scales from db
      const scales = await this.getScales(scalesIds, company);
      res.json({
        data: {
          form,
          scales
        },
        status: 200
      });
    } catch (e) {
      res.status(400).json({
        error: 'No se encontro formularío  400',
        status: 400
      });
    }
  }

  public async complete(req: IRequest, res: Response) {
    const {id} = req.params;
    const {answers, vin} = req.body;
    const company = req.user.company;
    // validate answers in body
    if (!answers){
      return res.status(400).json({
        error: 'Debes enviar las respuestas',
        status: 400
      });
    }
    // validate vin in body
    if (!vin){
      return res.status(400).json({
        error: 'Debes enviar el vin',
        status: 400
      });
    }
    try {
      const form = await this.getFormWithScale(id, company);
      if (form) {
        // initialize participant
        const newParticipant = new ParticipantModel({
          name: form.name,
          company,
          form: form._id,
          vin: vin ? vin : '',
          description: form.description,
          user: req.user._id,
          active: form.active,
        });
        // var sum sections
        let sumSectionWeigths = 0;
        let sumSectionQualifications = 0;
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

            sumQualifications +=  (qualification * question.weight);
            sumWeigths += question.weight;
            // generate answer
            newAnswers.push({
              _id: question._id,
              question: question.question,
              shortName: question.shortName,
              scale: question.scale,
              risk: question.risk,
              observe: question.observe,
              answer: answer ? new ObjectID(answer.value) : null,
              qualification,
              weight: question.weight,
              order: question.order,
            })
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
            order: section.order,
          });
        }
        // calculate participant qualification
        const formQualification = sumSectionQualifications ? sumSectionQualifications / sumSectionWeigths : 0;
        newParticipant.qualification = formQualification;
        try {
          // save the participant
          await newParticipant.save();
          return res.json({
            data: {
              id,
              answers,
              vin,
              qualification: formQualification
            },
            status: 200
          });
        } catch (e) {
          // return error, if the form could not be recorded
          return res.status(400).json({
            error: e,
            status: 400
          });
        }
      }
      else {
        // return error, if the form could not find
        return res.status(400).json({
          error: 'No se ha encontrado el formularío',
          status: 400
        });
      }
    } catch (e) {
      return res.status(400).json({
        error: e,
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
        error: 'Ha ocurrido un error',
        status: 400
      });
    }
  }

  private getForms(company: ObjectID): Promise<IFormModel[]> {
    const keyCache = `forms`;
    return new Promise((resolve, reject) => {
      redisClient.get(keyCache, async (error, result) => {
        if(result){
          console.log(`cache: ${keyCache}`);
          resolve(JSON.parse(result));
        } else {
          FormModel
            .find({
              company
            }, {
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
        if(result){
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
      })
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
