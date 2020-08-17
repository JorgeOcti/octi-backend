import {NextFunction, Request, Response} from 'express';
import * as isuuid from 'is-uuid';
import * as moment from 'moment';
import * as passport from 'passport';
import * as uuid from 'uuid';
import * as Raven from 'raven';
import * as GraphicsMagick from 'gm';
import {queue} from '../../app';
import redisClient from '../../services/redis.service';
import UserModel from '../models/user.model';
import GeneralUtils from "../../utils/general.utils";
import {IRequest} from "../../interfaces/global.interface";
import RecoverFile from "../models/recoverFile.model";
import logger from "../../services/logger.service";

class AppController {

  constructor() {
    this.index = this.index.bind(this);
    this.healthCheck = this.healthCheck.bind(this);
    this.robots = this.robots.bind(this);

    this.login = this.login.bind(this);
    this.processLogin = this.processLogin.bind(this);

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
    res.json({status: 'success'});
  }

  public robots(req: Request, res: Response): void {
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.send(`User-Agent: *\nDisallow: /`);
  }

  public login(req: Request, res: Response): void {
    if (req.user) {
      return res.redirect('/');
    } else {
      return res.render('app/login', {csrfToken: req.csrfToken()});
    }
  }

  public processLogin(req: Request, res: Response, next: NextFunction): void {
    /* istanbul ignore if */
    if (req.user) {
      return res.redirect('/');
    } else {
      const {username} = req.body;
      passport.authenticate('local', (err, user) => {
        /* istanbul ignore if */
        if (err) {
          return next(err); // will generate a 500 error
        }
        /* istanbul ignore if */
        if (!user) {
          return res.render('app/login', {
            username, error: 'Usuario o contraseña incorrecta.', csrfToken: req.csrfToken()
          });
        }
        req.login(user, (loginErr) => {
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
                  return res.redirect(user.hasPermission('viewInventory') ? '/inventory/' : '/');
                } catch (e) {
                  console.log(err); // handle errors!
                }
              }
            });
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
      return res.render('app/forgotPassword', {csrfToken: req.csrfToken()});
    }
  }

  public async processForgotPassword(req: Request, res: Response) {
    const {username, _csrf} = req.body;
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
      redisClient.set(_csrf, 'forgot-password', "ex", 60*10);

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

            © 2020 OSA SpA. Todos los derechos reservados.`,
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
    const {token} = req.params;
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
    const {token} = req.params;
    const {password, password2} = req.body;
    /* istanbul ignore next */
    if (!isuuid.anyNonNil(token)) {
      return res.status(404).render('404');
    }
    if (req.user) {
      return res.redirect( `/`);
    }
    /* istanbul ignore next */
    if (!password.trim().length || !password2.trim().length || password !== password2) {
      return res.redirect(`/account/recovery/${token}`);
    }
    try {
      const user = await UserModel.findOne({passwordResetToken: token});
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

  public logout(req: Request, res: Response) {
    req.logout();
    res.redirect('/account/login/');
  }

  public async recoverFile(req: IRequest, res: Response): Promise<any> {
    const company = req.user.company;
    const team = req.user.team;
    const file: any = GeneralUtils.getFileFromRequest(req.files, 'file');
    logger.info(`uploadFile`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, file: ${JSON.stringify(file)}}}`);
    if (file) {
      try {
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
            res.status(400).json(error);
          } else {
            await recoverFile.save();
            res.status(201).json({
              data: {
                _id: recoverFile._id,
                file: recoverFile.file
              },
              status: 201
            });
          }
        });
      } catch (e) {
        Raven.captureException(e, {req});
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

  private autoRotate(path: string) {
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
            resolve();
          }
        });
    });
  }
}

export default new AppController();
