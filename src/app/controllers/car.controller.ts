import {Request, Response} from "express";
import Car, {ICarModel} from '../models/car.model'
import {ObjectID} from "bson";
import {PaginateOptions, PaginateResult} from "mongoose";
import {IRequest} from "../../interfaces/global.interface";

class AdminCompaniesController {
  constructor() {
    this.vinDashboard = this.vinDashboard.bind(this);
    this.apiCars = this.apiCars.bind(this);
    this.getCars = this.getCars.bind(this);
  }

  public vinDashboard(req: Request, res: Response) {
    res.render('app/index');
  }

  public async apiCars(req: IRequest, res: Response) {
    const company = req.user.company;
    const {page, pageSize} = req.query;
    // paginate options
    const options: PaginateOptions = {
      select: {
        vin: true
      },
      sort: {
        createdAt: -1
      },
      page: parseInt(page ? page : 1),
      limit: parseInt(pageSize ? pageSize : 20),
    };
    try {
      const cars = await this.getCars(company, options);
      // validate exist page
      if (options.page && cars.pages && cars.pages < options.page) {
        res.status(400).json({
          error: 'La página solicitada no existe.',
          status: 200,
        });
      } else {
        res.json({
          count: cars.total,
          pages: cars.pages,
          hasPrevious: options.page && options.page > 1 && cars.pages && cars.pages >= options.page,
          hasNext: options.page && cars.pages && cars.pages > options.page,
          results: cars.docs,
          status: 200,
        });
      }
    } catch (e) {
      if (e) res.status(500).json(e);
    }
  }

  private getCars(company: ObjectID, options: PaginateOptions): Promise<PaginateResult<ICarModel>> {
    return new Promise((resolve, reject) => {
      Car.paginate({company}, options, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new AdminCompaniesController();
