import {NextFunction, Request, Response} from 'express';
import * as jwt from 'jsonwebtoken';
import * as moment from 'moment-timezone';
import * as uuid from 'uuid';
import app, {queue} from '../../app';
import ParticipantModel from '../../form/models/participant.model';
import {IRequest} from '../../interfaces/global.interface';
import GeneralUtils from '../../utils/general.utils';
import User from '../models/user.model';
import UserModel, {IUserModel} from '../models/user.model';

class JWTController {

  constructor() {
    this.login = this.login.bind(this);
    this.token = this.token.bind(this);
    this.isJWTAuthenticated = this.isJWTAuthenticated.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
  }

  public login(req: Request, res: Response) {
    if (req.body.username === null || req.body.username === undefined || req.body.password === null || req.body.password === undefined) {
      res.status(401).json({message: 'Authentication failed. Invalid user or password.'});
    } else {
      User
        .findOne({
          email: req.body.username
        }, {
          firstName: true,
          lastName: true,
          email: true,
          password: true,
          updatedAt: true,
          preferred: true,
          venue: true,
          team: true,
          company: true,
          userForms: true,
          userPermissions: true,
          active: true
        })
        .populate([{
          path: 'venue',
          select: ['name']
        }, {
          path: 'team',
          select: ['name']
        }, {
          path: 'company',
          select: ['name']
        }, {
          path: 'userPermissions',
          select: ['codeName']
        }, {
          path: 'userForms',
          select: ['name']
        }])
        .exec((err, user: IUserModel) => {
          if (err) {
            /* istanbul ignore next */
            res.status(500).send(err);
          }
          if (!user || !user.comparePasswordSync(req.body.password)) {
            res.status(401).json({
              message: 'Authentication failed. Invalid user or password.',
              status: 401
            });
          } else if (!user.active) {
            res.status(401).json({
              message: 'User is inactive',
              status: 401
            });
          } else {
            user.lastLogin = new Date();
            user.save((err: any) => {
              if (err) {
                /* istanbul ignore next */
                res.status(500).json(err);
              } else {
                const today = moment().startOf('day');
                const tomorrow = moment(today).add(1, 'days');
                ParticipantModel.count({
                  user,
                  createdAt: {
                    $gte: today.toDate(),
                    $lt: tomorrow.toDate()
                  }
                }, (err, count) => {
                  user = user.toObject();
                  const userInfo = {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    preferred: user.preferred,
                    userPermissions: user.userPermissions,
                    userForms: user.userForms,
                    venue: {
                      _id: GeneralUtils.getObjectAttribute(user.venue, '_id', null),
                      name: GeneralUtils.getObjectAttribute(user.venue, 'name', null)
                    },
                    company: {
                      _id: GeneralUtils.getObjectAttribute(user.company, '_id', null),
                      name: GeneralUtils.getObjectAttribute(user.company, 'name', null)
                    },
                    team: {
                      _id: GeneralUtils.getObjectAttribute(user.team, '_id', null),
                      name: GeneralUtils.getObjectAttribute(user.team, 'name', null)
                    },
                    count
                  };
                  res.json({
                    data: {
                      token: jwt.sign(userInfo, req.app.locals.secretKey, {
                        expiresIn: '30 days'
                      }),
                      // token: jwt.sign(userInfo, req.app.locals.secretKey, {
                      //   expiresIn: '60 seconds'
                      // }),
                      refreshToken: jwt.sign(userInfo, req.app.locals.secretKey, {
                        expiresIn: '60 days'
                      }),
                      iosVersion: '1.4.0',
                      androidVersion: '1.4.0',
                      user: userInfo
                    },
                    status: 200
                  });
                });
              }
            });
          }
        });
    }
  }

