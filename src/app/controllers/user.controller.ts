import * as bcrypt from 'bcrypt';
import {Response} from 'express';
import {IRequest} from '../../interfaces/global.interface';
import UserModel from '../models/user.model';

class UserController {

  constructor() {
    this.apiChangePassword = this.apiChangePassword.bind(this);
  }

  public async apiChangePassword(req: IRequest, res: Response) {
    const user = req.user;
    const {password, newPassword} = req.body;
    if (password && password.trim().length && newPassword && newPassword.trim().length) {
      try {
        const User = await UserModel.findById(user._id);
        if (User) {
          const isPassword = bcrypt.compareSync(password, User.password);
          if (isPassword) {
            User.password = newPassword;
            User.save();
            res.status(200).json({
              message: 'Contraseña cambiada satisfactoriamente.',
              status: 200
            });
          } else {
            res.status(400).json({
              message: 'El password actual no corresponde',
              status: 400
            });
          }
        }
      } catch (e) {
        res.status(400).json({
          message: 'Ha ocurrido un error',
          status: 400
        });
      }
    } else {
      res.status(400).json({
        message: 'No se ha podido cambiar la contraseña',
        status: 400
      });
    }
  }
}

export default new UserController();
