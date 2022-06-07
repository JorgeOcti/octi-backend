import {Response} from "express";
import Planning, {IPlanningModel} from "../models/planning.model";
import {IRequest} from "../../interfaces/global.interface";
import {PaginateOptions, PaginateResult} from "mongoose";
import {IPlanning} from "../interfaces/planning.interface";
import * as moment from "moment";
import CarModel, {ChoicesStatusCar, ICarModel} from "../../app/models/car.model";
import {io} from "../../server";

class PlanningController {

  constructor() {
    this.index = this.index.bind(this);
    this.list = this.list.bind(this);
    this.create = this.create.bind(this);
    this.getPlanning = this.getPlanning.bind(this);
  }

  /* istanbul ignore next */
  public async index(req: IRequest, res: Response) {
    try {
      res.render('app/index', {
        token: await req.user.generateToken()
      });
    } catch (e) {
      console.log(e);
    }
  }

  public async create(req: IRequest, res: Response) {
    const { company } = req.user;
    const team = req.user.team._id;
    let {carsByDate} = req.body;
    try {
      const planningCars: Omit<IPlanning, "_id">[] = [];
      for (const item of carsByDate) {
        for (const car of item.cars) {
          let currentCar: ICarModel | null = await CarModel.findOne({
            team,
            vin: car.vin.trim()
          });
          if (currentCar === null && car.vin && car.vin.trim().length) {
            currentCar = new CarModel({
              team,
              company,
              internalNumber: car.NInterno,
              vin: car.vin,
              vin2: car.vin.substr(car.vin.length - 6),
              color: car.color,
              type: car.tipo,
              property: car.propiedad,
              denomination: car.denominacion,
              brand: car.marca,
              patent: car.patente,
              createdBy: req.user,
              status: ChoicesStatusCar.active
            });
            await currentCar.save();
          }
          if(currentCar){
            planningCars.push({
              team,
              company,
              car: currentCar._id,
              createdBy: req.user,
              date: moment(item.key, "YYYYMMDD").toDate()
            })
          }
        }
      }
      await Planning.insertMany(planningCars);
      io.to(`planning-list-${team}`).emit('REFRESH', {
        update: true
      });
      res.status(201)
        .json({
          message: 'Planificación importada satisfactoriamente',
          status: 201
        });
    } catch (e) {
      /* istanbul ignore next */
      if (e) {
        console.log(e);
        res.status(500).json(e);
      }
    }
  }

  public async list(req: IRequest, res: Response) {
    const team = req.user.team._id;
    const {page, pageSize} = req.query as {page: string, pageSize: string};

    // paginate options
    const options: PaginateOptions = {
      // select: {
      //   vin: true,
      //   brand: true,
      //   denomination: true,
      //   color: true
      // },
      populate: [{
        path: 'car',
        select: ['vin', 'brand', 'denomination', 'color'],
      },{
        path: 'createdBy',
        select: ['vin', 'brand', 'denomination', 'color']
      }],
      sort: {
        date: -1
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
      page: parseInt(page ? page : "1", 10),
      limit: parseInt(pageSize ? pageSize : "20", 10)
    };
    try {
      const planning = await this.getPlanning({
        team
      }, options);
      // validate exist page
      if (options.page && planning.pages && planning.pages < options.page) {
        return res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 200
        });
      } else {
        return res.json({
          count: planning.total,
          pages: planning.pages,
          hasPrevious: planning.hasPrevious,
          hasNextPage: planning.hasNextPage,
          results: planning.docs,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      console.log(e);
      return res.status(500).json(e);
    }
  }

  private getPlanning(filters: any, options: PaginateOptions): Promise<PaginateResult<IPlanningModel>> {
    return new Promise((resolve, reject) => {
      !Planning.paginate(filters, options, (err, result) => {
        if (err) {
          /* istanbul ignore next */
          reject(err);
        }
        resolve(result);
      })
    });
  }
}

export default new PlanningController();
