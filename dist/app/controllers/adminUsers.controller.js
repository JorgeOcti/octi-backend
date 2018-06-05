"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../models/user.model");
const kue = require("kue");
const queue = kue.createQueue();
class AdminUsersController {
    constructor() {
        this.users = this.users.bind(this);
        this.apiUsers = this.apiUsers.bind(this);
        this.apiAddUser = this.apiAddUser.bind(this);
        this.apiDeleteUser = this.apiDeleteUser.bind(this);
    }
    async users(req, res) {
        res.render('app/index');
    }
    async apiAddUser(req, res) {
        const { firstName, lastName, email } = req.body;
        // validate fields required
        if (!firstName || !firstName.length || !lastName || !lastName.length || !email || !email.length) {
            res.status(400).json({
                message: 'firstName, lastName and email are required',
                status: 400
            });
        }
        try {
            // validate existe user
            const existUser = await user_model_1.default.find({ $or: [{ email: email }, { username: email }] });
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
                    password,
                    email
                }).save();
                // send welcome email
                const fullname = newUser.fullName();
                queue.create('email', {
                    from: '',
                    title: `Welcome email for ${fullname}`,
                    to: `"${fullname}"<${newUser.email}>`,
                    subject: `${fullname} bienvenido(a) a OSA Andes`,
                    text: `${fullname} bienvenido(a) a OSA Andes
          {Empresa} te da la bienvenida a usar OSA Andes. bla bla bla......

          Tus Datos para acceder a la aplicación son:
          Usuario: ${newUser.email}
          Contraseña ${password}
          En caso de dudas o consultas puedes contactarte asoporte@osacontrol.com o a nuestro twitter@TaskforceOSA.
          
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
    async apiUsers(req, res) {
        const { page, pageSize } = req.query;
        // paginate options
        const options = {
            select: {
                password: false
            },
            sort: {
                createdAt: -1
            },
            page: parseInt(page ? page : 1),
            limit: parseInt(pageSize ? pageSize : 20),
        };
        try {
            const users = await this.getUsers(options);
            // validate exist page
            if (options.page && users.pages && users.pages < options.page) {
                res.status(400).json({
                    error: 'La página solicitada no existe.',
                    status: 200,
                });
            }
            else {
                res.json({
                    count: users.total,
                    pages: users.pages,
                    hasPrevious: options.page && users.pages && users.pages <= options.page,
                    hasNext: options.page && users.pages && users.pages > options.page,
                    results: users.docs,
                    status: 200,
                });
            }
        }
        catch (e) {
            if (e)
                res.status(500).json(e);
        }
    }
    apiDeleteUser(req, res) {
        const { id } = req.params;
        user_model_1.default.findByIdAndRemove(id, (err, user) => {
            // As always, handle any potential errors:
            if (err)
                res.status(500).send(err);
            if (user) {
                const response = {
                    message: "Usuario eliminado satisfactoriamente.",
                    id: user._id
                };
                res.status(200).send(response);
            }
            else {
                const response = {
                    message: "Este usuario ya fue eliminado.",
                    id: id
                };
                res.status(200).send(response);
            }
        });
    }
    getUsers(options) {
        return new Promise((resolve, reject) => {
            user_model_1.default.paginate({}, options, (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
}
exports.default = new AdminUsersController();
//# sourceMappingURL=adminUsers.controller.js.map