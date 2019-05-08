"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jsonwebtoken");
const logger_service_1 = require("../services/logger.service");
// import User from "../app/models/user.model";
class Middlewares {
    constructor() {
        this.isLoggedIn = this.isLoggedIn.bind(this);
        this.isJWTAuthenticated = this.isJWTAuthenticated.bind(this);
    }
    async isLoggedIn(req, res, next) {
        // if user is authenticated in the session, carry on
        /* istanbul ignore else */
        if (req.isAuthenticated()) {
            /* istanbul ignore else */
            if (req.user) {
                res.locals.user = await req.user;
            }
            else {
                res.locals.user = null;
            }
            return next();
        }
        else {
            // if they aren't redirect them to the login page
            res.redirect('/account/login/');
        }
    }
    async context(req, res, next) {
        req.context = {};
        return next();
    }
    isJWTAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            /* istanbul ignore else */
            if (req.user) {
                res.locals.user = req.user;
            }
            else {
                res.locals.user = null;
            }
            return next();
        }
        else if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'JWT') {
            jwt.verify(req.headers.authorization.split(' ')[1], req.app.locals.secretKey, (err, decode) => {
                /* istanbul ignore if */
                if (err) {
                    logger_service_1.default.error(`isJWTAuthenticated error: ${err.message} ${JSON.stringify(req.headers)}`);
                    res.status(401).json({
                        error: err.message,
                        status: 401
                    });
                }
                else {
                    req.user = decode;
                    next();
                }
            });
        }
        else {
            logger_service_1.default.error(`isJWTAuthenticated error: Debes estar autenticado para este recurso. ${JSON.stringify(req.headers)}`);
            /* istanbul ignore next */
            res.status(401).json({
                error: 'Debes estar autenticado para este recurso.',
                status: 401
            });
        }
    }
    cleanStaticFiles(req, res, next) {
        req.url = req.url.replace(/\/([^\/]+)\.[0-9a-f]+\.(css|js|jpg|png|gif|svg|ico)$/, '/$1.$2');
        next();
    }
}
exports.default = new Middlewares();
//# sourceMappingURL=middlewares.js.map