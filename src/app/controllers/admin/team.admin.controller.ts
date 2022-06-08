import {Response} from 'express';
import {PaginateOptions, PaginateResult} from 'mongoose';
import {IRequest} from '../../../interfaces/global.interface';
import Team, {ITeamModel} from '../../models/team.model';
import TeamSetting from "../../models/teamSetting.model";
import logger from "../../../services/logger.service";
import User from '../../models/user.model';

class AdminsTeamController {

  constructor() {
    this.index = this.index.bind(this);
    this.apiListTeams = this.apiListTeams.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    // if (req.user.hasPermission('viewCompanies')) {
      res.render('app/index', {token: await req.user.generateToken()});
    // } else {
    //   res.status(403).render('403');
    // }
  }

  public async apiListTeams(req: IRequest, res: Response) {
    const {page, pageSize, search} = req.query as { page: string, pageSize: string, search: string };
    // paginate options
    const options: PaginateOptions = {
      select: {
        name: true,
        updatedAt: true,
        createdAt: true
      },
      sort: {
        name: 1
      },
      page: parseInt(page ? page : "1", 10),
      limit: parseInt(pageSize ? pageSize : "20", 10)
    };
    const teams = await this.getTeams({}, options, search);
    if (options.page && teams.pages && teams.pages < options.page) {
        res.status(400).json({
          error: 'La página solicitada no existe.',
          status: 200
        });
      } else {
        res.json({
          count: teams.total,
          pages: teams.pages,
          hasPrevious: options.page && options.page > 1 && teams.pages && teams.pages >= options.page,
          hasNext: options.page && teams.pages && teams.pages > options.page,
          results: teams.docs,
          status: 200
        });
      }

  }

  public async teamSetting(req: IRequest, res: Response) {
    const {team} = req.user;
    try {
      const user = await User.findById(req.user._id);
      const teamSetting = await TeamSetting.findOneOrCreate({
        team: team._id
      }, {
        team: team._id,
        inventory: {
          leftoverDifferentVenue: true,
          pending: "Pendientes",
          pendingClass: "aqua",
          pendingColor: "#00c2f4",
          found: "Encontrados",
          foundClass: "green",
          foundColor: "#00aa51",
          missing: "Faltantes",
          missingClass: "red",
          missingColor: "#f1392c",
          leftover: "Encontrados*",
          leftoverClass: "yellow",
          leftoverColor: "#ff9600",
          reported: "Reportados",
          reportedClass: "gray-dark",
          reportedColor: "#96a4b3"
        },
        request: {
          color: true,
          colorRequired: true,
          denomination: true,
          denominationRequired: true,
          internalNumber: true,
          internalNumberRequired: false,
          internalNumberText: "Número interno",
          material: true,
          materialRequired: true
        }
      });
      return res.status(200).json({
        ...teamSetting.toObject(),
        user: user?.settings ?? {}
      });
    } catch (e) {
      /* istanbul ignore next */
      console.log(e);
      logger.error(`RequestController.apiCreateItem: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}`);
      return res.status(500).json(e);
    }
  }

  private getTeams(filter: any, options: PaginateOptions, search?: string): Promise<PaginateResult<ITeamModel>> {
    return new Promise((resolve, reject) => {
      Team.paginate(filter, options, (err, result) => {
        /* istanbul ignore if */
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new AdminsTeamController();
