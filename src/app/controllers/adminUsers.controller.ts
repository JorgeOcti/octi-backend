import {Request, Response} from 'express';
import User, {IUserModel} from '../models/user.model';
import {PaginateOptions, PaginateResult} from 'mongoose';

class AdminUsersController {

  constructor() {
    this.users = this.users.bind(this);
    this.apiUsers = this.apiUsers.bind(this);
    this.apiAddUser = this.apiAddUser.bind(this);
    this.apiDeleteUser = this.apiDeleteUser.bind(this);
  }

  public async users(req: Request, res: Response) {
    res.render('app/index');
  }

  public async apiAddUser(req: Request, res: Response) {
    const {firstName, lastName, email} = req.body;
    if(!firstName || !firstName.length || !lastName || !lastName.length || !email || !email.length){
      res.status(400).json({
        message: 'firstName, lastName and email are required',
        status: 400
      });
    }
    try {
      const existUser = await User.find({$or: [{email: email}, {username: email}]});
      if (existUser.length) {
        res.status(400).json({
          message: 'Usuario ya existe con este email.',
          status: 400
        });
      }
      else{
        const password = Math.random().toString(36).slice(-8);
        let newUser = await new User({
          firstName,
          lastName,
          username: email,
          password,
          email
        }).save();
        newUser = newUser.toObject();
        delete newUser.password;
        res.status(201).json({
          message: 'Usuario agregado satisfactoriamente.',
          user: newUser
        });
      }
    } catch (e) {
      res.status(500).json(e);
    }
  }

  public async apiUsers(req: Request, res: Response) {
    const {page, pageSize} = req.query;
    // paginate options
    const options: PaginateOptions = {
      select: {
        password: false
      },
      sort: {
        createdAt: -1
      },
      page: parseInt(page ? page : 1),
      limit: parseInt(pageSize ? pageSize : 20),
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
      if (e) res.status(500).json(e);
    }
  }

  public apiDeleteUser(req: Request, res: Response) {
    const {id} = req.params;
    User.findByIdAndRemove(id, (err, user) => {
      // As always, handle any potential errors:
      if (err) res.status(500).send(err);
      if (user) {
        const response = {
          message: "Usuario eliminado satisfactoriamente.",
          id: user._id
        };
        res.status(200).send(response);
      }
      else {
        const response = {
          message: "Este usuario ya fue eliminado.",
          id: id
        };
        res.status(200).send(response);
      }
    })
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

export default new AdminUsersController();
