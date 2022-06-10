import { NextFunction, Request, Response } from 'express';
import * as GraphicsMagick from 'gm';
import * as isuuid from 'is-uuid';
import * as moment from 'moment';
// import * as Raven from 'raven';
import * as uuid from 'uuid';
import { queue } from '../../app';
import { passport } from '../../passportConfig';

import { IRequest } from '../../interfaces/global.interface';
import logger from '../../services/logger.service';
import redisClient from '../../services/redis.service';
import GeneralUtils from '../../utils/general.utils';
import RecoverFile from '../models/recoverFile.model';
import UserModel, { User } from '../models/user.model';

class AppController {

  constructor() {
    this.index = this.index.bind(this);
    this.healthCheck = this.healthCheck.bind(this);
    this.robots = this.robots.bind(this);

    this.login = this.login.bind(this);
    this.processLogin = this.processLogin.bind(this);

    this.processLoginSoo = this.processLoginSoo.bind(this);

    this.forgotPassword = this.forgotPassword.bind(this);
    this.processForgotPassword = this.processForgotPassword.bind(this);

    this.recovery = this.recovery.bind(this);
    this.processRecovery = this.processRecovery.bind(this);

    this.logout = this.logout.bind(this);
    this.recoverFile = this.recoverFile.bind(this);
  }

  /* istanbul ignore next */
  public index(req: Request, res: Response): void {
    res.render('app/index');
  }

  public healthCheck(req: Request, res: Response): void {
    res.json({ status: 'success' });
  }

  public robots(req: Request, res: Response): void {
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.send(`User-agent: *\nAllow: /`);
  }

  public login(req: Request, res: Response): void {
    if (req.user) {
      return res.redirect('/');
    } else {
      return res.render('app/login');
    }
  }

  public processLoginSoo(req: IRequest, res: Response, next: NextFunction): void {
    passport.authenticate('multy-saml', (err, user) => {
      /* istanbul ignore if */
      if (err) {
        console.log(err);
        return next(err); // will generate a 500 error
      }
      req.logIn(user, (loginErr) => {
        const redirectTo = (req.session as any).redirectTo;
        /* istanbul ignore if */
        if (loginErr) {
          return next(loginErr);
        } else {
          user.lastLogin = new Date();
          user.save(async (err: any) => {
            /* istanbul ignore if */
            if (err) {
              console.log(err); // handle errors!
            } else {
              try {
                user = await UserModel.findById(user._id).populate({
                  path: 'userPermissions',
                  select: ['codeName']
                });
                return res.redirect(redirectTo ?? '/');
              } catch (e) {
                console.log(err); // handle errors!
              }
            }
          });
        }
      });
    })(req, res, next);
  }

