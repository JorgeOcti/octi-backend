"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../models/user.model");
class UserController {
    constructor() {
        this.apiChangePassword = this.apiChangePassword.bind(this);
    }
    async apiChangePassword(req, res) {
        const user = req.user;
        const { password } = req.body;
        if (password && password.trim().length) {
            try {
                const User = await user_model_1.default.findById(user._id);
                if (User) {
                    User.password = password;
                    User.save();
                    res.status(200).json({
                        message: 'Contraseña cambiada satisfactoriamente.',
                        status: 200
                    });
                }
            }
            catch (e) {
                res.status(400).json({
                    message: 'Ha ocurrido un error',
                    status: 400
                });
            }
        }
        else {
            res.status(400).json({
                message: 'No se ha podido cambiar la contraseña',
                status: 400
            });
        }
    }
}
exports.default = new UserController();
//# sourceMappingURL=user.controller.js.map