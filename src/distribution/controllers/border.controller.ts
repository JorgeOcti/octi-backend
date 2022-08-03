import * as mongoose from "mongoose";
import logger from "../../services/logger.service";
import {PaginateOptions, PaginateResult} from "mongoose";
import {Response} from "express";
import {IRequest} from "../../interfaces/global.interface";
import Border, {IBorderModel} from "../models/border.model";

class BorderController {

  constructor() {
    this.index = this.index.bind(this);
    this.getBorders = this.getBorders.bind(this);
    this.apiListBorder = this.apiListBorder.bind(this);
    this.apiCreateBorder = this.apiCreateBorder.bind(this);
    this.apiDeleteBorder = this.apiDeleteBorder.bind(this);
    this.apiUpdateBorder = this.apiUpdateBorder.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    /* istanbul ignore else  */
    if (req.user.hasPermission('viewBorder')) {
      res.render('app/index', { token: await req.user.generateToken() });
    } else {
      res.status(403).render('403');
    }
  }

  public async apiListBorder(req: IRequest, res: Response) {
    if (!req.user.hasPermission('viewBorder')) {
      res.status(403).json({message: 'No tienes permisos para esta operación'});
    }
    try {
      const team = req.user.team._id;
      const {
        page,
        pageSize,
        search
      } = req.query as { page: string, pageSize: string, search: string };

      const options: PaginateOptions = {
        sort: {
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
        limit: parseInt(pageSize ? pageSize : '20', 10),
      };
      const filter = {team: new mongoose.Types.ObjectId(team)};

      logger.info(`BorderController.apiListBorder: email: ${req.user.email} query: ${JSON.stringify(req.query)}`);

      let borders = await this.getBorders(filter, options, search);

      /* istanbul ignore if  */
      if (options.page && borders.pages && borders.pages < options.page) {
        return res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        return res.json({
          count: borders.total,
          pages: borders.pages,
          hasPrevious: options.page && options.page > 1 && borders.pages && borders.pages >= options.page,
          hasNext: options.page && borders.pages && borders.pages > options.page,
          results: borders.docs,
          status: 200
        });
      }
    } catch (error) {
      return res.status(500).json(error);
    }
  }

  public async apiCreateBorder(req: IRequest, res: Response): Promise<any> {
    if (!req.user.hasPermission('addBorder')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    const { name, lat, lng, company } = req.body;
    const team = req.user.team._id;
    logger.info(`BorderController.apiCreateBorder: email: ${req.user.email}`);

    if (!name || !name.trim().length) {
      res.status(400).json({
        message: 'El nombre es requerido.',
        status: 400
      });
    }


    try {
      const existBorder = await Border.find({
        name,
        team
      });
      if (existBorder.length) {
        res.status(400).json({
          message: 'Sucursal ya existe.',
          status: 400
        });
      } else {
        const newBorder = await new Border({
          name,
          lat,
          lng,
          team,
          company,
        }).save();
        // reverse assing send to and reveive from

        res.status(201).json({
          message: 'Paso de frontera agregada satisfactoriamente.',
          border: await newBorder.populate([{
            path: 'company',
            select: ['_id', 'name']
          }])
        });
      }
    } catch (e) {
      /* istanbul ignore next  */
      console.log(e);
      /* istanbul ignore next  */
      res.status(500).json(e);
    }
  }

  public async apiUpdateBorder(req: IRequest, res: Response): Promise<any> {
    /* istanbul ignore next  */
    if (!req.user.hasPermission('changeBorder')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    logger.info(`BorderController.apiUpdateBorder: email: ${req.user.email}`);
    const { id } = req.params;
    const team = req.user.team._id;
    const { name, lat, lng, company } = req.body;

    if (!name || !name.length) {
      res.status(400).json({
        message: 'The name is are required',
        status: 400
      });
    }

    try {
      const border = await Border.findOneAndUpdate({
        _id: id,
        team
      }, {
        name,
        lat,
        lng,
        company,
      }, {
        new: true
      }).populate([{
        path: 'company',
        select: ['_id', 'name']
      }]);
      if (border) {
        res.status(200).json({
          message: 'Paso de frontera editado satisfactoriamente.',
          border
        });
      } else {
        const response = {
          id,
          message: 'Paso de frontera no encontrado'
        };
        res.status(400).json(response);
      }
    } catch (e) {
      /* istanbul ignore next  */
      console.log(e);
      /* istanbul ignore next  */
      res.status(500).json(e);
    }
  }

  public async apiDeleteBorder(req: IRequest, res: Response): Promise<any> {
    if (!req.user.hasPermission('deleteBorder')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    logger.info(`BorderController.apiDeleteBorder: email: ${req.user.email}`);
    const { id } = req.params;
    const team = req.user.team._id;
    try {
      const border = await Border.findOne({
        _id: id,
        team
      });
      if (border) {
        await border.remove();
        res.status(200).json({
          message: 'Sucursal eliminada satisfactoriamente.',
          id: border._id
        });
      } else {
        res.status(200).json({
          id,
          message: 'Esta sucursal ya ha sido eliminada.'
        });
      }
    } catch (e) {
      /* istanbul ignore next  */
      res.status(500).json(e);
    }
  }

  private getBorders(filter: any, options: PaginateOptions, search?: string): Promise<PaginateResult<IBorderModel>> {
    if (search && search.length) {
      const searchText = new RegExp(search, 'i');
      filter = {
        $and: [{
          name: { $regex: searchText }
        }, filter]
      };
    }
    return new Promise((resolve, reject) => {
      Border.paginate!(filter, options, (err, result) => {
        /* istanbul ignore next  */
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new BorderController();
