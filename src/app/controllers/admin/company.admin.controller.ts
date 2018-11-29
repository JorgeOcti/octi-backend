import {Request, Response} from 'express';
import {PaginateOptions, PaginateResult} from 'mongoose';
import {IRequest} from '../../../interfaces/global.interface';
import Company, {ICompanyModel} from '../../models/company.model';

class AdminCompaniesController {
  constructor() {
    this.index = this.index.bind(this);
    this.getCompanies = this.getCompanies.bind(this);
    this.apiCompanies = this.apiCompanies.bind(this);
    this.apiAddCompany = this.apiAddCompany.bind(this);
  }

  public async index(req: Request, res: Response) {
    // if (req.user.hasPermission('viewCompanies')) {
      res.render('app/index', {token: await req.user.generateToken()});
    // } else {
    //   res.status(403).render('403');
    // }
  }

  public async apiCompanies(req: IRequest, res: Response) {
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
      // delete: false,
      team
    }, options, search);
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

  public async apiAddCompany(req: IRequest, res: Response): Promise<any> {
    /*if (!req.user.hasPermission('addCompany')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }*/
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
        team
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
      console.log(e);
      res.status(500).json(e);
    }
  }

  private getCompanies(filter: any, options: PaginateOptions, search?: string): Promise<PaginateResult<ICompanyModel>> {
    return new Promise((resolve, reject) => {
      Company.paginate(filter, options, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new AdminCompaniesController();
