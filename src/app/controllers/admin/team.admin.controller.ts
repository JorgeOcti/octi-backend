import {Response} from 'express';
import {PaginateOptions, PaginateResult} from 'mongoose';
import {IRequest} from '../../../interfaces/global.interface';
import Team, {ITeamModel} from '../../models/team.model';

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
    const {page, pageSize, search} = req.query;
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
      page: parseInt(page ? page : 1, 10),
      limit: parseInt(pageSize ? pageSize : 20, 10)
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
