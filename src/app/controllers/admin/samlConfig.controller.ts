import { Response } from 'express';
import { IRequest } from '../../../interfaces/global.interface';
import SamlConfig, { SamlConfigSchema } from '../../models/samlConfig.model';
import BaseAdminController from './base.admin.controller';
import GeneralUtils from '../../../utils/general.utils';

class SamlConfigController extends BaseAdminController<SamlConfigSchema> {

  constructor() {
    super(SamlConfig);
    this.apiList = this.apiList.bind(this);
    this.apiCreate = this.apiCreate.bind(this);
    this.apiUpdate = this.apiUpdate.bind(this);
    this.apiDelete = this.apiDelete.bind(this);
  }

  public async apiCreate(req: IRequest, res: Response): Promise<any> {
    const { team } = req.user;
    const { body, files } = req;
    const { name, entryPoint, issuer, callbackUrl } = body;

    const samlConfig = new SamlConfig({
      team, name, entryPoint, issuer, callbackUrl
    });

    const cert: any = GeneralUtils.getFileFromRequest(files, 'cert');

    if (cert) {
      cert.headers = {
        'Content-Type': cert.mimetype
      };
      cert.team = team._id;
      await samlConfig.attach('cert', cert);
    }

    await samlConfig.save();

    res.status(201).json({
      message: `Configuración de Saml creada satisfactoriamente.`
    });
  }

  public async apiUpdate(req: IRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const { team } = req.user;
    const { body, files } = req;
    const { name, entryPoint, issuer, callbackUrl } = body;
    const samlConfig = await SamlConfig.findOne({ _id: id, team });
    if (samlConfig) {
      samlConfig.name = name;
      samlConfig.entryPoint = entryPoint;
      samlConfig.issuer = issuer;
      samlConfig.callbackUrl = callbackUrl;

      const cert: any = GeneralUtils.getFileFromRequest(files, 'cert');
      if (cert) {
        cert.headers = {
          'Content-Type': cert.mimetype
        };
        cert.team = team._id;
        await samlConfig.attach('cert', cert);
      }

      await samlConfig.save();
      res.status(200).json({
        message: `Configuración de Saml actualizada satisfactoriamente.`,
        data: samlConfig
      });
    }
  }

  public async apiDelete(req: IRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const team = req.user.team._id;
    req.context = {
      name: 'Configuración Saml',
      filter: { team, _id: id },
      // permissionRequired: 'deleteSamlConfig'
    };
    super.apiDelete(req, res);
  }

  public async apiList(req: IRequest, res: Response): Promise<any> {
    const { team } = req.user;
    this.paginateOptions = {
      sort: {
        name: 1
      }
    };
    req.context = {
      filter: {
        team
      }
    };
    super.apiList(req, res);
  }
}

const adminSamlCongigController = new SamlConfigController();
export { adminSamlCongigController as default };