  public processLogin(req: IRequest, res: Response, next: NextFunction): void {
    /* istanbul ignore if */
    logger.info(`AppController.processLogin: session: ${JSON.stringify(req.session)}`);
    const redirectTo = (req.session as any).redirectTo;
    if (req.isAuthenticated() && req?.user) {
      logger.debug(`AppController.processLogin: user: ${JSON.stringify(req.user)} redirectTo: ${redirectTo}`);
       if (redirectTo?.length && !redirectTo.includes('logout') && !redirectTo.includes('undefined')) {
        delete (req.session as any).redirectTo;
        return res.redirect(redirectTo);
      } else {
        return res.redirect('/');
      }
    } else {
      const { username } = req.body;
      passport.authenticate('local', async (err, user) => {
        /* istanbul ignore if */
        if (err) {
          logger.debug(`AppController.processLogin.authenticate: Wrong username or password.`);
          logger.error(err);
          // return next(err); // will generate a 500 error
          return res.render('app/login', {
            username, error: 'Ha ocurrido un error.'
          });
        }
        /* istanbul ignore if */
        if (!user) {
          logger.debug(`AppController.processLogin.authenticate: User not found.`);
          return res.render('app/login', {
            username, error: 'Usuario o contraseña incorrecta.'
          });
        }
        req.login(user, async (loginErr) => {
          /* istanbul ignore if */
          if (loginErr) {
            logger.debug(`AppController.processLogin.authenticate: We could not authenticate.`);
            logger.error(loginErr);
            return res.render('app/login', {
              username, error: 'Usuario o contraseña incorrecta.'
            });
          } else {
            await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });
            try {
              user = await UserModel.findById(user._id).populate({
                path: 'userPermissions',
                select: ['codeName']
              });
              if (redirectTo?.length && !redirectTo.includes('logout') && !redirectTo.includes('undefined')) {
                logger.debug(`AppController.processLogin.login.redirectTo ${redirectTo}`);
                delete (req.session as any).redirectTo;
                return res.redirect(redirectTo);
              } else if (user.hasPermission('viewRequest')) {
                logger.debug(`AppController.processLogin.login.redirectTo /requests/vehicles/`);
                return res.redirect('/requests/vehicles/');
              } else if (user.hasPermission('viewInventory')) {
                logger.debug(`AppController.processLogin.login.redirectTo /inventory/`);
                return res.redirect('/inventory/');
              } else {
                logger.debug(`AppController.processLogin.login.redirectTo /cars/`);
                return res.redirect('/cars/');
              }
            } catch (e) {
              logger.debug(`AppController.processLogin.authenticate: Wrong username or password`);
              logger.error(e);
              return res.render('app/login', {
                username, error: 'Usuario o contraseña incorrecta.'
              });
            }
          }
        });
      })(req, res, next);
    }
  }


  public forgotPassword(req: Request, res: Response) {
    /* istanbul ignore if */
    if (req.user) {
      return res.redirect('/');
    } else {
      return res.render('app/forgotPassword', { csrfToken: req.csrfToken() });
    }
  }

  public async processForgotPassword(req: Request, res: Response) {
    const { username, _csrf } = req.body;
    /* istanbul ignore if */
    if (req.user) {
      return res.redirect('/');
    }
    try {
      // prevent duplicate request
      const csrfUsed = await (redisClient as any).getAsync(_csrf);
      /* istanbul ignore next */
      if (csrfUsed) {
        return res.redirect('/account/forgot-password/');
      }
      redisClient.set(_csrf, 'forgot-password', 'ex', 60 * 10);

      const user = await UserModel.findOne({ email: username });
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

            © 2021 OSA SpA. Todos los derechos reservados.`,
          view: 'account/forgotPassword',
          context: {
            fullname,
            url: `${process.env.SITE_URL}account/recovery/${token}/`
          }
        }).priority('high').attempts(5).save();
        user.passwordResetToken = token;
        user.passwordResetExpires = moment().add(2, 'days').toDate();
        user.save();
      }
    } catch (e) {
      /* istanbul ignore next */
      console.log(e);
    }
    return res.render('app/forgotPassword', {
      csrfToken: req.csrfToken(),
      post: username && username.length
    });
  }

  public async recovery(req: Request, res: Response) {
    const { token } = req.params;
    /* istanbul ignore next */
    if (!isuuid.anyNonNil(token)) {
      return res.status(404).render('404');
    }
    // close sesión
    req.logout();
    try {
      // validate link is valid
      const user = await UserModel
        .findOne({
          passwordResetToken: token
        });
      return res.render('app/recovery', {
        csrfToken: req.csrfToken(),
        user
      });
    } catch (e) {
      /* istanbul ignore next */
      console.log(e);
    }
  }

  public async processRecovery(req: Request, res: Response, next: NextFunction) {
    const { token } = req.params;
    const { password, password2 } = req.body;
    /* istanbul ignore next */
    if (!isuuid.anyNonNil(token)) {
      return res.status(404).render('404');
    }
    if (req.user) {
      return res.redirect(`/`);
    }
    /* istanbul ignore next */
    if (!password.trim().length || !password2.trim().length || password !== password2) {
      return res.redirect(`/account/recovery/${token}`);
    }
    try {
      const user = await UserModel.findOne({ passwordResetToken: token });
      /* istanbul ignore else */
      if (user && user.active) {
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        req.login(user, (loginErr) => {
          if (loginErr) {
            return next(loginErr);
          } else {
            user.lastLogin = new Date();
            user.save((err: any) => {
              if (err) {
                console.log(err); // handle errors!
              } else {
                return res.redirect('/');
              }
            });
          }
        });
      } else {
        return res.redirect(`/account/recovery/${token}`);
      }
    } catch (e) {
      /* istanbul ignore next */
      console.log(e);
    }
  }

  public logout(req: IRequest, res: Response) {
    logger.info(`AppController.logout ${req?.user?`${req.user.email} `: ''}from: ${req.header('Referrer') ?? 'system'}`);
    // (req.session as any).redirectTo = req.url;
    req.logout();
    return res.redirect('/account/login/');
  }

  public async recoverFile(req: IRequest, res: Response): Promise<any> {
    const { company, team } = req.user;
    const file: any = GeneralUtils.getFileFromRequest(req.files, 'file');
    if (file) {
      try {
        logger.info(`AppController.recoverFile email: ${req.user.email} file: ${JSON.stringify(file)}`);
        const recoverFile = new RecoverFile();
        /*
          {
            fieldname: 'file',
            originalname: 'Captura de pantalla 2018-06-28 a la(s) 11.59.58.png',
            encoding: '7bit',
            mimetype: 'image/png',
            destination: '/tmp/',
            filename: 'Captura de pantalla 2018-06-28 a la(s) 11.59.58.png',
            path: '/tmp/Captura de pantalla 2018-06-28 a la(s) 11.59.58.png',
            size: 794429
          }
        */
        // fix exif
        if (new RegExp('\\bimage\\b').test(file.mimetype)) {
          await this.autoRotate(file.path);
        }
        file.headers = {
          'Content-Type': file.mimetype
        };

        recoverFile.user = req.user._id;
        recoverFile.company = company._id;
        recoverFile.team = team._id;
        recoverFile.attach('file', file, async (error: any) => {
          if (error) {
            /* istanbul ignore next */
            return res.status(400).json(error);
          } else {
            await recoverFile.save();
            return res.status(201).json({
              data: {
                _id: recoverFile._id,
                file: recoverFile.file
              },
              status: 201
            });
          }
        });
      } catch (e) {
        // Raven.captureException(e, { req });
        /* istanbul ignore next */
        console.log(e);
        logger.error(`recover file error:`);
        /* istanbul ignore next */
        logger.error(e);
        /* istanbul ignore next */
        res.status(400).json(e);
      }

    } else {
      logger.error(`uploadFile: La imagen es obligatoria.`);
      res.status(400).json({
        message: 'La imagen es obligatoria.',
        status: 400
      });
    }
  }

  private autoRotate(path: string): Promise<any> {
    // doc http://aheckmann.github.io/gm/docs.html
    /**** REQUIRE: imagemagick and graphicsmagick *****
     brew install imagemagick
     brew install graphicsmagick
     * */
    return new Promise((resolve, reject) => {
      GraphicsMagick(path)
        .autoOrient()
        .write(path, (err) => {
          if (err) {
            /* istanbul ignore next */
            reject(err);
          } else {
            resolve({});
          }
        });
    });
  }
}

const appController = new AppController();
export default appController;

