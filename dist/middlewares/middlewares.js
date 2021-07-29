"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jsonwebtoken");
const logger_service_1 = require("../services/logger.service");
const user_model_1 = require("../app/models/user.model");
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
        const { headers, app } = req;
        let { user } = req;
        if (req.isAuthenticated()) {
            /* istanbul ignore else */
            if (user) {
                res.locals.user = user;
            }
            else {
                res.locals.user = null;
            }
            return next();
        }
        else if (headers && headers.authorization && headers.authorization.split(' ')[0] === 'JWT') {
            jwt.verify(headers.authorization.split(' ')[1], app.locals.secretKey, async (err, decode) => {
                /* istanbul ignore if */
                if (err) {
                    logger_service_1.default.error(`isJWTAuthenticated error: ${err.message} ${JSON.stringify(headers)}`);
                    res.status(401).json({
                        error: err.message,
                        status: 401
                    });
                }
                else {
                    await this.addUserToRequest(req, decode._id);
                    next();
                }
            });
        }
        else {
            logger_service_1.default.error(`isJWTAuthenticated error: Debes estar autenticado para este recurso. ${JSON.stringify(headers)}`);
            /* istanbul ignore next */
            res.status(401).json({
                error: 'Debes estar autenticado para este recurso.',
                status: 401
            });
        }
    }
    async addUserToRequest(req, userId) {
        req.user = await user_model_1.default.findById(userId, {
            _id: true,
            firstName: true,
            lastName: true,
            isAdmin: true,
            email: true,
            preferred: true,
            venuesAccess: true
        }).populate([{
                path: 'userPermissions',
                select: ['codeName']
            }, {
                path: 'userForms',
                select: ['name']
            }, {
                path: 'venue',
                select: ['name']
            }, {
                path: 'company',
                select: ['name', "iFrameURL"]
            }, {
                path: 'team',
                select: ['name']
            }]);
    }
    cleanStaticFiles(req, res, next) {
        req.url = req.url.replace(/\/([^\/]+)\.[0-9a-f]+\.(css|js|jpg|png|gif|svg|ico)$/, '/$1.$2');
        next();
    }
    validateBody(resourceSchema) {
        return async (req, res, next) => {
            const resource = req.body;
            try {
                req.body = await resourceSchema.validate(resource, {
                    stripUnknown: true
                });
                next();
            }
            catch (e) {
                console.error(e);
                res.status(400).json({ error: e.errors.join(', ') });
            }
        };
    }
}
exports.default = new Middlewares();
//# sourceMappingURL=middlewares.js.map