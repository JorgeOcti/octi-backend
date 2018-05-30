import {Request, Response} from 'express';
import User, {IUserModel} from '../models/user.model';
import {PaginateOptions, PaginateResult} from 'mongoose';

class AdminController {

  constructor() {
    this.users = this.users.bind(this);
    this.apiUsers = this.apiUsers.bind(this);
  }

  public async users(req: Request, res: Response) {
    res.render('app/index');
  }

  public async apiUsers(req: Request, res: Response) {
    const {page, pageSize} = req.query;
    // options
    const options: PaginateOptions = {
      select: {
        password: false
      },
      page: parseInt(page ? page : 1),
      limit: parseInt(pageSize ? pageSize : 30),
    };
    try {
      const users = await this.getUsers(options);
      // validate exist page
      if (options.page && users.pages && users.pages < options.page) {
        res.status(400).json({
          error: 'La página solicitada no existe.',
          status: 200,
        });
      } else {
        res.json({
          count: users.total,
          pages: users.pages,
          hasPrevious: options.page && users.pages && users.pages <= options.page,
          hasNext: options.page && users.pages && users.pages > options.page,
          results: users.docs,
          status: 200,
        });
      }
    } catch (e) {
      res.status(400).json({
        error: 'Hemos tenido un error al obtener los usuarios',
        status: 400
      });
    }
  }

  private getUsers(options: PaginateOptions): Promise<PaginateResult<IUserModel>> {
    return new Promise((resolve, reject) => {
      User.paginate({}, options, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new AdminController();
