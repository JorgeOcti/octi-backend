"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt = require("bcrypt");
const logger_service_1 = require("../../services/logger.service");
const user_model_1 = require("../models/user.model");
const venue_model_1 = require("../models/venue.model");
const push_service_1 = require("../../services/push.service");
const user_model_2 = require("../models/user.model");
class UserController {
    constructor() {
        this.apiChangePassword = this.apiChangePassword.bind(this);
        this.apiListVenues = this.apiListVenues.bind(this);
        this.apiListDrivers = this.apiListDrivers.bind(this);
        this.getUsers = this.getUsers.bind(this);
        this.apiChangeVenue = this.apiChangeVenue.bind(this);
    }
    async apiListDrivers(req, res) {
        logger_service_1.default.info(`UserController.apiListDrivers`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
        const team = req.user.team._id;
        const { page, pageSize, } = req.query;
        // paginate options
        const options = {
            sort: {
                firstName: 1
            },
            select: {
                firstName: true,
                lastName: true,
                email: true,
                venue: true
            },
            populate: [{
                    path: 'company',
                    select: ['name']
                }, {
                    path: 'venue',
                    select: ['name']
                }],
            page: parseInt(page ? page : '1', 10),
            limit: parseInt(pageSize ? pageSize : '200', 10)
        };
        const filter = {
            team,
            isDriver: true
        };
        try {
            const drivers = await this.getUsers(filter, options);
            /* istanbul ignore if  */
            if (options.page && drivers.pages && drivers.pages < options.page) {
                res.status(400).json({
                    message: 'La página solicitada no existe.',
                    status: 400
                });
            }
            else {
                res.json({
                    count: drivers.total,
                    pages: drivers.pages,
                    hasPrevious: options.page && options.page > 1 && drivers.pages && drivers.pages >= options.page,
                    hasNext: options.page && drivers.pages && drivers.pages > options.page,
                    results: drivers.docs,
                    status: 200
                });
            }
        }
        catch (e) {
            /* istanbul ignore next */
            logger_service_1.default.error(`UserController.apiListDrivers: Async Error.`);
            /* istanbul ignore next */
            logger_service_1.default.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
            res.status(500).json(e);
        }
    }
    async apiChangePassword(req, res) {
        const user = req.user;
        const { password, newPassword } = req.body;
        if (password && password.trim().length && newPassword && newPassword.trim().length) {
            try {
                const User = await user_model_1.default.findById(user._id);
                if (User) {
                    const isPassword = bcrypt.compareSync(password, User.password);
                    if (isPassword) {
                        User.password = newPassword;
                        User.save();
                        res.status(200).json({
                            message: 'Contraseña cambiada satisfactoriamente.',
                            status: 200
                        });
                    }
                    else {
                        res.status(400).json({
                            message: 'El password actual no corresponde',
                            status: 400
                        });
                    }
                }
            }
            catch (e) {
                /* istanbul ignore next */
                res.status(400).json({
                    message: 'Ha ocurrido un error',
                    status: 400
                });
            }
        }
        else {
            /* istanbul ignore next */
            res.status(400).json({
                message: 'No se ha podido cambiar la contraseña',
                status: 400
            });
        }
    }
    async apiListVenues(req, res) {
        const team = req.user.team._id;
        logger_service_1.default.info(`apiListVenues`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
        try {
            const currentUser = await user_model_1.default.findById(req.user._id);
            if (currentUser) {
                res.status(200).json({
                    venues: await venue_model_1.default.find({
                        _id: {
                            $in: currentUser.venuesPermissions()
                        },
                        team
                    }, {
                        name: true,
                        lat: true,
                        lng: true
                    }),
                    status: 200
                });
            }
            else {
                /* istanbul ignore next */
                res.status(400).json({
                    message: 'Ha ocurrido un error',
                    status: 400
                });
            }
        }
        catch (e) {
            logger_service_1.default.error(`apiListVenues: Async Error.`);
            logger_service_1.default.error(e);
            /* istanbul ignore next */
            res.status(500).json({
                message: 'Ha ocurrido un error',
                status: 500
            });
        }
    }
    async apiChangeVenue(req, res) {
        const team = req.user.team._id;
        const { venue } = req.body;
        logger_service_1.default.info(`apiChangeVenue`);
        logger_service_1.default.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}}`);
        try {
            const currentUser = await user_model_1.default.findById(req.user._id);
            const currentVenue = await venue_model_1.default.findOne({ _id: venue, team });
            if (currentUser && currentVenue && currentUser.venuesPermissions(true).includes(venue)) {
                currentUser.venue = currentVenue;
                currentUser.company = currentVenue.company;
                await currentUser.save();
                res.status(200).json({
                    message: 'Usuario editado satisfactoriamente.',
                    status: 200
                });
            }
            else {
                /* istanbul ignore next */
                logger_service_1.default.error(`apiChangeVenue: Ha ocurrido un error.`);
                res.status(400).json({
                    message: 'Operación no permitida',
                    status: 400
                });
            }
        }
        catch (e) {
            logger_service_1.default.error(`apiChangeVenue: Async Error.`);
            logger_service_1.default.error(e);
            /* istanbul ignore next */
            res.status(500).json({
                message: 'Ha ocurrido un error',
                status: 500
            });
        }
    }
    getUsers(filter, options) {
        return new Promise((resolve, reject) => {
            user_model_2.default.paginate(filter, options, (err, result) => {
                /* istanbul ignore next  */
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
    async getPusherToken(req, res) {
        if (req.user._id === req.query['user_id'])
            res.status(200).json(push_service_1.default.createAuthToken(req.user._id));
        else
            res.status(401).json({ message: 'Authentication failed. User provided does not match with user_id.' });
    }
}
exports.default = new UserController();
//# sourceMappingURL=user.controller.js.map