  public token(req: Request, res: Response) {
    const {refreshToken} = req.body;
    if (!refreshToken) {
      res.status(400).json({
        message: 'refresh token is required',
        status: 400
      });
    } else {
      jwt.verify(refreshToken, req.app.locals.secretKey, (err: any, decode: any) => {
        if (err) {
          res.status(401).json({
            message: err.message,
            status: 401
          });
        } else {
          User
            .findById(decode._id, {
              firstName: true,
              lastName: true,
              email: true,
              password: true,
              updatedAt: true,
              preferred: true,
              venue: true,
              company: true,
              team: true,
              userForms: true,
              userPermissions: true,
              active: true
            })
            .populate([{
              path: 'venue',
              select: ['name']
            }, {
              path: 'company',
              select: ['name']
            }, {
              path: 'team',
              select: ['name']
            }, {
              path: 'userPermissions',
              select: ['codeName']
            }, {
              path: 'userForms',
              select: ['name']
            }])
            .exec((err, user: IUserModel) => {
              if (err) {
                /* istanbul ignore next */
                res.status(500).json(err);
              } else if (!user) {
                res.status(401).json({
                  message: 'User not found',
                  status: 401
                });
              } else if (!user.active) {
                res.status(401).json({
                  message: 'User is inactive',
                  status: 401
                });
              } else {
                user.lastLogin = new Date();
                user.save( (err: any) => {
                  if (err) {
                    /* istanbul ignore next */
                    res.status(500).json(err);
                  } else {
                    const today = moment().startOf('day');
                    const tomorrow = moment(today).add(1, 'days');
                    ParticipantModel.count({
                      user,
                      createdAt: {
                        $gte: today.toDate(),
                        $lt: tomorrow.toDate()
                      }
                    }, (err, count) => {
                      user = user.toObject();
                      const userInfo = {
                        _id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        preferred: user.preferred,
                        userPermissions: user.userPermissions,
                        userForms: user.userForms,
                        venue: {
                          _id: GeneralUtils.getObjectAttribute(user.venue, '_id', null),
                          name: GeneralUtils.getObjectAttribute(user.venue, 'name', null)
                        },
                        company: {
                          _id: GeneralUtils.getObjectAttribute(user.company, '_id', null),
                          name: GeneralUtils.getObjectAttribute(user.company, 'name', null)
                        },
                        team: {
                          _id: GeneralUtils.getObjectAttribute(user.team, '_id', null),
                          name: GeneralUtils.getObjectAttribute(user.team, 'name', null)
                        },
                        count
                      };
                      res.json({
                        data: {
                          token: jwt.sign(userInfo, req.app.locals.secretKey, {
                            expiresIn: '30 days'
                          }),
                          refreshToken: jwt.sign(userInfo, req.app.locals.secretKey, {
                            expiresIn: '60 days'
                          }),
                          iosVersion: '1.4.1',
                          androidVersion: '1.4.0',
                          user: userInfo
                        },
                        status: 200
                      });
                    });
                  }
                });
              }
            });
        }
      });

    }
  }

  public async forgotPassword(req: Request, res: Response) {
    const {username} = req.body;
    try {
      const user = await UserModel.findOne({email: username});
      if (user) {
        const token = uuid.v4();
        const fullname = user.fullName();
        queue.create('email', {
          from: '',
          title: `Recovery password for ${fullname}`,
          to: `"${fullname}"<${user.email}>`,
          subject: `Recuperación de tu cuenta en OSA Andes`,
          text: `Hola ${fullname}

            Recibimos una solicitud para restablecer tu contraseña.

            Haz clic aquí para cambiar tu contraseña.
            ${process.env.SITE_URL}account/recovery/${token}/

            ¿No solicitaste este cambio?
            Puedes contactarte con nosotros a través de soporte@osacontrol.com.

            © 2018 OSA SpA. Todos los derechos reservados.`,
          view: 'account/forgotPassword',
          context: {
            fullname,
            url: `${process.env.SITE_URL}account/recovery/${token}/`
          }
        }).priority('high').attempts(5).save();
        user.passwordResetToken = token;
        user.passwordResetExpires = moment().add(2, 'days').toDate();
        await user.save();
        /* istanbul ignore next */
        if (app.get('env') !== 'testing') {
          console.log('Se ha reestablecido ', username);
        }
        res.json({
          message: 'Se ha enviado un e-mail para reestablecer tú contraseña',
          status: 200
        });
      } else {
        /* istanbul ignore next */
        if (app.get('env') !== 'testing') {
          console.log('No se encontro ', username);
        }
        res.json({
          message: 'Se ha enviado un e-mail para reestablecer tú contraseña',
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      console.log(e);
      /* istanbul ignore next */
      console.log('ocurrio un error ', username);
      /* istanbul ignore next */
      res.json({
          message: 'Se ha enviado un e-mail para reestablecer tú contraseña',
          status: 200
        });
    }
  }

  /* istanbul ignore next */
  public isJWTAuthenticated(req: IRequest, res: Response, next: NextFunction) {
    console.log('test');
    if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'JWT') {
      jwt.verify(req.headers.authorization.split(' ')[1], req.app.locals.secretKey, (err: any, decode: any) => {
        if (err) {
          res.status(401).json({
            message: err.message,
            status: 401
          });
        }
        req.user = decode;
        next();
      });
    } else {
      res.status(403).json({
        message: 'Forbidden',
        status: 403
      });
      next();
    }
  }

  /* istanbul ignore next */
  public test(req: IRequest, res: Response) {
    res.json({
      data: {
        user: req.user
      },
      status: 200
    });
  }
}

export default new JWTController();
