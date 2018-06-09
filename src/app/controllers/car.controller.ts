import {Request, Response} from "express";
import CarModel, {ICarModel} from '../models/car.model'
import * as mongoose from 'mongoose';
// import UserModel from '../models/user.model';
import {ObjectID} from "bson";
import {PaginateOptions, PaginateResult} from "mongoose";
import {IRequest} from "../../interfaces/global.interface";
// import ParticipantModel from "../../form/models/participant.model";

class AdminCompaniesController {
  constructor() {
    this.vinDashboard = this.vinDashboard.bind(this);
    this.vinDashboardDetail = this.vinDashboardDetail.bind(this);
    this.apiCars = this.apiCars.bind(this);
    this.apiCarDetail = this.apiCarDetail.bind(this);
    this.getCars = this.getCars.bind(this);
  }

  public vinDashboard(req: Request, res: Response) {
    res.render('app/index');
  }

  public async vinDashboardDetail(req: IRequest, res: Response) {
    const {id} = req.params;
    const company = req.user.company;
    // validate params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).render('404');
    }
    try {
      // validate car exist
      const car = await CarModel.findOne({_id: id, company});
      if (!car) {
        return res.status(404).render('404');
      } else {
        res.render('app/index');
      }
    } catch (e) {
      if (e) res.status(500).send(e);
    }
  }

  public async apiCarDetail(req: IRequest, res: Response) {
    const company = req.user.company;
    const {id} = req.params;
    try {
      const car = await CarModel
        .findOne({
          _id: id,
          company
        }, {
          vin: true
        })
        .populate([{
          path: 'participants',
          select: ['name', 'user', 'createdAt', 'qualification'],
          options:{
            sort: {
              createdAt: -1
            }
          },
          populate: [{
            path: 'user',
            select: ['firstName', 'lastName']
          }]
        }]).lean();
      if (!car) {
        res.status(404).json({
          messsage: 'Auto no encontrado.',
          status: 404
        });
      } else {
        res.json({
          data: car,
          status: 200
        });
      }
    } catch (e) {
      if (e) res.status(500).json(e);
    }
  }

  public async apiCars(req: IRequest, res: Response) {
    const company = req.user.company;
    const {page, pageSize} = req.query;
    // paginate options
    const options: PaginateOptions = {
      select: {
        vin: true
      },
      populate: [{
        path: 'lastForm',
        select: ['createdAt', 'user'],
        populate: [{
          path: 'user',
          select: ['firstName', 'lastName']
        }]
      }],
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
      CarModel.paginate({company}, options, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new AdminCompaniesController();
