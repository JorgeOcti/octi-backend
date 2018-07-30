import {Request, Response} from 'express';
import Company from '../../models/company.model';

class AdminCompaniesController {
  constructor() {
    this.index = this.index.bind(this);
    this.getCompanies = this.getCompanies.bind(this);
  }

  public index(req: Request, res: Response) {

  }

  private getCompanies() {
    return new Promise((resolve, reject) => {
      Company.find({}, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new AdminCompaniesController();
