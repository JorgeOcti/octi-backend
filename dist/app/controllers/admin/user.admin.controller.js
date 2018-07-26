"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("../../../app");
const user_model_1 = require("../../models/user.model");
class AdminUsersController {
    constructor() {
        this.index = this.index.bind(this);
        this.apiUsers = this.apiUsers.bind(this);
        this.apiAddUser = this.apiAddUser.bind(this);
        this.apiEditUser = this.apiEditUser.bind(this);
        this.apiDeleteUser = this.apiDeleteUser.bind(this);
    }
    async index(req, res) {
        res.render('app/index');
    }
    async apiUsers(req, res) {
        const { page, pageSize } = req.query;
        const company = req.user.company;
        // paginate options
        const options = {
            select: {
                firstName: true,
                lastName: true,
                email: true,
                updatedAt: true
            },
            populate: [{
                    path: 'venue',
                    select: ['name', 'active']
                }],
            sort: {
                createdAt: -1
            },
            page: parseInt(page ? page : 1, 10),
            limit: parseInt(pageSize ? pageSize : 20, 10)
        };
        try {
            const users = await this.getUsers(company, options);
            // validate exist page
            if (options.page && users.pages && users.pages < options.page) {
                res.status(400).json({
                    error: 'La página solicitada no existe.',
                    status: 200
                });
            }
            else {
                res.json({
                    count: users.total,
                    pages: users.pages,
                    hasPrevious: options.page && options.page > 1 && users.pages && users.pages >= options.page,
                    hasNext: options.page && users.pages && users.pages > options.page,
                    results: users.docs,
                    status: 200
                });
            }
        }
        catch (e) {
            if (e) {
                res.status(500).json(e);
            }
        }
    }
    async apiAddUser(req, res) {
        const { firstName, lastName, email, venue } = req.body;
        const company = req.user.company;
        // validate fields required
        if (!firstName || !firstName.length || !lastName || !lastName.length || !email || !email.length || !venue || !venue.length) {
            res.status(400).json({
                message: 'firstName, lastName, email and venue are required',
                status: 400
            });
        }
        try {
            // validate existe user
            const existUser = await user_model_1.default.find({ $or: [{ email }, { username: email }] });
            if (existUser.length) {
                res.status(400).json({
                    message: 'Usuario ya existe con este email.',
                    status: 400
                });
            }
            else {
                // generate password
                const password = Math.random().toString(36).slice(-8);
                // create user
                let newUser = await new user_model_1.default({
                    firstName,
                    lastName,
                    username: email,
                    venue,
                    company,
                    password,
                    email,
                    active: true
                }).save();
                // const error = await newUser.validate();
                // console.log(error);
                // send welcome email
                const fullname = newUser.fullName();
                app_1.queue.create('email', {
                    from: '',
                    title: `Welcome email for ${fullname}`,
                    to: `"${fullname}"<${newUser.email}>`,
                    subject: `${fullname} bienvenido(a) a OSA Andes`,
                    text: `${fullname} bienvenido(a) a OSA Andes
          {Empresa} te da la bienvenida a usar OSA Andes. bla bla bla......

          Tus Datos para acceder a la aplicación son:
          Usuario: ${newUser.email}
          Contraseña ${password}
          En caso de dudas o consultas puedes contactarte asoporte@osacontrol.com o a nuestro twitter @TaskforceOSA.

          © 2018 OSA SpA. All rights reserved.`,
                    view: 'account/welcome',
                    context: {
                        fullname,
                        username: newUser.email,
                        password
                    }
                }).priority('high').attempts(5).save();
                // prevent return password
                newUser = newUser.toObject();
                delete newUser.password;
                res.status(201).json({
                    message: 'Usuario agregado satisfactoriamente.',
                    user: newUser
                });
            }
        }
        catch (e) {
            res.status(500).json(e);
        }
    }
    async apiEditUser(req, res) {
        const { id } = req.params;
        const company = req.user.company;
        const { firstName, lastName, email, venue } = req.body;
        // validate fields required
        if (!firstName || !firstName.length || !lastName || !lastName.length || !email || !email.length || !venue || !venue.length) {
            res.status(400).json({
                message: 'firstName, lastName, email and venue are required',
                status: 400
            });
        }
        try {
            // validate email not duplicate
            const countUser = await user_model_1.default.count({ email, _id: { $ne: id } });
            if (countUser) {
                res.status(400).json({
                    message: 'Usuario ya existe con este email.',
                    status: 400
                });
            }
            else {
                let user = await user_model_1.default
                    .findOneAndUpdate({
                    _id: id, company
                }, {
                    firstName,
                    lastName,
                    email,
                    venue
                }, { new: true })
                    .populate([{
                        path: 'venue',
                        select: ['name', 'active']
                    }]);
                if (user) {
                    // prevent return password
                    user = user.toObject();
                    if (user) {
                        delete user.password;
                    }
                    const response = {
                        message: 'Usuario editado satisfactoriamente.',
                        user
                    };
                    res.status(200).json(response);
                }
                else {
                    const response = {
                        message: 'Usuario no encontardo',
                        id: id
                    };
                    res.status(200).json(response);
                }
            }
        }
        catch (e) {
            console.log(e);
            res.status(500).json(e);
        }
    }
    async apiDeleteUser(req, res) {
        const { id } = req.params;
        const company = req.user.company;
        try {
            const user = await user_model_1.default.findOneAndRemove({ _id: id, company });
            if (user) {
                const response = {
                    message: 'Usuario eliminado satisfactoriamente.',
                    id: user._id
                };
                res.status(200).json(response);
            }
            else {
                const response = {
                    message: 'Este usuario ya fue eliminado.',
                    id: id
                };
                res.status(200).json(response);
            }
        }
        catch (e) {
            res.status(500).json(e);
        }
    }
    getUsers(company, options) {
        return new Promise((resolve, reject) => {
            user_model_1.default.paginate({ company }, options, (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
}
exports.default = new AdminUsersController();
//# sourceMappingURL=user.admin.controller.js.map