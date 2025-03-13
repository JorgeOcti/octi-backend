import * as jwt from 'jsonwebtoken';
import * as moment from 'moment-timezone';
import * as uuid from 'uuid';
import * as bcrypt from 'bcrypt';

import { Request, Response } from 'express';
import { default as User, default as UserModel } from '../models/user.model';

import GeneralUtils from '../../utils/general.utils';
import { IRequest } from '../../interfaces/global.interface';
import ParticipantModel from '../../form/models/participant.model';
import TeamSetting from '../models/teamSetting.model';
import Version from '../models/version.model';
import emailQueue from '../tasks/email.task';
import logger from '../../services/logger.service';
import path = require('path');

class JWTController {
  constructor() {
    this.login = this.login.bind(this);
    this.token = this.token.bind(this);
    // this.isJWTAuthenticated = this.isJWTAuthenticated.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
  }

  public async login(req: Request, res: Response): Promise<any> {
    logger.info(`login: {username: ${req.body.username}`);
    try {
      if (
        req.body.username === null ||
        req.body.username === undefined ||
        req.body.password === null ||
        req.body.password === undefined
      ) {
        logger.error(`login: Authentication failed. Invalid user or password.`);
        return res.status(401).json({
          message: 'Authentication failed. Invalid user or password.'
        });
      } else {
        const user = await User.findOne(
          {
            email: req.body.username
          },
          {
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
            active: true,
            isDriver: true,
            comparePasswordSync: true
          }
        ).populate([
          {
            path: 'venue',
            select: ['_id', 'name', 'lat', 'lng']
          },
          {
            path: 'team',
            select: ['_id', 'name']
          },
          {
            path: 'company',
            select: ['_id', 'name'],
            populate: {
              path: 'clientCompanies',
              select: ['_id', 'name']
            }
          },
          {
            path: 'userPermissions',
            select: ['_id', 'codeName']
          },
          {
            path: 'userForms',
            select: ['_id', 'name'],
            match: { active: true }
          }
        ]);

        if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
          logger.error(
            `login: Authentication failed. Invalid user or password.`
          );
          return res.status(401).json({
            message: 'Authentication failed. Invalid user or password.',
            status: 401
          });
        } else if (!user.active) {
          logger.error(`login: User is inactive`);
          return res.status(401).json({
            message: 'User is inactive',
            status: 401
          });
        } else {
          user.lastLogin = new Date();
          await user.save();
          const today = moment().startOf('day');
          const tomorrow = moment(today).add(1, 'days');
          const count = await ParticipantModel.find({
            user,
            createdAt: {
              $gte: today.toDate(),
              $lt: tomorrow.toDate()
            }
          }).countDocuments();
          const teamSettings = await TeamSetting.findOne({
            team: user.team
          }).lean();
          const version = await Version.findOne({}, ['ios', 'android', 'docks'], {
            sort: {
              createdAt: -1
            }
          });
          const userInfo = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            preferred: user.preferred,
            userPermissions: user.userPermissions,
            userForms: user.userForms,
            isDriver: user.isDriver || false,
            venue: user.venue,
            company: user.company,
            team: {
              _id: user.team._id,
              name: user.team.name,
              settings: {
                form: GeneralUtils.getObjectProperty(teamSettings!, 'form', {
                  vinMinCharacters: 17,
                  vinMaxCharacters: 17,
                  plateMinCharacters: 6,
                  plateMaxCharacters: 6
                }),
                helpNumber: GeneralUtils.getObjectProperty(
                  teamSettings!,
                  'helpPhones',
                  {
                    transmittal: ''
                  }
                ),
                inventory: GeneralUtils.getObjectProperty(
                  teamSettings!,
                  'inventory',
                  {}
                ),
                vocabulary: GeneralUtils.getObjectProperty(
                  teamSettings!,
                  'vocabulary',
                  {}
                )
              }
              // settings: GeneralUtils.getObjectProperty(user.team, 'settings', {})
            },
            count
          };
          return res.json({
            data: {
              token: jwt.sign({ _id: userInfo._id }, process.env.SECRET_KEY!, {
                expiresIn: '7 days'
              }),
              // token: jwt.sign(userInfo, req. process.env.SECRET_KEY!, {
              //   expiresIn: '60 seconds'
              // }),
              refreshToken: jwt.sign(
                { _id: userInfo._id },
                process.env.SECRET_KEY!,
                {
                  expiresIn: '30 days'
                }
              ),
              iosVersion: version!.ios,
              androidVersion: version!.android,
              user: userInfo,
              docks: version!.docks
            },
            status: 200
          });
        }
      }
    } catch (e) {
      console.error(e);
      return res
        .status(401)
        .json({ message: 'Authentication failed. Invalid user or password.' });
    }
  }

  public async token(req: Request, res: Response) {
    const { refreshToken } = req.body;
    try {
      const decode: any = jwt.verify(refreshToken, process.env.SECRET_KEY!);
      const user = await User.findById(decode._id, {
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
        active: true,
        isDriver: true,
        comparePasswordSync: true
      }).populate([
        {
          path: 'venue',
          select: ['name', 'lat', 'lng']
        },
        {
          path: 'team',
          select: ['name']
        },
        {
          path: 'company',
          select: ['name']
        },
        {
          path: 'userPermissions',
          select: ['codeName']
        },
        {
          path: 'userForms',
          select: ['name']
        }
      ]);
      if (!user || !user.active) {
        logger.error(`login: User is inactive`);
        return res.status(401).json({
          message: 'User is inactive',
          status: 401
        });
      } else {
        user.lastLogin = new Date();
        await user.save();
        const today = moment().startOf('day');
        const tomorrow = moment(today).add(1, 'days');
        const count = await ParticipantModel.find({
          user,
          createdAt: {
            $gte: today.toDate(),
            $lt: tomorrow.toDate()
          }
        }).countDocuments();
        const teamSettings = await TeamSetting.findOne({
          team: user.team
        }).lean();
        const version = await Version.findOne({}, ['ios', 'android', 'docks'], {
          sort: {
            createdAt: -1
          }
        });
        const userInfo = {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          preferred: user.preferred,
          userPermissions: user.userPermissions,
          userForms: user.userForms,
          isDriver: user.isDriver || false,
          venue: user.venue,
          company: user.company,
          team: {
            _id: user.team._id,
            name: user.team.name,
            settings: {
              form: GeneralUtils.getObjectProperty(teamSettings!, 'form', {
                vinMinCharacters: 17,
                vinMaxCharacters: 17,
                plateMinCharacters: 6,
                plateMaxCharacters: 6
              }),
              helpNumber: GeneralUtils.getObjectProperty(
                teamSettings!,
                'helpPhones',
                {
                  transmittal: ''
                }
              ),
              inventory: GeneralUtils.getObjectProperty(
                teamSettings!,
                'inventory',
                {}
              ),
              vocabulary: GeneralUtils.getObjectProperty(
                teamSettings!,
                'vocabulary',
                {}
              )
            }
            // settings: GeneralUtils.getObjectProperty(user.team, 'settings', {})
          },
          count
        };
        return res.json({
          data: {
            token: jwt.sign({ _id: userInfo._id }, process.env.SECRET_KEY!, {
              expiresIn: '7 days'
            }),
            // token: jwt.sign(userInfo, req. process.env.SECRET_KEY!, {
            //   expiresIn: '60 seconds'
            // }),
            refreshToken: jwt.sign(
              { _id: userInfo._id },
              process.env.SECRET_KEY!,
              {
                expiresIn: '30 days'
              }
            ),
            iosVersion: version!.ios,
            androidVersion: version!.android,
            docks: version!.docks,
            user: userInfo
          },
          status: 200
        });
      }
    } catch (e) {
      logger.error(`token: JWT error`);
      logger.error(
        `{body: ${req.body}, headers: ${JSON.stringify(req.headers)}}`
      );
      return res.status(401).json({
        message: e.message,
        status: 401
      });
    }
  }

  public async forgotPassword(req: Request, res: Response) {
    const { username } = req.body;
    try {
      const user = await UserModel.findOne({ email: username });
      if (user) {
        const token = uuid.v4();
        const fullname = user.fullName();
        emailQueue.queue.add(
          'email',
          {
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

            © 2021 OSA SpA. Todos los derechos reservados.`,
            view: 'account/forgotPassword',
            context: {
              fullname,
              url: `${process.env.SITE_URL}account/recovery/${token}/`
            }
          },
          { attempts: 3, backoff: 1000, removeOnComplete: true }
        );
        user.passwordResetToken = token;
        user.passwordResetExpires = moment().add(2, 'days').toDate();
        await user.save();
        /* istanbul ignore next */
        if (process.env.ENV !== 'testing') {
          console.log('Se ha reestablecido ', username);
        }
        res.json({
          message: 'Se ha enviado un e-mail para reestablecer tú contraseña',
          status: 200
        });
      } else {
        /* istanbul ignore next */
        if (process.env.ENV !== 'testing') {
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
