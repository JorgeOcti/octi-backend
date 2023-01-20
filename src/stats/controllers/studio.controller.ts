import { Response } from "express";
import type { IUser } from "../../app/interfaces/user.interface";
import type { IRequest } from '../../interfaces/global.interface';
import Studio from "../models/studio.model";

class StudioController {

  constructor() {
    this.apiList = this.apiList.bind(this);
    this.index = this.index.bind(this);
    this.myStudios = this.myStudios.bind(this);
    this.create = this.create.bind(this);
    this.patch = this.patch.bind(this);
    this.delete = this.delete.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    if (req.user.hasPermission('viewStatsDashboard')) {
      res.render('app/index', {token: await req.user.generateToken()});
    } else {
      res.status(403).render('403');
    }
  }

  public async apiList(req: IRequest, res: Response) {
    const {team} = req.user;
    try {
      let studios = await Studio.find({team}).populate('users');
      res.json({studios, status: 200})
    } catch (e) {
      /* istanbul ignore next  */
      if (e) {
        res.status(500).json(e);
      }
    }

  }

  public async myStudios(req: IRequest, res: Response) {
    const user_id = req.user._id;
    const {type} = req.query;

    let filter : any = { users: user_id };

    if (type) {
      filter['type'] = type;
    }

    try {
      let myStudios = await Studio.find(filter, {_id: 1, name: 1, embedURL: 1, team: 1, type: 1});
      res.json({studios: myStudios, status: 200});
    } catch (e) {
      /* istanbul ignore next  */
      if (e) {
        res.status(500).json(e);
      }
    }
  }

  public async create(req: IRequest, res: Response) {
    const {name, embedURL, type, team, users} = req.body.studio;

    try {
      let studio = await new Studio({name, embedURL, type, team, users: users.map((user: IUser) => user._id)}).save();
      res.json({message: 'Studio creado satisfactoriamente', studio, status: 200});
    } catch (e) {
      /* istanbul ignore next  */
      if (e) {
        res.status(500).json(e);
      }
    }
  }

  public async patch(req: IRequest, res: Response) {
    const {name, embedURL, type, team, users} = req.body.studio;
    const {id} = req.params;

    try {
      let studio = await Studio.findByIdAndUpdate(id, {name, embedURL, type, team, users: users.map((user: IUser) => user._id)});
      res.json({message: 'Studio editado satisfactoriamente',studio, status: 200});
    } catch (e) {
      /* istanbul ignore next  */

      if (e) {
        res.status(500).json(e.message);
      }
    }
  }

  public async delete(req: IRequest, res: Response) {
    const {id} = req.params;
    try {
      let studio = await Studio.findByIdAndRemove(id);
      res.json({message: 'Studio eliminado satisfactoriamente', studio, status: 200});
    } catch (e) {
      /* istanbul ignore next  */
      if (e) {
        res.status(500).json(e);
      }
    }
  }

}

export default new StudioController();
