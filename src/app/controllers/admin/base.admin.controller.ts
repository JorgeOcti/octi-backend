import { Response } from 'express';
import { PaginateOptions, PaginateResult } from 'mongoose';
// import * as Raven from 'raven';
import { IAnyObject, IRequest } from '../../../interfaces/global.interface';
import { io } from '../../../server';

export default abstract class BaseAdminController<T> {

  public paginateOptions: PaginateOptions;
  protected instanceModel: T | any;

  constructor(instanceModel: T) {
    this.instanceModel = instanceModel;
    this.apiList = this.apiList.bind(this);
    this.apiCreate = this.apiCreate.bind(this);
    this.apiUpdate = this.apiUpdate.bind(this);
    this.apiDelete = this.apiDelete.bind(this);
    this.getDataPaginated = this.getDataPaginated.bind(this);
  }

  public async index(req: IRequest, res: Response): Promise<any> {
    if (req.context.permissionRequired && !req.user.hasPermission(req.context.permissionRequired)) {
      res.status(403).render('403');
    }
    res.render('app/index', { token: await req.user.generateToken() });
  }

  public async apiCreate(req: IRequest, res: Response): Promise<any> {
    if (req.context.permissionRequired && !req.user.hasPermission(req.context.permissionRequired)) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    try {
      const existInstance = await this.instanceModel.find(req.context.filter);
      if (existInstance.length) {
        res.status(400).json({
          message: `${req.context.name} ya existe.`,
          status: 400
        });
      } else {
        const result = new this.instanceModel(req.context.data);
        await result.save();
        if (req.context?.socketName) {
          io.to(req.context.socketName).emit('REFRESH', {
            update: true,
            updatedBy: req.user._id
          });
        }
        res.status(201).json({
          message: `${req.context.name} creado/a satisfactoriamente.`,
          result
        });
      }
    } catch (e) {
      /* istanbul ignore next  */
      // Raven.captureException(e);
      res.status(500).json(e);
    }
  }

  public async apiUpdate(req: IRequest, res: Response): Promise<any> {
    if (req.context.permissionRequired && !req.user.hasPermission(req.context.permissionRequired)) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    const { id } = req.params;
    try {
      const result = await this.instanceModel
        .findOneAndUpdate(
          req.context.filter,
          req.context.data,
          {
            new: true
          });
      if (result) {
        if(req.context?.socketName){
          io.to(req.context.socketName).emit('REFRESH', {
            update: true,
            updatedBy: req.user._id
          });
        }
        res.status(200).json({
          message: `${req.context.name} editado/a satisfactoriamente.`,
          result
        });
      } else {
        res.status(400).json({
          id,
          message: `${req.context.name} no encontrado/a.`
        });
      }
    } catch (e) {
      /* istanbul ignore next  */
      // Raven.captureException(e);
      res.status(500).json(e);
    }
  }

  public async apiDelete(req: IRequest, res: Response): Promise<any> {
    if (req.context.permissionRequired && !req.user.hasPermission(req.context.permissionRequired)) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    const { id } = req.params;
    try {
      const existInstance = await this.instanceModel.findOne(req.context.filter);
      if (!existInstance) {
        res.status(400).json({
          message: `${req.context.name} no encontrado/a.`,
          status: 400
        });
      } else {
        await existInstance.remove();
        if(req.context?.socketName){
          io.to(req.context.socketName).emit('REFRESH', {
            update: true,
            updatedBy: req.user._id
          });
        }
        res.status(200).json({
          id,
          message: `${req.context.name} eliminado/a satisfactoriamente.`
        });
      }
    } catch (e) {
      /* istanbul ignore next  */
      // Raven.captureException(e);
      res.status(500).json(e);
    }
  }

  public async apiList(req: IRequest, res: Response): Promise<any> {
    if (req.context.permissionRequired && !req.user.hasPermission(req.context.permissionRequired)) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    const { page, pageSize } = req.query as { page: string, pageSize: string };
    // paginate options
    this.paginateOptions = {
      ...this.paginateOptions,
      page: parseInt(page ? page : '1', 10),
      limit: parseInt(pageSize ? pageSize : '20', 10)
    };
    try {
      const data = await this.getDataPaginated({
        filter: req.context.filter
      });
      // validate exist page
      /* istanbul ignore if  */
      if (this.paginateOptions.page && data.pages && data.pages < this.paginateOptions.page) {
        res.status(404).json({
          message: 'La página solicitada no existe.',
          status: 404
        });
      } else {
        res.json({
          count: data.total,
          pages: data.pages,
          hasPrevious: this.paginateOptions.page && this.paginateOptions.page > 1 && data.pages && data.pages >= this.paginateOptions.page,
          hasNext: this.paginateOptions.page && data.pages && data.pages > this.paginateOptions.page,
          results: data.docs,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next  */
      // Raven.captureException(e);
      res.status(500).json(e);
    }
  }

  private getDataPaginated({ filter }: { filter: IAnyObject }): Promise<PaginateResult<T>> {
    return new Promise(async (resolve, reject) => {
      try {
        resolve(await this.instanceModel.paginate(filter, this.paginateOptions));
      } catch (e) {
        /* istanbul ignore next  */
        reject(e);
      }
    });
  }
}
