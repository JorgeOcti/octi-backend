import { Response } from 'express';
import { PaginateOptions, PaginateResult } from 'mongoose';
import { IRequest } from '../../../interfaces/global.interface';
import Form, { IFormModel } from '../../models/form.model';
import logger from '../../../services/logger.service';
import { socket } from '../../../services/socket.service';

class AdminFormsController {

  constructor() {
    this.index = this.index.bind(this);
    this.apiList = this.apiList.bind(this);
    this.apiCreate = this.apiCreate.bind(this);
    this.apiUpdate = this.apiUpdate.bind(this);
    this.apiDelete = this.apiDelete.bind(this);
  }

  /* istanbul ignore next */
  public async index(req: IRequest, res: Response) {
    res.render('app/index', { token: await req.user.generateToken() });
  }

  public async apiCreate(req: IRequest, res: Response) {
    const { team } = req.user;
    const { body } = req;
    try {
      const form = await new Form({ ...body, team }).save();
      socket().to(`forms-list-${team._id}`).emit('REFRESH', {
        update: true
      });
      res.status(200).json({
        message: 'Formulario creado satisfactoriamente.',
        form
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`AdminFormsController.apiCreate: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      console.error(e);
      res.status(500).json(e);
    }
  }

  public async apiUpdate(req: IRequest, res: Response) {
    try {
      const { id } = req.params;
      const team = req.user.team._id;
      const { body } = req;
      const form = await Form.findOneAndUpdate({ _id: id, team }, { $set: { ...body } });
      socket().to(`forms-list-${team}`).emit('REFRESH', {
        update: true
      });
      res.status(200).json({
        message: 'Formulario editado satisfactoriamente.',
        form
      });
    } catch (e) {
      //* istanbul ignore next */
      logger.error(`AdminFormsController.apiUpdate: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      console.error(e);
      res.status(500).json(e);
    }
  }

  public async apiDelete(req: IRequest, res: Response) {
    const { team } = req.user;
    const { id } = req.params;
    try {
      const form = await Form.findOneAndDelete({ _id: id, team });
      socket().to(`forms-list-${team._id}`).emit('REFRESH', {
        update: true
      });
      res.status(200).json({
        message: 'Formulario eliminadp satisfactoriamente.',
        form
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`AdminFormsController.apiDelete: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      res.status(500).json(e);
    }
  }

  public async apiList(req: IRequest, res: Response): Promise<any> {
    const { page, pageSize, activated } = req.query as { page: string, pageSize: string, activated?: string };
    const team = req.user.team._id;
    // paginate options
    const options: PaginateOptions = {
      select: {
        name: true,
        triggers: true,
        active: true
      },
      sort: {
        active: -1,
        name: 1
      },
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

    let filter: any = { team };
    if (activated) {
      filter = { ...filter, active: activated === '1' };
    }

    try {
      logger.info(`FormController.apiList: email: ${req.user.email} query: ${JSON.stringify(req.query)}`);
      logger.debug(`FormController.apiList: email: ${req.user.email} filter: ${JSON.stringify(filter)}`);
      const forms = await this.getForms(filter, options);
      // validate exist page
      if (options.page && forms.pages && forms.pages < options.page) {
        /* istanbul ignore next */
        return res.status(400).json({
          error: 'La página solicitada no existe.',
          status: 200
        });
      } else {
        return res.json({
          count: forms.total,
          pages: forms.pages,
          hasPrevious: forms.hasPrevious,
          hasNextPage: forms.hasNextPage,
          results: forms.docs,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      if (e) {
        return res.status(500).json(e);
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
