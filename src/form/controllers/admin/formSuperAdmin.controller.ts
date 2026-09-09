import { Response } from 'express';

import Company from '../../../app/models/company.model';
import Form from '../../models/form.model';
import Team from '../../../app/models/team.model';
import formCopyService from '../../services/formCopy.service';
import { IRequest } from '../../../interfaces/global.interface';
import logger from '../../../services/logger.service';

/**
 * Administración de formularios para superadmin (ver middleware isSuperAdmin).
 *
 * Existe aparte de form.admin.controller.ts porque ese está scopeado a la
 * sesión: `apiCreate` fuerza `team` desde `req.user.team` y `apiUpdate` /
 * `apiDelete` filtran por ese team. Acá el team/company es explícito, que es
 * justamente lo que necesita cruzar la frontera entre teams — y la razón por la
 * que estas rutas van detrás de isSuperAdmin y no de isLoggedIn.
 *
 * Toda acción que escribe queda logueada con el email del actor.
 */
class FormSuperAdminController {
  constructor() {
    this.page = this.page.bind(this);
    this.apiTeams = this.apiTeams.bind(this);
    this.apiCompanies = this.apiCompanies.bind(this);
    this.apiList = this.apiList.bind(this);
    this.apiDetail = this.apiDetail.bind(this);
    this.apiCreate = this.apiCreate.bind(this);
    this.apiUpdate = this.apiUpdate.bind(this);
    this.apiSetActive = this.apiSetActive.bind(this);
    this.apiCopy = this.apiCopy.bind(this);
  }

  /** Página server-rendered (pug), no la SPA. */
  public async page(req: IRequest, res: Response) {
    return res.render('app/formSuperAdmin', {
      actorEmail: req.user.email
    });
  }

  public async apiTeams(req: IRequest, res: Response) {
    try {
      const teams = await Team.find({}, { name: true }).sort({ name: 1 }).lean();
      return res.json({ results: teams, status: 200 });
    } catch (e) {
      logger.error('FormSuperAdminController.apiTeams error');
      console.error(e);
      return res.status(500).json({ message: 'Error listando teams.', status: 500 });
    }
  }

  public async apiCompanies(req: IRequest, res: Response) {
    const { team } = req.query as { team?: string };
    try {
      const filter: any = { deleted: { $ne: true } };
      if (team) {
        filter.team = team;
      }
      const companies = await Company
        .find(filter, { name: true, team: true })
        .sort({ name: 1 })
        .lean();
      return res.json({ results: companies, status: 200 });
    } catch (e) {
      logger.error('FormSuperAdminController.apiCompanies error');
      console.error(e);
      return res.status(500).json({ message: 'Error listando companies.', status: 500 });
    }
  }

