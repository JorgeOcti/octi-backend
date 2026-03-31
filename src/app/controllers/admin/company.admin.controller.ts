import { Response } from 'express';
import { PaginateOptions, PaginateResult } from 'mongoose';
import { IRequest } from '../../../interfaces/global.interface';
import GeneralUtils from '../../../utils/general.utils';
import Company, { ICompanyModel } from '../../models/company.model';

class AdminCompaniesController {
  constructor() {
    this.index = this.index.bind(this);
    this.getCompanies = this.getCompanies.bind(this);
    this.apiListCompanies = this.apiListCompanies.bind(this);
    this.apiListIntegrationCompanies = this.apiListIntegrationCompanies.bind(this);
    this.apiCreateCompany = this.apiCreateCompany.bind(this);
    this.apiUpdateCompany = this.apiUpdateCompany.bind(this);
    this.apiDeleteCompany = this.apiDeleteCompany.bind(this);
    this.apiListClientCompanies = this.apiListClientCompanies.bind(this);
    this.apiUpdateClientCompany = this.apiUpdateClientCompany.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    if (req.user.hasPermission('viewCompany')) {
      res.render('app/index', { token: await req.user.generateToken() });
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
    const team = req.user.team._id;
    const { page, pageSize, search } = req.query as { page: string, pageSize: string, search: string };
    // paginate options
    const options: PaginateOptions = {
      // select: {
      //   name: true,
      //   image: true,
      //   updatedAt: true,
      //   createdAt: true
      // },
      sort: {
        name: 1
      },
      customLabels: {
        totalDocs: 'total',
        docs: 'docs',
        limit: 'perPage',
        page: 'currentPage',
        nextPage: 'next',
        prevPage: 'prev',
        totalPages: 'pages',
        pagingCounter: 'si'
      },
      // allowDiskUse: true,
      lean: true,
      page: parseInt(page ? page : '1', 10),
      limit: parseInt(pageSize ? pageSize : '20', 10)
    };
    const companies = await this.getCompanies({
      deleted: false,
      team
    }, options, search);
    /* istanbul ignore if  */
    if (options.page && companies.pages && companies.pages < options.page) {
      return res.status(400).json({
        error: 'La página solicitada no existe.',
        status: 200
      });
    } else {
      return res.json({
        count: companies.total,
        pages: companies.pages,
        hasPrevious: companies.hasPrevious,
        hasNextPage: companies.hasNextPage,
        results: companies.docs,
        status: 200
      });
    }
  }

  public async apiListIntegrationCompanies(req: IRequest, res: Response): Promise<any> {
    /*if (!req.user.hasPermission('viewCompany') && !req.user.hasPermission('viewUser')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }*/
    try {
      const team = req.user.team._id;
      const { page, pageSize } = req.query as { page: string, pageSize: string, search: string };
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
        customLabels: {
          totalDocs: 'total',
          docs: 'docs',
          limit: 'perPage',
          page: 'currentPage',
          hasNextPage: 'hasNextPage',
          hasPrevPage: 'hasPrevPage',
          totalPages: 'pages',
          pagingCounter: 'si'
        },
        // allowDiskUse: true,
        lean: true,
        page: parseInt(page ? page : '1', 10),
        limit: parseInt(pageSize ? pageSize : '100', 10)
      };
      const companies = await this.getCompanies({
        deleted: false,
        team
      }, options);
      /* istanbul ignore if  */
      if (options.page && companies.pages && companies.pages < options.page) {
        return res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        return res.json({
          count: companies.total,
          pages: companies.pages,
          hasPrevPage: companies.hasPrevPage,
          hasNextPage: companies.hasNextPage,
          data: companies.docs,
          status: 200
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Error en el servidor',
        status: 500
      });
    }
  }

  public async apiCreateCompany(req: IRequest, res: Response): Promise<any> {
    if (!req.user.hasPermission('addCompany')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    const { name, businessName, rut, billing, notifications } = req.body;
    const team = req.user.team;
    const image: any = GeneralUtils.getFileFromRequest(req.files, 'image');
    const marker: any = GeneralUtils.getFileFromRequest(req.files, 'marker');
    if (!name || !name.trim().length) {
      res.status(400).json({
        message: 'El nombre es requerido.',
        status: 400
      });
    }
    try {
      const existCompany = await Company.find({
        name,
        businessName,
        rut,
        team,
        deleted: false
      });
      if (existCompany.length) {
        res.status(400).json({
          message: 'Empresa ya existe.',
          status: 400
        });
      } else {
        const newCompany = new Company({
          name,
          billing: JSON.parse(billing),
          notifications: JSON.parse(notifications),
          team
        });
        if (image) {
          image.headers = {
            'Content-Type': image.mimetype
          };
          image.team = team._id;
          await newCompany.attach('image', image);
        }
        if (marker) {
          marker.headers = {
            'Content-Type': marker.mimetype
          };
          marker.team = team._id;
          await newCompany.attach('marker', marker);
        }
        await newCompany.save();
        res.status(201).json({
          message: 'Empresa creada satisfactoriamente.',
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
    const { id } = req.params;
    const team = req.user.team;
    const { name, businessName, rut, billing, notifications } = req.body;
    const image: any = GeneralUtils.getFileFromRequest(req.files, 'image');
    const marker: any = GeneralUtils.getFileFromRequest(req.files, 'marker');
    if (!name || !name.length) {
      res.status(400).json({
        message: 'The name is are required',
        status: 400
      });
    }
    try {
      const company = await Company.findOne({
        _id: id
        , team
      });
      if (company) {
        company.businessName = businessName;
        company.rut = rut;
        company.name = name;
        company.billing = JSON.parse(billing);
        company.notifications = JSON.parse(notifications);
        if (image) {
          image.headers = {
            'Content-Type': image.mimetype
          };
          image.team = team._id;
          await company.attach('image', image);
          image.company = company.image;
          await company.save();
        }
        if (marker) {
          marker.headers = {
            'Content-Type': marker.mimetype
          };
          marker.team = team._id;
          await company.attach('marker', marker);
          image.marker = company.marker;
          await company.save();
        }
        await company.save();

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
    const { id } = req.params;
    const team = req.user.team._id;
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
        return res.status(200).json(response);
      } else {
        const response = {
          id,
          message: 'Empresa no encontrada'
        };
        return res.status(200).json(response);
      }
    } catch (e) {
      /* istanbul ignore next  */
      return res.status(500).json(e);
    }
  }

  public async apiListClientCompanies(req: IRequest, res: Response): Promise<any> {
    if (!req.user.hasPermission('viewCompany') && !req.user.hasPermission('viewUser')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    const companyId = req.user.company._id;
    const { page, pageSize } = req.query as { page: string; pageSize: string };
    const handlerCompany = await Company.findOne({ _id: companyId }).select('clientCompanies').lean();
    if (!handlerCompany || !handlerCompany.clientCompanies || !handlerCompany.clientCompanies.length) {
      return res.json({ count: 0, pages: 1, results: [], status: 200 });
    }
    const options: PaginateOptions = {
      sort: { name: 1 },
      customLabels: {
        totalDocs: 'total',
        docs: 'docs',
        limit: 'perPage',
        page: 'currentPage',
        nextPage: 'next',
        prevPage: 'prev',
        totalPages: 'pages',
        pagingCounter: 'si'
      },
      lean: true,
      page: parseInt(page ? page : '1', 10),
      limit: parseInt(pageSize ? pageSize : '20', 10)
    };
    const companies = await this.getCompanies({
      _id: { $in: handlerCompany.clientCompanies },
      deleted: false
    }, options);
    if (options.page && companies.pages && companies.pages < options.page) {
      return res.status(400).json({
        error: 'La página solicitada no existe.',
        status: 400
      });
    }
    return res.json({
      count: companies.total,
      pages: companies.pages,
      hasPrevious: companies.hasPrevious,
      hasNextPage: companies.hasNextPage,
      results: companies.docs,
      status: 200
    });
  }

  public async apiUpdateClientCompany(req: IRequest, res: Response): Promise<any> {
    if (!req.user.hasPermission('changeCompany')) {
      return res.status(403).json({
        message: 'No tienes permisos para esta operación'
      });
    }
    const { id } = req.params;
    const companyId = req.user.company._id;
    const { name, businessName, rut } = req.body;
    const image: any = GeneralUtils.getFileFromRequest(req.files, 'image');
    if (!name || !name.length) {
      return res.status(400).json({
        message: 'El nombre es requerido',
        status: 400
      });
    }
    try {
      const handlerCompany = await Company.findOne({ _id: companyId }).select('clientCompanies').lean();
      if (!handlerCompany || !handlerCompany.clientCompanies || !handlerCompany.clientCompanies.map(String).includes(String(id))) {
        return res.status(400).json({
          id,
          message: 'Empresa no encontrada'
        });
      }
      const company = await Company.findOne({
        _id: id,
        deleted: false
      });
      if (!company) {
        return res.status(400).json({
          id,
          message: 'Empresa no encontrada'
        });
      }
      company.name = name;
      company.businessName = businessName;
      company.rut = rut;
      if (image) {
        image.headers = { 'Content-Type': image.mimetype };
        image.team = req.user.team._id;
        await new Promise<void>((resolve, reject) => {
          company.attach('image', image, (err: any) => {
            if (err) return reject(err);
            resolve();
          });
        });
        company.markModified('image');
      }
      await company.save();
      return res.status(200).json({
        message: 'Empresa editada satisfactoriamente.',
        company
      });
    } catch (e) {
      /* istanbul ignore next  */
      console.log(e);
      /* istanbul ignore next  */
      return res.status(500).json(e);
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
