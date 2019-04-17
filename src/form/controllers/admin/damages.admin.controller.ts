import {Response} from 'express';
import {PaginateOptions, PaginateResult} from 'mongoose';
import {IRequest} from '../../../interfaces/global.interface';
import Damages, {IDamagesModel} from '../../models/damages.model';
import Kind, {IKindModel} from '../../models/kind.model';
import {IPartModel} from '../../models/part.model';
import Part from '../../models/part.model';
import Position from '../../models/position.model';
import {IPositionModel} from '../../models/position.model';

class AdminDamagesController {

  private kind: IKindModel;
  private position: IPositionModel;
  private part: IPartModel;
  private damage: IDamagesModel;

  constructor() {
    this.index = this.index.bind(this);
    this.apiListDamages = this.apiListDamages.bind(this);
    this.kind = new Kind();
    this.position = new Position();
    this.part = new Part();
    this.damage = new Damages();
    console.log({
      kind: this.kind,
      position: this.position,
      part: this.part,
      damage: this.damage
    });
  }

  /* istanbul ignore next */
  public async index(req: IRequest, res: Response) {
    res.render('app/index', {token: await req.user.generateToken()});
  }

  public async apiListDamages(req: IRequest, res: Response): Promise<any> {
    const {page, pageSize} = req.query;
    const {team} = req.user;
    // paginate options
    const options: PaginateOptions = {
      select: ['name', 'parts', 'kinds', 'positions'],
      sort: {
        name: 1
      },
      populate: [{
        path: 'parts',
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
        path: 'positions',
        select: ['name'],
        options: {
          sort: {
            name: 1
          }
        }
      }],
      page: parseInt(page ? page : 1, 10),
      limit: parseInt(pageSize ? pageSize : 20, 10)
    };
    try {
      const forms = await this.getForms({
        team
      }, options);
      // validate exist page
      if (options.page && forms.pages && forms.pages < options.page) {
        /* istanbul ignore next */
        res.status(400).json({
          error: 'La página solicitada no existe.',
          status: 200
        });
      } else {
        res.json({
          count: forms.total,
          pages: forms.pages,
          hasPrevious: options.page && options.page > 1 && forms.pages && forms.pages >= options.page,
          hasNext: options.page && forms.pages && forms.pages > options.page,
          results: forms.docs,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      if (e) {
        res.status(500).json(e);
      }
    }
  }

  private getForms(filter: any, options: PaginateOptions): Promise<PaginateResult<IDamagesModel>> {
    return new Promise((resolve, reject) => {
      Damages.paginate(filter, options, (err, result) => {
        if (err) {
          /* istanbul ignore next */
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new AdminDamagesController();
