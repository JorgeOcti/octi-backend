"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const passport = require("passport");
const uuid = require("uuid");
const redis_service_1 = require("../../services/redis.service");
const user_model_1 = require("../models/user.model");
const kue = require("kue");
const moment = require("moment");
const queue = kue.createQueue();
class AppController {
    constructor() {
        this.index = this.index.bind(this);
        this.robots = this.robots.bind(this);
        this.login = this.login.bind(this);
        this.processLogin = this.processLogin.bind(this);
        this.forgotPassword = this.forgotPassword.bind(this);
        this.processForgotPassword = this.processForgotPassword.bind(this);
        this.recovery = this.recovery.bind(this);
        this.processRecovery = this.processRecovery.bind(this);
        this.logout = this.logout.bind(this);
    }
    index(req, res) {
        res.render('app/index');
    }
    robots(req, res) {
        res.setHeader('content-type', 'text/plain; charset=utf-8');
        res.send(`User-Agent: *\nDisallow: /`);
    }
    login(req, res, error) {
        if (req.user) {
            return res.redirect('/');
        }
        else {
            return res.render('app/login', { csrfToken: req.csrfToken() });
        }
    }
    processLogin(req, res, next) {
        if (req.user) {
            return res.redirect('/');
        }
        else {
            passport.authenticate('local', (err, user, info) => {
                if (err) {
                    return next(err); // will generate a 500 error
                }
                if (!user) {
                    return res.render('app/login', { error: 'Usuario o contraseña incorrecta.' });
                }
                req.login(user, loginErr => {
                    if (loginErr) {
                        return next(loginErr);
                    }
                    else {
                        user.lastLogin = new Date;
                        user.save(function (err) {
                            if (err) {
                                console.log(err); // handle errors!
                            }
                            else {
                                return res.redirect('/');
                            }
                        });
                    }
                });
            })(req, res, next);
        }
    }
    forgotPassword(req, res, error) {
        if (req.user) {
            return res.redirect('/');
        }
        else {
            return res.render('app/forgotPassword', { csrfToken: req.csrfToken() });
        }
    }
    async processForgotPassword(req, res, error) {
        const { username, _csrf } = req.body;
        if (req.user) {
            return res.redirect('/');
        }
        try {
            // prevent duplicate request
            const csrfUsed = await redis_service_1.default.getAsync(_csrf);
            if (csrfUsed) {
                return res.redirect('/account/forgot-password/');
            }
            redis_service_1.default.setex(_csrf, 60 * 10, 'forgot-password');
            const user = await user_model_1.default.findOne({ email: username });
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
                user.save();
            }
        }
        catch (e) {
            console.log(e);
        }
        return res.render('app/forgotPassword', {
            csrfToken: req.csrfToken(),
            post: username && username.length
        });
    }
    async recovery(req, res) {
        const { token } = req.params;
        try {
            const user = await user_model_1.default.findOne({ passwordResetToken: token });
            console.log('user', user);
        }
        catch (e) {
            console.log(e);
        }
        return res.render('app/recovery', { csrfToken: req.csrfToken() });
    }
    async processRecovery(req, res, next) {
        const { token } = req.params;
        const { password, password2 } = req.body;
        // if (req.user) {
        //   return res.redirect( `/account/recovery/${token}`);
        // }
        if (!password.trim().length || !password2.trim().length || password !== password2) {
            return res.redirect(`/account/recovery/${token}`);
        }
        try {
            const user = await user_model_1.default.findOne({ passwordResetToken: token });
            console.log('user', user);
            console.log('password', password);
            console.log('password2', password2);
            if (user && user.active) {
                // user.password = password;
                // user.passwordResetToken = '';
                // user.save()
                req.login(user, loginErr => {
                    if (loginErr) {
                        return next(loginErr);
                    }
                    else {
                        user.lastLogin = new Date;
                        user.save(function (err) {
                            if (err) {
                                console.log(err); // handle errors!
                            }
                            else {
                                return res.redirect('/');
                            }
                        });
                    }
                });
            }
            else {
                return res.redirect(`/account/recovery/${token}`);
            }
        }
        catch (e) {
            console.log(e);
        }
    }
    logout(req, res) {
        req.logout();
        res.redirect('/account/login/');
    }
}
exports.default = new AppController();
//# sourceMappingURL=app.controller.js.map