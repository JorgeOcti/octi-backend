"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jsonwebtoken");
const user_model_1 = require("../models/user.model");
// import * as moment  from "moment-timezone";
class JWTController {
    constructor() {
        this.login = this.login.bind(this);
        this.token = this.token.bind(this);
        this.createUser = this.createUser.bind(this);
        this.isJWTAuthenticated = this.isJWTAuthenticated.bind(this);
    }
    createUser(req, res) {
        const { username, password, firstName, lastName } = req.body;
        if (username && username.length && password && password.length) {
            const newUser = new user_model_1.default({
                username,
                firstName,
                lastName,
                email: username,
                password,
                active: true
            });
            newUser.save((err, user) => {
                if (err) {
                    throw err;
                }
                console.log(JSON.stringify(user));
            });
            res.json({
                data: {
                    username
                },
                status: 200
            });
        }
        else {
            res.status(400).json({
                error: 'username and password are required',
                status: 400
            });
        }
    }
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
                username: true,
                email: true,
                lastName: true,
                password: true,
                updatedAt: true,
                active: true,
            })
                .exec((err, user) => {
                if (err) {
                    res.status(500).send(err);
                }
                if (!user || !user.comparePasswordSync(req.body.password)) {
                    res.status(401).json({
                        error: 'Authentication failed. Invalid user or password.',
                        status: 401
                    });
                }
                else if (!user.active) {
                    res.status(401).json({
                        error: 'User is inactive',
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
                            const userInfo = {
                                _id: user._id,
                                username: user.username,
                                email: user.email
                            };
                            res.json({
                                data: {
                                    // token: jwt.sign(userInfo, req.app.locals.secretKey, {
                                    //   expiresIn: '30 days'
                                    // }),
                                    token: jwt.sign(userInfo, req.app.locals.secretKey, {
                                        expiresIn: '60s'
                                    }),
                                    refreshToken: jwt.sign(userInfo, req.app.locals.secretKey, {
                                        expiresIn: '60 days'
                                    }),
                                    user: {
                                        _id: user._id,
                                        name: user.firstName,
                                        lastName: user.lastName,
                                        username: user.username,
                                    }
                                },
                                status: 200
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
                error: 'refresh token is required',
                status: 400
            });
        }
        else {
            jwt.verify(refreshToken, req.app.locals.secretKey, (err, decode) => {
                if (err) {
                    res.status(401).json({
                        error: err.message,
                        status: 401
                    });
                }
                else {
                    user_model_1.default
                        .findById(decode._id)
                        .exec((err, user) => {
                        if (err) {
                            res.status(500).json(err);
                        }
                        else if (!user.active) {
                            res.status(401).json({
                                error: 'User is inactive',
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
                                    const userInfo = {
                                        _id: user._id,
                                        username: user.username,
                                        email: user.email
                                    };
                                    res.json({
                                        data: {
                                            token: jwt.sign(userInfo, req.app.locals.secretKey, {
                                                expiresIn: '30 days'
                                            }),
                                            refreshToken: jwt.sign(userInfo, req.app.locals.secretKey, {
                                                expiresIn: '60 days'
                                            }),
                                            user: {
                                                _id: user._id,
                                                name: user.firstName,
                                                lastName: user.lastName,
                                                username: user.username,
                                            }
                                        },
                                        status: 200
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    }
    isJWTAuthenticated(req, res, next) {
        console.log('test');
        if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'JWT') {
            jwt.verify(req.headers.authorization.split(' ')[1], req.app.locals.secretKey, (err, decode) => {
                if (err) {
                    res.status(401).json({
                        error: err.message,
                        status: 401
                    });
                }
                req.user = decode;
                next();
            });
        }
        else {
            res.status(403).json({
                error: 'Forbidden',
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