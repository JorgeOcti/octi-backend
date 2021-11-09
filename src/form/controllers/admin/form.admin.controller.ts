import {Response} from 'express';
import {PaginateOptions, PaginateResult} from 'mongoose';
import {IRequest} from '../../../interfaces/global.interface';
import Form, {IFormModel} from '../../models/form.model';

class AdminFormsController {

  constructor() {
    this.index = this.index.bind(this);
    this.apiListForms = this.apiListForms.bind(this);
  }

  /* istanbul ignore next */
  public async index(req: IRequest, res: Response) {
    res.render('app/index', {token: await req.user.generateToken()});
  }

  public async apiListForms(req: IRequest, res: Response): Promise<any> {
    const {page, pageSize} = req.query as { page: string, pageSize: string };
    const team = req.user.team._id;
    // paginate options
    const options: PaginateOptions = {
      select: {
        name: true,
        triggers: true,
        active: true
      },
      sort: {
        firstName: 1
      },
      page: parseInt(page ? page : "1", 10),
      limit: parseInt(pageSize ? pageSize : "20", 10)
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

  private getForms(filter: any, options: PaginateOptions): Promise<PaginateResult<IFormModel>> {
    return new Promise((resolve, reject) => {
      Form.paginate(filter, options, (err, result) => {
        if (err) {
          /* istanbul ignore next */
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new AdminFormsController();
