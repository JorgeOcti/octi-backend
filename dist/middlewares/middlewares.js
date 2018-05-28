"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jsonwebtoken");
class Middlewares {
    constructor() {
        this.isLoggedIn = this.isLoggedIn.bind(this);
        this.isJWTAuthenticated = this.isJWTAuthenticated.bind(this);
    }
    isLoggedIn(req, res, next) {
        // if user is authenticated in the session, carry on
        if (req.isAuthenticated()) {
            if (req.user) {
                res.locals.user = req.user;
            }
            else {
                res.locals.user = null;
            }
            return next();
        }
        else {
            res.redirect('/account/login/');
        }
        // if they aren't redirect them to the home page
    }
    isJWTAuthenticated(req, res, next) {
        if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'JWT') {
            jwt.verify(req.headers.authorization.split(' ')[1], req.app.locals.secretKey, (err, decode) => {
                if (err) {
                    res.status(400).json({
                        error: err.message,
                        status: 400
                    });
                }
                req.user = decode;
                next();
            });
        }
        else {
            // res.status(403).json({
            //   error: 'Forbidden',
            //   status: 403
            // });
            next();
        }
    }
    cleanStaticFiles(req, res, next) {
        req.url = req.url.replace(/\/([^\/]+)\.[0-9a-f]+\.(css|js|jpg|png|gif|svg)$/, '/$1.$2');
        next();
    }
}
exports.default = new Middlewares();
//# sourceMappingURL=middlewares.js.map