"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const passport = require("passport");
class AppController {
    constructor() {
        this.index = this.index.bind(this);
        this.login = this.login.bind(this);
        this.processLogin = this.processLogin.bind(this);
        this.logout = this.logout.bind(this);
    }
    index(req, res) {
        res.render('app/index', { title: 'Hey', message: 'Hello there!' });
    }
    login(req, res, error) {
        res.render('app/login');
    }
    processLogin(req, res, next) {
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
                    user.last_login = Date.now();
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
    logout(req, res) {
        req.logout();
        res.redirect('/');
    }
}
exports.default = new AppController();
//# sourceMappingURL=app.controller.js.map