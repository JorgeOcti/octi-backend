import { Response } from 'express';

// Los selectores de team/company de la vista reusan /api/superadmin/teams/ y
// /api/superadmin/companies/ (form router), que ya están detrás del mismo gate.
import User from '../../models/user.model';
import { IRequest } from '../../../interfaces/global.interface';
import logger from '../../../services/logger.service';

/**
 * Vista de usuarios de TODO el sistema para superadmin (ver middleware
 * isSuperAdmin), con cambio de contraseña.
 *
 * Dos cosas que no se pueden hacer distinto acá:
 *
 * 1. La contraseña se asigna al documento y se guarda con `save()`. El hash
 *    bcrypt lo hace el hook `pre('save')` de userSchema (user.model.ts). Un
 *    `updateOne`/`findOneAndUpdate` con `$set: { password }` NO dispara ese
 *    hook: guardaría la contraseña en texto plano y además el login dejaría de
 *    funcionar, porque compara con bcrypt contra `user.password`.
 *
 * 2. El listado proyecta solo campos seguros. `password` y `hash_password` no
 *    son `select: false` en el schema, así que una query sin proyección los
 *    devuelve: hay que enumerar los campos a mano, nunca devolver el documento
 *    entero.
 */

// Campos que se pueden devolver. Todo lo que no esté acá queda afuera.
const SAFE_FIELDS = {
  firstName: true,
  lastName: true,
  email: true,
  username: true,
  active: true,
  isAdmin: true,
  isSuperAdmin: true,
  type: true,
  lastLogin: true,
  createdAt: true,
  team: true,
  company: true,
  venue: true
};

const MIN_PASSWORD_LENGTH = 8;

class UserSuperAdminController {
  constructor() {
    this.page = this.page.bind(this);
    this.apiList = this.apiList.bind(this);
    this.apiSetPassword = this.apiSetPassword.bind(this);
  }

  public async page(req: IRequest, res: Response) {
    return res.render('app/userSuperAdmin', { actorEmail: req.user.email });
  }

  /** Usuarios de CUALQUIER team. Filtros explícitos, sin scope de sesión. */
  public async apiList(req: IRequest, res: Response) {
    const { team, company, active, q, superadmin } = req.query as {
      team?: string; company?: string; active?: string; q?: string; superadmin?: string;
    };
    try {
      const filter: any = {};
      if (team) filter.team = team;
      if (company) filter.company = company;
      if (active === '1') filter.active = true;
      if (active === '0') filter.active = false;
      if (superadmin === '1') filter.isSuperAdmin = true;

      if (q && q.trim()) {
        // Escapado: el texto entra en una regex.
        const safe = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const rx = { $regex: safe, $options: 'i' };
        filter.$or = [
          { email: rx }, { username: rx }, { firstName: rx }, { lastName: rx }
        ];
      }

      const users = await User
        .find(filter, SAFE_FIELDS)
        .populate([
          { path: 'team', select: ['name'] },
          { path: 'company', select: ['name'] },
          { path: 'venue', select: ['name'] }
        ])
        .sort({ email: 1 })
        .limit(300)
        .lean();

      const results = users.map((u: any) => ({
        _id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        // `username` es con lo que se hace login (passportConfig lo busca en
        // minúsculas), no el email: por eso se muestra en la tabla.
        username: u.username,
        active: u.active,
        isAdmin: u.isAdmin,
        isSuperAdmin: u.isSuperAdmin === true,
        type: u.type,
        lastLogin: u.lastLogin,
        teamName: u.team?.name,
        companyName: u.company?.name,
        venueName: u.venue?.name
      }));

      return res.json({ results, count: results.length, status: 200 });
    } catch (e) {
      logger.error('UserSuperAdminController.apiList error');
      console.error(e);
      return res.status(500).json({ message: 'Error listando usuarios.', status: 500 });
    }
  }

  public async apiSetPassword(req: IRequest, res: Response) {
    const { id } = req.params;
    const { password, confirm } = req.body as { password?: string; confirm?: string };
    try {
      if (!password || !confirm) {
        return res.status(400).json({
          message: 'Hay que mandar la contraseña y su confirmación.', status: 400
        });
      }
      if (password !== confirm) {
        return res.status(400).json({ message: 'Las contraseñas no coinciden.', status: 400 });
      }
      if (password.trim().length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({
          message: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`, status: 400
        });
      }

      const target = await User.findById(id);
      if (!target) {
        return res.status(404).json({ message: 'Usuario no encontrado.', status: 404 });
      }

      // Asignar + save(): el hook pre('save') hashea con bcrypt. Ver la nota de
      // arriba sobre por qué no se puede usar updateOne acá.
      target.password = password;
      // Si había un link de recuperación pendiente queda invalidado.
      target.passwordResetToken = undefined;
      target.passwordResetExpires = undefined;
      await target.save();

      // Nunca loguear la contraseña, ni devolverla.
      logger.info(
        `UserSuperAdmin SET_PASSWORD por ${req.user.email}: target=${target._id} ` +
        `<${target.email}> username=${target.username}` +
        (target.isSuperAdmin === true ? ' [EL TARGET ES SUPERADMIN]' : '')
      );

      return res.status(200).json({
        message: `Contraseña actualizada para ${target.email}.`,
        // Recordatorio para el operador: el login usa el username.
        username: target.username,
        status: 200
      });
    } catch (e) {
      logger.error(`UserSuperAdminController.apiSetPassword error por ${req.user.email}`);
      console.error(e);
      return res.status(500).json({ message: 'Error cambiando la contraseña.', status: 500 });
    }
  }
}

export default new UserSuperAdminController();
