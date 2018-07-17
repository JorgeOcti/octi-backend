"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jsonwebtoken");
const user_model_1 = require("../models/user.model");
const user_model_2 = require("../models/user.model");
const participant_model_1 = require("../../form/models/participant.model");
const moment = require("moment-timezone");
const uuid = require("uuid");
const app_1 = require("../../app");
class JWTController {
    constructor() {
        this.login = this.login.bind(this);
        this.token = this.token.bind(this);
        // this.createUser = this.createUser.bind(this);
        this.isJWTAuthenticated = this.isJWTAuthenticated.bind(this);
        this.forgotPassword = this.forgotPassword.bind(this);
    }
    // public createUser(req: Request, res: Response) {
    //   const {username, password, firstName, lastName} = req.body;
    //   if (username && username.length && password && password.length) {
    //     const newUser = new User({
    //       username,
    //       firstName,
    //       lastName,
    //       email: username,
    //       password,
    //       active: true
    //     });
    //     newUser.save((err, user: IUserModel) => {
    //       if (err) {
    //         throw err;
    //       }
    //       console.log(JSON.stringify(user));
    //     });
    //     res.json({
    //       data: {
    //         username
    //       },
    //       status: 200
    //     });
    //   } else {
    //     res.status(400).json({
    //       message: 'username and password are required',
    //       status: 400
    //     });
    //   }
    // }
    login(req, res) {
        if (req.body.username === null || req.body.username === undefined || req.body.password === null || req.body.password === undefined) {
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
                active: true,
            })
                .populate([{
                    path: 'venue',
                    select: ['name']
                }, {
                    path: 'company',
                    select: ['name']
                }])
                .exec((err, user) => {
                if (err) {
                    res.status(500).send(err);
                }
                if (!user || !user.comparePasswordSync(req.body.password)) {
                    res.status(401).json({
                        message: 'Authentication failed. Invalid user or password.',
                        status: 401
                    });
                }
                else if (!user.active) {
                    res.status(401).json({
                        message: 'User is inactive',
                        status: 401
                    });
                }
                else {
                    user.lastLogin = new Date();
                    user.save(function (err) {
                        if (err) {
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
                                const userInfo = {
                                    _id: user._id,
                                    firstName: user.firstName,
                                    lastName: user.lastName,
                                    email: user.email,
                                    preferred: user.preferred,
                                    venue: {
                                        _id: user.venue ? user.venue._id : null,
                                        name: user.venue ? user.venue.name : null
                                    },
                                    company: {
                                        _id: user.company ? user.company._id : null,
                                        name: user.company ? user.company.name : null
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
                                        user: userInfo,
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
            res.status(400).json({
                message: 'refresh token is required',
                status: 400
            });
        }
        else {
            jwt.verify(refreshToken, req.app.locals.secretKey, (err, decode) => {
                if (err) {
                    res.status(401).json({
                        message: err.message,
                        status: 401
                    });
                }
                else {
                    user_model_1.default
                        .findById(decode._id)
                        .populate([{
                            path: 'venue',
                            select: ['name']
                        }, {
                            path: 'company',
                            select: ['name']
                        }])
                        .exec((err, user) => {
                        if (err) {
                            res.status(500).json(err);
                        }
                        else if (!user.active) {
                            res.status(401).json({
                                message: 'User is inactive',
                                status: 401
                            });
                        }
                        else {
                            user.lastLogin = new Date();
                            user.save(function (err) {
                                if (err) {
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
                                        const userInfo = {
                                            _id: user._id,
                                            firstName: user.firstName,
                                            lastName: user.lastName,
                                            email: user.email,
                                            preferred: user.preferred,
                                            venue: {
                                                _id: user.venue ? user.venue._id : null,
                                                name: user.venue ? user.venue.name : null
                                            },
                                            company: {
                                                _id: user.company ? user.company._id : null,
                                                name: user.company ? user.company.name : null
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
    async forgotPassword(req, res, error) {
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
                console.log('Se ha reestablecido ', username);
                res.json({
                    message: 'Se ha enviado un e-mail para reestablecer tú contraseña',
                    status: 200
                });
            }
            else {
                console.log('No se encontro ', username);
                res.json({
                    message: 'Se ha enviado un e-mail para reestablecer tú contraseña',
                    status: 200
                });
            }
        }
        catch (e) {
            console.log(e);
            console.log('ocurrio un error ', username);
            res.json({
                message: 'Se ha enviado un e-mail para reestablecer tú contraseña',
                status: 200
            });
        }
    }
    isJWTAuthenticated(req, res, next) {
        console.log('test');
        if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'JWT') {
            //process.env.SECRET_KEY
            jwt.verify(req.headers.authorization.split(' ')[1], req.app.locals.secretKey, (err, decode) => {
                if (err) {
                    res.status(401).json({
                        message: err.message,
                        status: 401
                    });
                }
                req.user = decode;
                next();
            });
        }
        else {
            res.status(403).json({
                message: 'Forbidden',
                status: 403
            });
            next();
        }
    }
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