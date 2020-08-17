import {Response} from 'express';
import {PaginateOptions, PaginateResult} from 'mongoose';
import {IRequest} from '../../interfaces/global.interface';
import {io} from '../../server';
import InventoryLabel, {IInventoryLabelModel} from '../models/inventoryLabel.model';
import TeamSetting from "../../app/models/teamSetting.model";

class LabelController {
  constructor() {
    this.index = this.index.bind(this);
    this.apilist = this.apilist.bind(this);
    this.apiUpdateLabel = this.apiUpdateLabel.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    res.render('app/index', {token: await req.user.generateToken()});
  }

  public async apilist(req: IRequest, res: Response) {
    const {team} = req.user;
    const {page, pageSize} = req.query as {page: string; pageSize: string};
    // paginate options
    const options: PaginateOptions = {
      sort: {
        createdAt: -1
      },
      page: parseInt(page ? page : "1", 10),
      limit: parseInt(pageSize ? pageSize : "20", 10)
    };
    try {
      const labels = await this.getLabels({
        team
      }, options);
      /* istanbul ignore if  */
      if (options.page && labels.pages && labels.pages < options.page) {
        res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        const teamSettings = await TeamSetting.findOne({team});
        res.json({
          inventorySettings: teamSettings!.inventory,
          count: labels.total,
          pages: labels.pages,
          hasPrevious: options.page && options.page > 1 && labels.pages && labels.pages >= options.page,
          hasNext: options.page && labels.pages && labels.pages > options.page,
          results: labels.docs,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next  */
      if (e) {
        res.status(500).json(e);
      }
    }
  }

  public async apiCreateLabel(req: IRequest, res: Response): Promise<any> {
    const {team} = req.user;
    const {body} = req;
    try {
      const inventoryLabel = new InventoryLabel({
        name: body.name,
        affected: body.affected,
        sendTo: body.sendTo,
        isExhibition: body.isExhibition,
        color: body.color,
        requireCustomText: body.requireCustomText,
        updatedBy: req.user._id,
        team
      });
      await inventoryLabel.save();
      const response = {
        message: 'Etiqueta creada satisfactoriamente.',
        label: inventoryLabel
      };
      io.to(`label-list-${team}`).emit('REFRESH', {
        update: true,
        updatedBy: req.user._id
      });
      res.status(200).json(response);
    } catch (e) {
      /* istanbul ignore next  */
      console.log(e);
      /* istanbul ignore next  */
      res.status(500).json(e);
    }
  }

  public async apiUpdateLabel(req: IRequest, res: Response): Promise<any> {
    const {id} = req.params;
    const {team} = req.user;
    const {body} = req;
    try {
      const inventoryLabel = await InventoryLabel.findOneAndUpdate({
        _id: id,
        team
      }, {
        name: body.name,
        active: body.active,
        affected: body.affected,
        sendTo: body.sendTo,
        isExhibition: body.isExhibition,
        color: body.color,
        requireCustomText: body.requireCustomText,
        updatedBy: req.user._id
      }, {
        new: true
      });
      if (inventoryLabel) {
        const response = {
          message: 'Etiqueta editada satisfactoriamente.',
          label: inventoryLabel
        };
        io.to(`label-list-${team}`).emit('REFRESH', {
          update: true,
          updatedBy: req.user._id
        });
        res.status(200).json(response);
      } else {
        const response = {
          id,
          message: 'Etiqueta no encontrada'
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

  public async apiDeleteLabel(req: IRequest, res: Response): Promise<any> {
    const {id} = req.params;
    const {team} = req.user;
    try {
      const inventoryLabel = await InventoryLabel.findOneAndRemove({
        _id: id,
        team
      });
      if (inventoryLabel) {
        const response = {
          message: 'Etiqueta eliminada satisfactoriamente.',
          id: inventoryLabel._id
        };
        io.to(`label-list-${team}`).emit('REFRESH', {
          update: true,
          updatedBy: req.user._id
        });
        res.status(200).json(response);
      } else {
        const response = {
          id,
          message: 'Esta Etiqueta ya fue eliminada.'
        };
        res.status(200).json(response);
      }
    } catch (e) {
      /* istanbul ignore next */
      res.status(500).json(e);
    }
  }

  private getLabels(filter: any, options: PaginateOptions): Promise<PaginateResult<IInventoryLabelModel>> {
    return new Promise((resolve, reject) => {
      InventoryLabel.paginate(filter, options, (err, result) => {
        /* istanbul ignore next  */
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new LabelController();
