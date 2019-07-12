"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jsonwebtoken");
const moment = require("moment-timezone");
const uuid = require("uuid");
const app_1 = require("../../app");
const participant_model_1 = require("../../form/models/participant.model");
const logger_service_1 = require("../../services/logger.service");
const general_utils_1 = require("../../utils/general.utils");
const user_model_1 = require("../models/user.model");
const user_model_2 = require("../models/user.model");
class JWTController {
    constructor() {
        this.androidVersion = '2.3.7';
        this.iosVersion = '1.4.0';
        this.login = this.login.bind(this);
        this.token = this.token.bind(this);
        // this.isJWTAuthenticated = this.isJWTAuthenticated.bind(this);
        this.forgotPassword = this.forgotPassword.bind(this);
    }
    login(req, res) {
        logger_service_1.default.info(`login: {username: ${req.body.username}`);
        if (req.body.username === null || req.body.username === undefined || req.body.password === null || req.body.password === undefined) {
            logger_service_1.default.error(`login: Authentication failed. Invalid user or password.`);
            res.status(401).json({ message: 'Authentication failed. Invalid user or password.' });
        }
        else {
            user_model_1.default
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
                .exec((err, user) => {
                if (err) {
                    /* istanbul ignore next */
                    res.status(500).send(err);
                }
                if (!user || !user.comparePasswordSync(req.body.password)) {
                    logger_service_1.default.error(`login: Authentication failed. Invalid user or password.`);
                    res.status(401).json({
                        message: 'Authentication failed. Invalid user or password.',
                        status: 401
                    });
                }
                else if (!user.active) {
                    logger_service_1.default.error(`login: User is inactive`);
                    res.status(401).json({
                        message: 'User is inactive',
                        status: 401
                    });
                }
                else {
                    user.lastLogin = new Date();
                    user.save((err) => {
                        if (err) {
                            /* istanbul ignore next */
                            res.status(500).json(err);
                        }
                        else {
                            const today = moment().startOf('day');
                            const tomorrow = moment(today).add(1, 'days');
                            participant_model_1.default.count({
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
                                        _id: general_utils_1.default.getObjectProperty(user.venue, '_id', null),
                                        name: general_utils_1.default.getObjectProperty(user.venue, 'name', null)
                                    },
                                    company: {
                                        _id: general_utils_1.default.getObjectProperty(user.company, '_id', null),
                                        name: general_utils_1.default.getObjectProperty(user.company, 'name', null)
                                    },
                                    team: {
                                        _id: general_utils_1.default.getObjectProperty(user.team, '_id', null),
                                        name: general_utils_1.default.getObjectProperty(user.team, 'name', null)
                                    },
                                    count
                                };
                                res.json({
                                    data: {
                                        token: jwt.sign(userInfo, req.app.locals.secretKey, {
                                            expiresIn: '7 days'
                                        }),
                                        // token: jwt.sign(userInfo, req.app.locals.secretKey, {
                                        //   expiresIn: '60 seconds'
                                        // }),
                                        refreshToken: jwt.sign(userInfo, req.app.locals.secretKey, {
                                            expiresIn: '30 days'
                                        }),
                                        iosVersion: this.iosVersion,
                                        androidVersion: this.androidVersion,
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
    token(req, res) {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            logger_service_1.default.error(`token: refresh token is required`);
            logger_service_1.default.error(`{body: ${req.body}, headers: ${JSON.stringify(req.headers)}}`);
            res.status(400).json({
                message: 'refresh token is required',
                status: 400
            });
        }
        else {
            jwt.verify(refreshToken, req.app.locals.secretKey, (err, decode) => {
                if (err) {
                    logger_service_1.default.error(`token: JWT error`);
                    logger_service_1.default.error(`{body: ${req.body}, headers: ${JSON.stringify(req.headers)}}`);
                    res.status(401).json({
                        message: err.message,
                        status: 401
                    });
                }
                else {
                    user_model_1.default
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
                        .exec((err, user) => {
                        if (err) {
                            /* istanbul ignore next */
                            res.status(500).json(err);
                        }
                        else if (!user) {
                            logger_service_1.default.error(`token: User not found`);
                            res.status(401).json({
                                message: 'User not found',
                                status: 401
                            });
                        }
                        else if (!user.active) {
                            logger_service_1.default.error(`token: User is inactive`);
                            res.status(401).json({
                                message: 'User is inactive',
                                status: 401
                            });
                        }
                        else {
                            user.lastLogin = new Date();
                            user.save((err) => {
                                if (err) {
                                    logger_service_1.default.error(`token: Save user`);
                                    /* istanbul ignore next */
                                    res.status(500).json(err);
                                }
                                else {
                                    const today = moment().startOf('day');
                                    const tomorrow = moment(today).add(1, 'days');
                                    participant_model_1.default.count({
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
                                                _id: general_utils_1.default.getObjectProperty(user.venue, '_id', null),
                                                name: general_utils_1.default.getObjectProperty(user.venue, 'name', null)
                                            },
                                            company: {
                                                _id: general_utils_1.default.getObjectProperty(user.company, '_id', null),
                                                name: general_utils_1.default.getObjectProperty(user.company, 'name', null)
                                            },
                                            team: {
                                                _id: general_utils_1.default.getObjectProperty(user.team, '_id', null),
                                                name: general_utils_1.default.getObjectProperty(user.team, 'name', null)
                                            },
                                            count
                                        };
                                        res.json({
                                            data: {
                                                token: jwt.sign(userInfo, req.app.locals.secretKey, {
                                                    expiresIn: '7 days'
                                                }),
                                                refreshToken: jwt.sign(userInfo, req.app.locals.secretKey, {
                                                    expiresIn: '30 days'
                                                }),
                                                iosVersion: this.iosVersion,
                                                androidVersion: this.androidVersion,
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
    async forgotPassword(req, res) {
        const { username } = req.body;
        try {
            const user = await user_model_2.default.findOne({ email: username });
            if (user) {
                const token = uuid.v4();
                const fullname = user.fullName();
                app_1.queue.create('email', {
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

            © 2019 OSA SpA. Todos los derechos reservados.`,
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
                if (app_1.default.get('env') !== 'testing') {
                    console.log('Se ha reestablecido ', username);
                }
                res.json({
                    message: 'Se ha enviado un e-mail para reestablecer tú contraseña',
                    status: 200
                });
            }
            else {
                /* istanbul ignore next */
                if (app_1.default.get('env') !== 'testing') {
                    console.log('No se encontro ', username);
                }
                res.json({
                    message: 'Se ha enviado un e-mail para reestablecer tú contraseña',
                    status: 200
                });
            }
        }
        catch (e) {
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
    // public isJWTAuthenticated(req: IRequest, res: Response, next: NextFunction) {
    //   if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'JWT') {
    //     jwt.verify(req.headers.authorization.split(' ')[1], req.app.locals.secretKey, (err: any, decode: any) => {
    //       if (err) {
    //         res.status(401).json({
    //           message: err.message,
    //           status: 401
    //         });
    //       }
    //       req.user = decode;
    //       next();
    //     });
    //   } else {
    //     res.status(403).json({
    //       message: 'Forbidden',
    //       status: 403
    //     });
    //     next();
    //   }
    // }
    /* istanbul ignore next */
    test(req, res) {
        res.json({
            data: {
                user: req.user
            },
            status: 200
        });
    }
}
exports.default = new JWTController();
//# sourceMappingURL=jwt.controller.js.map