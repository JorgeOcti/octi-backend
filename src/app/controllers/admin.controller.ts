import {Request, Response} from 'express';
import User from '../models/user.model';
class AdminController {

  constructor() {
    this.users = this.users.bind(this);
    this.apiUsers = this.apiUsers.bind(this);
  }

  public async users(req: Request, res: Response) {
    res.render('app/index');
  }

  public async apiUsers(req: Request, res: Response) {
    try {
      const users = await this.getUsers();
      this.getUsers();
      res.json({
        users,
        status: 200
      });
    } catch (e) {
      res.status(400).json({
        error: 'Hemos tenido un error al obtener los usuarios',
        status: 400
      });
    }
  }

  private getUsers(){
    return new Promise((resolve, reject) => {
      User
        .find({}, {password:false})
        .exec((err, users) => {
          if (err) {
            return reject(err);
          }
          return resolve(users);
        })
    });
  }


}

export default new AdminController();
