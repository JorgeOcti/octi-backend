import {Request, Response} from 'express';
import redisClient from '../../services/redis';
import FormModel, {IFormModel} from '../models/form.model';
import ScaleModel, {IScaleModel} from '../models/scale.model';

class FormController {

  constructor() {
    this.list = this.list.bind(this);
    this.detail = this.detail.bind(this);
  }

  public async list(req: Request, res: Response) {
    const keyCache = `list-form`;
    redisClient.get(keyCache, async (error, result) => {
      // the result exists in our cache - return it to our user immediately
      if (result) {
        res.json({
          data: {...JSON.parse(result)},
          status: 200
        });
      } else {
        try {
          // get forms from db
          const forms = await this.getForms();
          // set cache
          redisClient.setex(keyCache, 30, JSON.stringify({forms}));
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
    });
  }

  public async detail(req: Request, res: Response) {
    const {id} = req.params;
    const keyCache = `detail-form-${id}`;
    redisClient.get(keyCache, async (error, result) => {
      // the result exists in our cache - return it to our user immediately
      if (result) {
        res.json({
          data: {...JSON.parse(result)},
          status: 200
        });
      } else {
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
          // set cache
          redisClient.setex(keyCache, 30, JSON.stringify({form, scales}));
          res.json({
            data: {
              form,
              scales
            },
            status: 200
          });

        } catch (e) {
          res.status(400).json({
            error: 'No se encontro formularío',
            status: 400
          });
        }
      }
    });
  }

  private getScales(ids: any[]): Promise<IScaleModel[]> {
    return new Promise((resolve, reject) => {
      ScaleModel
        .find({
          _id: {$in: ids}
        }, {
          'updatedAt': false,
          'createdAt': false,
          'active': false,
          'minValue': false,
          'maxValue': false,
          'choices.na': false
        })
        .exec((err, scales) => {
          if (err) {
            return reject(err);
          }
          return resolve(scales);
        });
    });
  }

  private getForm(id: string): Promise<IFormModel> {
    return new Promise((resolve, reject) => {
      FormModel
        .findById(id, {
          'updatedAt': false,
          'createdAt': false,
          'active': false,
          'sections.shortName': false,
          'sections.questions.shortName': false
        })
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

  private getForms(): Promise<IFormModel[]> {
    return new Promise((resolve, reject) => {
      FormModel
        .find({}, {_id: 1, name: 1})
        .exec((err, forms: IFormModel[]) => {
          if (err) {
            return reject(err);
          }
          return resolve(forms);
        });
    });
  }
}

export default new FormController();
