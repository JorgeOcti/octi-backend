import * as excel from 'exceljs';
import {Response} from 'express';
import {
  PaginateOptions,
  PaginateResult
} from 'mongoose';
import * as tempfile from 'tempfile';
import {queue} from '../../../app';
import {IForm} from '../../../interfaces/form.interface';
import {IRequest} from '../../../interfaces/global.interface';
import {IPermission} from '../../../interfaces/permision.interface';
import {io} from '../../../server';
import User, {
  IUserModel
} from '../../models/user.model';
import Venue from "../../models/venue.model";
import {Alignment} from "exceljs";

class AdminUsersController {

  constructor() {
    this.index = this.index.bind(this);
    this.apiUsers = this.apiUsers.bind(this);
    this.apiCreateUser = this.apiCreateUser.bind(this);
    this.apiUpdateUser = this.apiUpdateUser.bind(this);
    this.apiDeleteUser = this.apiDeleteUser.bind(this);
    this.exportXLS = this.exportXLS.bind(this);
    this.apiChangePasswordUser = this.apiChangePasswordUser.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    /* istanbul ignore else  */
    if (req.user.hasPermission('viewUser')) {
      res.render('app/index', {token: await req.user.generateToken()});
    } else {
      res.status(403).render('403');
    }
  }

  public async exportXLS(req: IRequest, res: Response): Promise<any> {
    if (!req.user.hasPermission('viewUser')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    const {team} = req.user;
    try {
      /* generate file */
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Usuarios', {
        properties: {
          defaultRowHeight: 30
        }, pageSetup: {
          fitToPage: true, fitToHeight: 100, fitToWidth: 1
        }
      });
      worksheet.autoFilter = {from: 'A1', to: 'F1'};
      const worksheetAccess = workbook.addWorksheet('Accesos', {
        properties: {
          defaultRowHeight: 30
        }, pageSetup: {
          fitToPage: true, fitToHeight: 100, fitToWidth: 1
        }
      });
      worksheetAccess.views = [{
        state: 'frozen',
        xSplit: 1,
        ySplit: 1,
        topLeftCell: 'B2',
        activeCell: 'A1'
      }];
      const accessColumns: any[] = [{
        header: "Usuario",
        key: "usuario",
        width: 30,
        alignment: {
          wrapText: true
        }
      }];
      const accessRow: any[] = [];
      const venues = await Venue.find({team, deleted: false}).sort('name');
      for (const venue of venues) {
        accessColumns.push({
          header: venue.name, key: venue._id.toString(), width: 5,
          style: {
            alignment: {
              vertical: 'middle',
              horizontal: 'center'
            }
          }
        });
      }
      worksheetAccess.columns = accessColumns;
      worksheetAccess.autoFilter = {
        from: 'A1',
        to: {
          row: 1,
          column: accessColumns.length
        }
      };
      worksheetAccess.getColumn(1).eachCell((cell) => {
        cell.alignment = {
          vertical: 'middle',
          textRotation: 0,
          wrapText: true
        };
        cell.font = {
          bold: true,
        };
      });
      worksheetAccess.getRow(1).eachCell((cell) => {
        const alignment: Partial<Alignment> = {
          vertical: 'middle',
          horizontal: 'center',
          textRotation: 0,
          wrapText: true
        };
        if (parseInt(cell.col, 10) !== 1) {
          alignment.textRotation = 90
        }
        cell.alignment = alignment;
        cell.font = {
          bold: true,
        };
      });

      /* headers */
      worksheet.columns = [{
        header: 'Nombre', key: 'name', width: 30
      }, {
        header: 'Correo', key: 'email', width: 30
      }, {
        header: 'Sucursal', key: 'venue', width: 30
      }, {
        header: 'Empresa', key: 'company', width: 20
      }, {
        header: 'Creado', key: 'created', width: 21, style: {numFmt: 'dd/mm/yyyy hh:mm'}
      }, {
        header: 'Último inicio de sesión', key: 'lastLogin', width: 21, style: {numFmt: 'dd/mm/yyyy hh:mm'}
      }];

      /* body */
      const users = await User.find({
        team,
        venue: {
          $in: req.user.venuesPermissions()
        }
      }).populate([{
        path: 'venuesAccess',
        select: ['name'],
        populate: [{
          path: 'company',
          select: ['name']
        }]
      }, {
        path: 'venue',
        select: ['name', 'active'],
        populate: [{
          path: 'company',
          select: ['name']
        }]
      }]).sort('firstName');
      users.forEach((user) => {
        const detailUser = {
          name: user.fullName(),
          email: user.email,
          created: user.createdAt,
          lastLogin: user.lastLogin
        };
        worksheet.addRow({
          ...detailUser,
          venue: user.venue ? user.venue.name : '',
          company: user.venue && user.venue.company ? user.venue.company.name : ''
        });
        const dataVenues: any = {};
        user.venuesPermissions(true).forEach((venue: string) => {
          dataVenues[venue] = "X";
          // worksheet.addRow({
          //   ...detailUser,
          //   venue: venue.name,
          //   company: venue.company.name
          // });
        });
        accessRow.push({
          usuario: user.fullName(),
          ...dataVenues
        })
      });
      worksheetAccess.addRows(accessRow);
      /* formats */
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = {
          bold: true
        };
      });
      // const idCol = worksheet.getColumn('id');
      // idCol.eachCell({includeEmpty: true}, (cell) => {
      //   cell.alignment = {vertical: 'middle', horizontal: 'center'};
      // });
      const tempFilePath = tempfile('.xlsx');
      await workbook.xlsx.writeFile(tempFilePath);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=usuarios-21-03-2019.xlsx');
      return res.sendFile(tempFilePath);
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: 'Ha ocurrido un error. Comunicate con soporte para que te ayudemos a solucionarlo.'
      });
    }
  }

  public async apiUsers(req: IRequest, res: Response): Promise<any> {
    if (!req.user.hasPermission('viewUser')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    const {page, pageSize, search} = req.query as { page: string, pageSize: string, search: string};
    const {team} = req.user;
    // paginate options
    const options: PaginateOptions = {
      select: {
        firstName: true,
        lastName: true,
        preferred: true,
        email: true,
        isAdmin: true,
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
      }, {
        path: 'company',
        select: ['name']
      }, {
        path: 'venuesAccess',
        select: ['name'],
        populate: [{
          path: 'company',
          select: ['name']
        }]
      }],
      sort: {
        firstName: 1,
        lastName: 1
      },
      page: parseInt(page ? page : "1", 10),
      limit: parseInt(pageSize ? pageSize : "20", 10)
    };
    try {
      const users = await this.getUsers({
        team,
        venue: {
          $in: req.user.venuesPermissions()
        }
      }, options, search);
      // validate exist page
      /* istanbul ignore if  */
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
      /* istanbul ignore next  */
      if (e) {
        res.status(500).json(e);
      }
    }
  }

  public async apiCreateUser(req: IRequest, res: Response): Promise<any> {
    /* istanbul ignore next  */
    if (!req.user.hasPermission('addUser')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    const {firstName, lastName, email, venue, userPermissions, userForms, preferred, company, venuesAccess} = req.body;
    const {team} = req.user;
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
          venuesAccess,
          preferred,
          userPermissions: userPermissions && userPermissions.length ? userPermissions.map((userPermission: IPermission) => userPermission._id) : [],
          userForms: userForms && userForms.length ? userForms.map((userForm: IForm) => userForm._id) : [],
          company,
          team,
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
          {Empresa} te da la bienvenida a usar OSA Andes.

          Tus Datos para acceder a la aplicación son:
          Usuario: ${newUser.email}
          Contraseña ${password}
          En caso de dudas o consultas puedes contactarte asoporte@osacontrol.com o a nuestro twitter @TaskforceOSA.

          © 2020 OSA SpA. All rights reserved.`,
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
        io.to(`user-list-${team}`).emit('REFRESH', {
          update: true,
          updatedBy: req.user._id
        });
        res.status(201).json({
          message: 'Usuario agregado satisfactoriamente.',
          user: newUser
        });
      }
    } catch (e) {
      /* istanbul ignore next  */
      res.status(500).json(e);
    }
  }

  public async apiUpdateUser(req: IRequest, res: Response): Promise<any> {
    /* istanbul ignore next  */
    if (!req.user.hasPermission('changeUser')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    const {id} = req.params;
    const {team} = req.user;
    const {firstName, lastName, email, venue, venuesAccess, userPermissions, userForms, preferred, company, isAdmin} = req.body;
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
        let updateItems: any = {
          firstName,
          lastName,
          company,
          preferred,
          userForms: userForms && userForms.length ? userForms.map((userForm: IForm) => userForm._id) : [],
          venue,
          venuesAccess
        };
        if (req.user.isAdmin && [true, false].includes(isAdmin)) {
          updateItems.userPermissions = userPermissions && userPermissions.length ? userPermissions.map((userPermission: IPermission) => userPermission._id) : [];
          updateItems.isAdmin = isAdmin;
        }
        let user = await User
          .findOneAndUpdate({
            _id: id, team
          }, updateItems, {
            new: true
          })
          .populate([{
            path: 'company',
            select: ['name']
          }, {
            path: 'venue',
            select: ['name', 'active']
          }, {
            path: 'venuesAccess',
            select: ['name'],
            populate: [{
              path: 'company',
              select: ['name']
            }]
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
          if (user && user.password) {
            delete user.password;
          }

          const response = {
            message: 'Usuario editado satisfactoriamente.',
            user
          };
          io.to(`user-list-${team}`).emit('REFRESH', {
            update: true,
            updatedBy: req.user._id
          });
          res.status(200).json(response);
        } else {
          const response = {
            id,
            message: 'Usuario no encontrado'
          };
          res.status(200).json(response);
        }
      }
    } catch (e) {
      /* istanbul ignore next  */
      console.log(e);
      /* istanbul ignore next  */
      res.status(500).json(e);
    }
  }

  public async apiDeleteUser(req: IRequest, res: Response): Promise<any> {
    if (!req.user.hasPermission('deleteUser')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    const {team} = req.user;
    const {id} = req.params;
    // const company = req.user.company;
    try {
      const user = await User.findOneAndRemove({_id: id, team});
      if (user) {
        const response = {
          message: 'Usuario eliminado satisfactoriamente.',
          id: user._id
        };
        io.to(`user-list-${team}`).emit('REFRESH', {
          update: true,
          updatedBy: req.user._id
        });
        res.status(200).json(response);
      } else {
        const response = {
          id,
          message: 'Este usuario ya fue eliminado.'
        };
        res.status(200).json(response);
      }
    } catch (e) {
      /* istanbul ignore next  */
      res.status(500).json(e);
    }
  }

  public async apiChangePasswordUser(req: IRequest, res: Response): Promise<any> {
    const {user, password} = req.body;
    const {team} = req.user;
    if (!req.user.hasPermission('changeUser')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    try {
      if (password && password.length >= 6) {
        const affectedUser = await User.findOne({_id: user, team});
        if (affectedUser) {
          affectedUser.password = password;
          affectedUser.save();
          res.status(200).json({
            message: 'Contraseña cambiada satisfactoriamente.',
            status: 200
          });
        } else {
          res.status(400).json({
            message: 'No se ha podido cambiar la contraseña',
            status: 400
          });
        }
      } else {
        res.status(400).json({
          message: 'La contraseña no cumple los requisitos mínimos.',
          status: 400
        });
      }
    } catch (e) {
      /* istanbul ignore next  */
      res.status(500).json(e);
    }
  }

  private getUsers(filter: any, options: PaginateOptions, search?: string): Promise<PaginateResult<IUserModel>> {
    if (search && search.length) {
      const searchText = new RegExp(search, 'i');
      filter = {
        $and: [{
          $or: [{
            firstName: {$regex: searchText}
          }, {
            lastName: {$regex: searchText}
          }]
        }, filter]
      };
    }
    return new Promise((resolve, reject) => {
      User.paginate(filter, options, (err, result) => {
        /* istanbul ignore next  */
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new AdminUsersController();
