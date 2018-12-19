import {Request, Response} from 'express';
import {PaginateOptions, PaginateResult} from 'mongoose';
import {IRequest} from '../../../interfaces/global.interface';
import Company, {ICompanyModel} from '../../models/company.model';

class AdminCompaniesController {
  constructor() {
    this.index = this.index.bind(this);
    this.getCompanies = this.getCompanies.bind(this);
    this.apiListCompanies = this.apiListCompanies.bind(this);
    this.apiCreateCompany = this.apiCreateCompany.bind(this);
    this.apiUpdateCompany = this.apiUpdateCompany.bind(this);
    this.apiDeleteCompany = this.apiDeleteCompany.bind(this);
  }

  public async index(req: Request, res: Response) {
    if (req.user.hasPermission('viewCompany')) {
      res.render('app/index', {token: await req.user.generateToken()});
    } else {
      res.status(403).render('403');
    }
  }

  public async apiListCompanies(req: IRequest, res: Response): Promise<any> {
    if (!req.user.hasPermission('viewCompany') && !req.user.hasPermission('viewUser')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    const {team} = req.user;
    const {page, pageSize, search} = req.query;
    // paginate options
    const options: PaginateOptions = {
      select: {
        name: true,
        updatedAt: true,
        createdAt: true
      },
      sort: {
        name: 1
      },
      page: parseInt(page ? page : 1, 10),
      limit: parseInt(pageSize ? pageSize : 20, 10)
    };
    const companies = await this.getCompanies({
      deleted: false,
      team
    }, options, search);
    /* istanbul ignore if  */
    if (options.page && companies.pages && companies.pages < options.page) {
      res.status(400).json({
        error: 'La página solicitada no existe.',
        status: 200
      });
    } else {
      res.json({
        count: companies.total,
        pages: companies.pages,
        hasPrevious: options.page && options.page > 1 && companies.pages && companies.pages >= options.page,
        hasNext: options.page && companies.pages && companies.pages > options.page,
        results: companies.docs,
        status: 200
      });
    }
  }

  public async apiCreateCompany(req: IRequest, res: Response): Promise<any> {
    if (!req.user.hasPermission('addCompany')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    const {name} = req.body;
    const {team} = req.user;
    if (!name || !name.trim().length) {
      res.status(400).json({
        message: 'El nombre es requerido.',
        status: 400
      });
    }
    try {
      const existCompany = await Company.find({
        name,
        team,
        deleted: false
      });
      if (existCompany.length) {
        res.status(400).json({
          message: 'Empresa ya existe.',
          status: 400
        });
      } else {
        const newCompany = await new Company({
          name,
          team
        }).save();
        res.status(201).json({
          message: 'Empresa agregada satisfactoriamente.',
          company: newCompany
        });
      }
    } catch (e) {
      /* istanbul ignore next  */
      console.log(e);
      /* istanbul ignore next  */
      res.status(500).json(e);
    }
  }

  public async apiUpdateCompany(req: IRequest, res: Response): Promise<any> {
    if (!req.user.hasPermission('changeCompany')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    const {id} = req.params;
    const {team} = req.user;
    const {name} = req.body;
    if (!name || !name.length) {
      res.status(400).json({
        message: 'The name is are required',
        status: 400
      });
    }
    try {
      const company = await Company.findOneAndUpdate({
        _id: id
        , team
      }, {
        name
      }, {
        new: true
      });
      if (company) {
        const response = {
          message: 'Empresa editada satisfactoriamente.',
          company
        };
        res.status(200).json(response);
      } else {
        const response = {
          id,
          message: 'Empresa no encontrada'
        };
        res.status(400).json(response);
      }
    } catch (e) {
      /* istanbul ignore next  */
      console.log(e);
      /* istanbul ignore next  */
      res.status(500).json(e);
    }
  }

  public async apiDeleteCompany(req: IRequest, res: Response): Promise<any> {
    if (!req.user.hasPermission('deleteCompany')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    const {id} = req.params;
    const {team} = req.user;
    try {
      const company = await Company.findOneAndUpdate({
        _id: id
        , team
      }, {
        deleted: true
      }, {
        new: true
      });
      if (company) {
        const response = {
          message: 'Empresa eliminada satisfactoriamente.',
          company
        };
        res.status(200).json(response);
      } else {
        const response = {
          id,
          message: 'Empresa no encontrada'
        };
        res.status(200).json(response);
      }
    } catch (e) {
      /* istanbul ignore next  */
      res.status(500).json(e);
    }
  }

  private getCompanies(filter: any, options: PaginateOptions, search?: string): Promise<PaginateResult<ICompanyModel>> {
    return new Promise((resolve, reject) => {
      Company.paginate(filter, options, (err, result) => {
        /* istanbul ignore next  */
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new AdminCompaniesController();