  /** Listado de formularios de CUALQUIER team (filtros explícitos). */
  public async apiList(req: IRequest, res: Response) {
    const { team, company, kind, active, q } = req.query as {
      team?: string; company?: string; kind?: string; active?: string; q?: string;
    };
    try {
      const filter: any = {};
      if (team) filter.team = team;
      if (company) filter.company = company;
      if (kind) filter.kind = kind;
      if (active === '1') filter.active = true;
      if (active === '0') filter.active = false;
      if (q && q.trim()) {
        // Escapar el input: se usa dentro de una regex.
        filter.name = { $regex: q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
      }

      const forms = await Form
        .find(filter, {
          name: true, kind: true, active: true, hidden: true,
          team: true, company: true, updatedAt: true, sections: true
        })
        .populate([
          { path: 'team', select: ['name'] },
          { path: 'company', select: ['name'] }
        ])
        .sort({ updatedAt: -1 })
        .limit(300)
        .lean();

      const results = forms.map((f: any) => ({
        _id: f._id,
        name: f.name,
        kind: f.kind,
        active: f.active,
        hidden: f.hidden,
        teamId: f.team?._id ?? f.team,
        teamName: f.team?.name,
        companyId: f.company?._id ?? f.company,
        companyName: f.company?.name,
        updatedAt: f.updatedAt,
        sections: (f.sections || []).length,
        questions: (f.sections || []).reduce((n: number, s: any) => n + (s.questions || []).length, 0)
      }));

      return res.json({ results, count: results.length, status: 200 });
    } catch (e) {
      logger.error('FormSuperAdminController.apiList error');
      console.error(e);
      return res.status(500).json({ message: 'Error listando formularios.', status: 500 });
    }
  }

  /** Documento completo, para editarlo como JSON. */
  public async apiDetail(req: IRequest, res: Response) {
    try {
      const form = await Form.findById(req.params.id).lean();
      if (!form) {
        return res.status(404).json({ message: 'Formulario no encontrado.', status: 404 });
      }
      return res.json({ form, status: 200 });
    } catch (e) {
      logger.error('FormSuperAdminController.apiDetail error');
      console.error(e);
      return res.status(500).json({ message: 'Error obteniendo el formulario.', status: 500 });
    }
  }

  public async apiCreate(req: IRequest, res: Response) {
    const { body } = req;
    try {
      if (!body?.name || !body?.team || !body?.company) {
        return res.status(400).json({
          message: 'name, team y company son obligatorios.',
          status: 400
        });
      }
      const companyOk = await this.companyBelongsToTeam(body.company, body.team);
      if (!companyOk.ok) {
        return res.status(400).json({ message: companyOk.message, status: 400 });
      }

      // Nunca aceptar _id ni timestamps desde el cliente.
      const payload = { ...body };
      delete payload._id;
      delete payload.__v;
      delete payload.createdAt;
      delete payload.updatedAt;

      const form = await new Form(payload).save();
      logger.info(
        `FormSuperAdmin CREATE por ${req.user.email}: form=${form._id} "${form.name}" ` +
        `team=${body.team} company=${body.company}`
      );
      return res.status(200).json({ message: 'Formulario creado.', form, status: 200 });
    } catch (e: any) {
      logger.error(`FormSuperAdminController.apiCreate error por ${req.user.email}`);
      console.error(e);
      return res.status(400).json({
        message: e?.message || 'Error creando el formulario.',
        errors: e?.errors,
        status: 400
      });
    }
  }

  /**
   * Reemplaza el documento (menos team/company). Mover un formulario de team
   * se rechaza a propósito: dejaría sus questions apuntando a las escalas y
   * catálogos de daños del team viejo. Para eso está copiar.
   */
  public async apiUpdate(req: IRequest, res: Response) {
    const { id } = req.params;
    const { body } = req;
    try {
      const current = await Form.findById(id, { team: true, company: true, name: true }).lean() as any;
      if (!current) {
        return res.status(404).json({ message: 'Formulario no encontrado.', status: 404 });
      }

      if (body.team && String(body.team) !== String(current.team)) {
        return res.status(400).json({
          message: 'No se puede cambiar el team de un formulario: sus escalas y catálogos de daños ' +
            'quedarían apuntando al team anterior. Usá "Copiar a otro team".',
          status: 400
        });
      }
      if (body.company && String(body.company) !== String(current.company)) {
        return res.status(400).json({
          message: 'No se puede cambiar la company de un formulario: sus escalas quedarían apuntando ' +
            'a la company anterior. Usá "Copiar a otro team".',
          status: 400
        });
      }

      const payload = { ...body };
      delete payload._id;
      delete payload.__v;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.team;
      delete payload.company;

      // runValidators para que los enum del schema (kind, keyboardType, etc.)
      // se validen igual que en un save().
      const form = await Form.findByIdAndUpdate(
        id,
        { $set: payload },
        { new: true, runValidators: true }
      );

      logger.info(
        `FormSuperAdmin UPDATE por ${req.user.email}: form=${id} "${current.name}" -> "${payload.name ?? current.name}"`
      );
      return res.status(200).json({ message: 'Formulario actualizado.', form, status: 200 });
    } catch (e: any) {
      logger.error(`FormSuperAdminController.apiUpdate error por ${req.user.email}`);
      console.error(e);
      return res.status(400).json({
        message: e?.message || 'Error actualizando el formulario.',
        errors: e?.errors,
        status: 400
      });
    }
  }

  /**
   * Activar / desactivar. Es un soft-toggle sobre `active`: no borra nada, así
   * que los participants históricos y sus reportes quedan intactos.
   */
  public async apiSetActive(req: IRequest, res: Response) {
    const { id } = req.params;
    const { active } = req.body as { active?: boolean };
    try {
      if (typeof active !== 'boolean') {
        return res.status(400).json({ message: 'active debe ser true o false.', status: 400 });
      }
      const form = await Form.findByIdAndUpdate(
        id,
        { $set: { active } },
        { new: true }
      ).populate([{ path: 'team', select: ['name'] }]);

      if (!form) {
        return res.status(404).json({ message: 'Formulario no encontrado.', status: 404 });
      }

      logger.info(
        `FormSuperAdmin ${active ? 'ACTIVATE' : 'DEACTIVATE'} por ${req.user.email}: ` +
        `form=${id} "${form.name}" team=${(form.team as any)?.name ?? form.team}`
      );
      return res.status(200).json({
        message: active ? 'Formulario activado.' : 'Formulario desactivado.',
        form: { _id: form._id, name: form.name, active: form.active },
        status: 200
      });
    } catch (e) {
      logger.error(`FormSuperAdminController.apiSetActive error por ${req.user.email}`);
      console.error(e);
      return res.status(500).json({ message: 'Error cambiando el estado.', status: 500 });
    }
  }

  /**
   * Copia a otro team/company. `preview: true` (default) no escribe nada y
   * devuelve el plan de resolución de referencias.
   */
  public async apiCopy(req: IRequest, res: Response) {
    const { id } = req.params;
    const { targetTeam, targetCompany, name, preview } = req.body as {
      targetTeam?: string; targetCompany?: string; name?: string; preview?: boolean;
    };
    try {
      if (!targetTeam || !targetCompany) {
        return res.status(400).json({
          message: 'targetTeam y targetCompany son obligatorios.',
          status: 400
        });
      }

      const isPreview = preview !== false;
      const result = await formCopyService.copy({
        formId: id,
        targetTeam,
        targetCompany,
        name,
        preview: isPreview
      });

      if (!isPreview) {
        logger.info(
          `FormSuperAdmin COPY por ${req.user.email}: form=${id} -> ${result.createdFormId} ` +
          `team=${targetTeam} company=${targetCompany} (${result.plan.length} referencias)`
        );
      }

      return res.status(200).json({
        message: isPreview
          ? 'Preview generado: no se escribió nada.'
          : 'Formulario copiado.',
        result,
        status: 200
      });
    } catch (e: any) {
      logger.error(`FormSuperAdminController.apiCopy error por ${req.user.email}: ${e?.message}`);
      console.error(e);
      return res.status(400).json({
        message: e?.message || 'Error copiando el formulario.',
        status: 400
      });
    }
  }

  private async companyBelongsToTeam(
    company: string,
    team: string
  ): Promise<{ ok: boolean; message?: string }> {
    const companyDoc = await Company.findById(company, { name: true, team: true }).lean() as any;
    if (!companyDoc) {
      return { ok: false, message: `No existe la company ${company}.` };
    }
    if (String(companyDoc.team) !== String(team)) {
      return {
        ok: false,
        message: `La company "${companyDoc.name}" no pertenece al team indicado.`
      };
    }
    return { ok: true };
  }
}

export default new FormSuperAdminController();
