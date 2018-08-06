import {ObjectID} from 'bson';
import {Response} from 'express';
import {PaginateOptions, PaginateResult} from 'mongoose';
import {queue} from '../../../app';
import {IRequest} from '../../../interfaces/global.interface';
import {IPermission} from '../../../interfaces/permision.interface';
import User, {IUserModel} from '../../models/user.model';
import {IForm} from "../../../interfaces/form.interface";

class AdminUsersController {

  constructor() {
    this.index = this.index.bind(this);
    this.apiUsers = this.apiUsers.bind(this);
    this.apiAddUser = this.apiAddUser.bind(this);
    this.apiEditUser = this.apiEditUser.bind(this);
    this.apiDeleteUser = this.apiDeleteUser.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    if (req.user.hasPermission('viewUser')) {
      res.render('app/index', {token: await req.user.generateToken()});
    } else {
      res.status(403).render('403');
    }
  }

  public async apiUsers(req: IRequest, res: Response): Promise<any> {
    if (!req.user.hasPermission('viewUser')) {
      return res.status(403).json({
        message: 'No tiene permisos para esta operación'
      });
    }
    const {page, pageSize} = req.query;
    const company = req.user.company;
    // paginate options
    const options: PaginateOptions = {
      select: {
        firstName: true,
        lastName: true,
        preferred: true,
        email: true,
        updatedAt: true
      },
      populate: [{
        path: 'venue',
        select: ['name', 'active']
      }, {
        path: 'userPermissions',
        select: ['name', 'codeName'],
        options: {
          sort: {
            name: 1
          }
        }
      }, {
        path: 'userForms',
        select: ['name']
      }],
      sort: {
        firstName: 1
      },
      page: parseInt(page ? page : 1, 10),
      limit: parseInt(pageSize ? pageSize : 20, 10)
    };
    try {
      const users = await this.getUsers(company, options);
      // validate exist page
      if (options.page && users.pages && users.pages < options.page) {
        res.status(400).json({
          error: 'La página solicitada no existe.',
          status: 200
        });
      } else {
        res.json({
          count: users.total,
          pages: users.pages,
          hasPrevious: options.page && options.page > 1 && users.pages && users.pages >= options.page,
          hasNext: options.page && users.pages && users.pages > options.page,
          results: users.docs,
          status: 200
        });
      }
    } catch (e) {
      if (e) {
        res.status(500).json(e);
      }
    }
  }

  public async apiAddUser(req: IRequest, res: Response): Promise<any> {
    if (!req.user.hasPermission('addUser')) {
      return res.status(403).json({
        message: 'No tiene permisos para esta operación'
      });
    }
    const {firstName, lastName, email, venue, userPermissions, userForms} = req.body;
    const company = req.user.company;
    // validate fields required
    if (!firstName || !firstName.length || !lastName || !lastName.length || !email || !email.length || !venue || !venue.length) {
      res.status(400).json({
        message: 'firstName, lastName, email and venue are required',
        status: 400
      });
    }
    try {
      // validate existe user
      const existUser = await User.find({$or: [{email}, {username: email}]});
      if (existUser.length) {
        res.status(400).json({
          message: 'Usuario ya existe con este email.',
          status: 400
        });
      } else {
        // generate password
        const password = Math.random().toString(36).slice(-8);
        // create user
        let newUser = await new User({
          firstName,
          lastName,
          username: email,
          venue,
          userPermissions: userPermissions && userPermissions.length ? userPermissions.map((userPermission: IPermission) => userPermission._id) : [],
          userForms: userForms && userForms.length ? userForms.map((userForm: IForm) => userForm._id) : [],
          company,
          password,
          email,
          active: true
        }).save();

        // const errors = await newUser.validate();
        // console.log(errors);

        // send welcome email
        const fullname: string = newUser.fullName();
        queue.create('email', {
          from: '',
          title: `Welcome email for ${fullname}`,
          to: `"${fullname}"<${newUser.email}>`,
          subject: `${fullname} bienvenido(a) a OSA Andes`,
          text: `${fullname} bienvenido(a) a OSA Andes
          {Empresa} te da la bienvenida a usar OSA Andes. bla bla bla......

          Tus Datos para acceder a la aplicación son:
          Usuario: ${newUser.email}
          Contraseña ${password}
          En caso de dudas o consultas puedes contactarte asoporte@osacontrol.com o a nuestro twitter @TaskforceOSA.

          © 2018 OSA SpA. All rights reserved.`,
          view: 'account/welcome',
          context: {
            fullname,
            username: newUser.email,
            password
          }
        }).priority('high').attempts(5).save();

        // prevent return password
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

  public async apiEditUser(req: IRequest, res: Response): Promise<any> {
    if (!req.user.hasPermission('changeUser')) {
      return res.status(403).json({
        message: 'No tiene permisos para esta operación'
      });
    }
    const {id} = req.params;
    const company = req.user.company;
    const {firstName, lastName, email, venue, userPermissions, userForms} = req.body;
    // validate fields required
    if (!firstName || !firstName.length || !lastName || !lastName.length || !email || !email.length || !venue || !venue.length) {
      res.status(400).json({
        message: 'firstName, lastName, email and venue are required',
        status: 400
      });
    }
    try {
      // validate email not duplicate
      const countUser = await User.count({email, _id: {$ne: id}});
      if (countUser) {
        res.status(400).json({
          message: 'Usuario ya existe con este email.',
          status: 400
        });
      } else {
        let user = await User
          .findOneAndUpdate({
            _id: id, company
          }, {
            firstName,
            lastName,
            email,
            userPermissions: userPermissions && userPermissions.length ? userPermissions.map((userPermission: IPermission) => userPermission._id) : [],
            userForms: userForms && userForms.length ? userForms.map((userForm: IForm) => userForm._id) : [],
            venue
          }, {
            new: true
          })
          .populate([{
            path: 'venue',
            select: ['name', 'active']
          }, {
            path: 'userPermissions',
            select: ['name', 'codeName'],
            options: {
              sort: {
                name: 1
              }
            }
          }, {
            path: 'userForms',
            select: ['name']
          }]);
        if (user) {
          // prevent return password
          user = user.toObject();
          if (user) {
            delete user.password;
          }

          const response = {
            message: 'Usuario editado satisfactoriamente.',
            user
          };
          res.status(200).json(response);
        } else {
          const response = {
            id,
            message: 'Usuario no encontardo'
          };
          res.status(200).json(response);
        }
      }
    } catch (e) {
      console.log(e);
      res.status(500).json(e);
    }
  }

  public async apiDeleteUser(req: IRequest, res: Response): Promise<any> {
    if (!req.user.hasPermission('deleteUser')) {
      return res.status(403).json({
        message: 'No tiene permisos para esta operación'
      });
    }
    const {id} = req.params;
    const company = req.user.company;
    try {
      const user = await User.findOneAndRemove({_id: id, company});
      if (user) {
        const response = {
          message: 'Usuario eliminado satisfactoriamente.',
          id: user._id
        };
        res.status(200).json(response);
      } else {
        const response = {
          id,
          message: 'Este usuario ya fue eliminado.'
        };
        res.status(200).json(response);
      }
    } catch (e) {
      res.status(500).json(e);
    }
  }

  private getUsers(company: ObjectID, options: PaginateOptions): Promise<PaginateResult<IUserModel>> {
    return new Promise((resolve, reject) => {
      User.paginate({company}, options, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new AdminUsersController();
