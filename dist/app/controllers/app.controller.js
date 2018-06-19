"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const passport = require("passport");
class AppController {
    constructor() {
        this.index = this.index.bind(this);
        this.robots = this.robots.bind(this);
        this.login = this.login.bind(this);
        this.processLogin = this.processLogin.bind(this);
        this.forgotPassword = this.forgotPassword.bind(this);
        this.logout = this.logout.bind(this);
    }
    index(req, res) {
        // console.log(`${JSON.stringify(req.session.cookie)}--${req.session.cookie.maxAge / 1000}s `);
        res.render('app/index', { title: 'Hey', message: 'Hello there!' });
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
            return res.render('app/login', { local: res.locals });
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
                        user.lastLogin = Date.now();
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
            return res.render('app/forgotPassword', { local: res.locals });
        }
    }
    logout(req, res) {
        req.logout();
        res.redirect('/account/login/');
    }
}
exports.default = new AppController();
//# sourceMappingURL=app.controller.js.map