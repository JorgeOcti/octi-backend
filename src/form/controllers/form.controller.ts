import {Request, Response} from 'express';
import redisClient from '../../services/redis';
import FormModel, {IFormModel} from '../models/form.model';
import ScaleModel, {IScaleModel} from '../models/scale.model';
import ParticipantModel from '../models/participant.model';
import {ObjectID} from "bson";

class FormController {

  constructor() {
    this.list = this.list.bind(this);
    this.detail = this.detail.bind(this);
    this.complete = this.complete.bind(this);
  }

  public async list(req: Request, res: Response) {
    try {
      const forms = await this.getForms();
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

  public async complete(req: Request, res: Response) {
    const {id} = req.params;
    const {answers, vim} = req.body;
    console.log('answers', answers);
    if (!answers){
      return res.status(400).json({
        error: 'Debes enviar las respuestas',
        status: 400
      });
    }
    if (!vim){
      return res.status(400).json({
        error: 'Debes enviar el vim',
        status: 400
      });
    }
    try {
      const form = await this.getFormWithScale(id);
      if (form) {
        const newParticipant = new ParticipantModel({
          name: form.name,
          form: form._id,
          vim: vim ? vim : '',
          description: form.description,
          user: req.user? new ObjectID(req.user._id) : new ObjectID('5b058195983880f860332f8e'),
          active: form.active,
        });
        console.log(newParticipant);
        for (const section of form.sections) {
          // console.log('\n\nsection', JSON.stringify(section));
          const newAnswers: any[] = [];
          for (const question of section.questions) {
            // console.log('\n\nquestion', JSON.stringify(question));
            // const newScale: any = {
            //
            // }
            newAnswers.push({
              _id: question._id,
              question: question.question,
              shortName: question.shortName,
              scale: question.scale,
              risk: question.risk,
              observe: question.observe,
              qualification: 0,
              weight: question.weight,
              order: question.order,
            })
          }
          newParticipant.sections.push({
            _id: section._id,
            name: section.name,
            shortName: section.shortName,
            answers: newAnswers,
            qualification: 0,
            weight: section.weight,
            order: section.order,
          })
        }
        // console.log(JSON.stringify(newParticipant));
        try{
          await newParticipant.save();
          return res.json({
            data: {
              id,
              answers,
              vim
            },
            status: 200
          });
        } catch (e) {
          return res.status(400).json({
            error: e,
            status: 400
          });
        }
      }
      else {
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

  public async detail(req: Request, res: Response) {
    const {id} = req.params;
    try {
      const form = await this.getForm(id);
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
      const scales = await this.getScales(scalesIds);
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

  private getScales(ids: any[]): Promise<IScaleModel[]> {
    const keyCache = `scales-${ids.toString()}`;
    return new Promise((resolve, reject) => {
      redisClient.get(keyCache, async (error, result) => {
        if (result) {
          resolve(JSON.parse(result));
        } else {
          ScaleModel
            .find({
              _id: {$in: ids}
            }, {
              'updatedAt': false,
              'createdAt': false,
              'active': false,
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

  private getFormWithScale(id: string): Promise<IFormModel> {
    return new Promise((resolve, reject) => {
      FormModel
        .findById(id)
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

  private getForm(id: string): Promise<IFormModel> {
    const keyCache = `form-${id}`;
    return new Promise((resolve, reject) => {
      redisClient.get(keyCache, async (error, result) => {
        if(result){
          resolve(JSON.parse(result));
        } else {
          FormModel
            .findById(id, {
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
                redisClient.setex(keyCache, 30, JSON.stringify(form));
                return resolve(form);
              }
              return reject('No se encontro formularío');
            });
        }
      })
    });
  }

  private getForms(): Promise<IFormModel[]> {
    const keyCache = `forms`;
    return new Promise((resolve, reject) => {
      redisClient.get(keyCache, async (error, result) => {
        if(result){
          resolve(JSON.parse(result));
        } else {
          FormModel
            .find({}, {
              _id: 1,
              name: 1
            })
            .lean()
            .exec((err, forms: IFormModel[]) => {
              if (err) {
                return reject(err);
              }
              redisClient.setex(keyCache, 30, JSON.stringify(forms));
              return resolve(forms);
            });
        }
      });
    });
  }
}

export default new FormController();
