import {IRequest} from "../../interfaces/global.interface";
import {Response} from "express";
import Request, {IRequestModel} from "../models/request.model";
import RequestItem from "../models/requestItem.model";
import {PaginateOptions, PaginateResult} from "mongoose";
import logger from "../../services/logger.service";
import Car, {ChoicesStatusCar} from "../../app/models/car.model";
import Team from "../../app/models/team.model";

class RequestController {

  constructor() {
    this.index = this.index.bind(this);
    this.apiList = this.apiList.bind(this);
    this.apiCreate = this.apiCreate.bind(this);
    this.getRequets = this.getRequets.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    res.render('app/index', {token: await req.user.generateToken()});
  }

  public async apiCreate(req: IRequest, res: Response) {
    const {team, company} = req.user;
    const {cars, venue, fleet} = req.body;

    try {
      const updateTeam = await Team.findOneAndUpdate({_id: team._id}, {$inc: {requestNumber: 1}}, {new: true});
      const request = await new Request({
        team,
        number: updateTeam!.requestNumber,
        origin: venue,
        destination: venue,
        fleet,
        createdBy: req.user
      }).save();
      for (const car of cars) {
        const newCar = await new Car({
          team,
          company,
          brand: car.brand,
          denomination: car.denomination,
          material: car.material,
          color: car.color,
          status: ChoicesStatusCar.pending,
          createdBy: req.user
        }).save();
        await new RequestItem({
          team,
          request,
          car: newCar,
          reason: car.reason,
          washed: car.washed,
          equipment: car.equipment,
          priority: car.priority,
          origin: venue,
          destination: venue,
          createdBy: req.user
        }).save();
      }
      res.json({
        status: 200
      });
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`RequestController.apiCreate: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}, body: ${JSON.stringify(req.body)}`);
      logger.error(e);
      res.status(500).json(e);
    }
  }

  public async apiList(req: IRequest, res: Response) {
    logger.info(`RequestController.apiList`);
    logger.info(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
    const {team} = req.user;
    const {page, pageSize, search} = req.query;
    // paginate options
    const options: PaginateOptions = {
      sort: {
        _id: -1
      },
      populate: [{
        path: 'origin',
        select: ['name'],
      }, {
        path: 'destination',
        select: ['name'],
      }, {
        path: 'createdBy',
        select: ['firstName', 'lastName'],
      }, {
        path: 'items',
        options: {
          sort: {
            priority: -1
          }
        },
        populate: [{
          path: 'car'
        }, {
          path: 'reason',
          select: ['name'],
        }, {
          path: 'origin',
          select: ['name'],
        }, {
          path: 'destination',
          select: ['name'],
        }],
      }],
      // select: {_id: true},
      page: parseInt(page ? page : 1, 10),
      limit: parseInt(pageSize ? pageSize : 20, 10)
    };
    let filter: any = {
      team
    };
    if (search) {
      // add here conditions tu search
    }
    try {
      const requests = await this.getRequets(filter, options);
      /* istanbul ignore if  */
      if (options.page && requests.pages && requests.pages < options.page) {
        res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        res.json({
          count: requests.total,
          pages: requests.pages,
          hasPrevious: options.page && options.page > 1 && requests.pages && requests.pages >= options.page,
          hasNext: options.page && requests.pages && requests.pages > options.page,
          results: requests.docs,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`RequestController.apiList: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      res.status(500).json(e);
    }
  }

  public async searhCar(req: IRequest, res: Response) {
    const {team} = req.user;
    const {search} = req.query;
    try {
      /*const searchText = new RegExp(search, 'i');
      const cars = await Car.aggregate([{
        $match: {
          team,
          $or:[{
            brand: {$regex: searchText}
          }, {
            denomination: {$regex: searchText}
          }]
        }
      }, {
        $project: {
          vin: 1,
          brand: 1,
          denomination: 1,
        }
      }, {
        $group: {
          _id: {
            brand: '$brand',
            denomination: '$denomination'
          }
        }
      }, {
        $limit: 100
      }, {
        $project: {
          brand: "$_id.brand",
          denomination: "$_id.denomination",
          score: "$_id.score",
          _id: false
        }
      }]);*/
      const cars = await Car.aggregate([{
        $match: {
          team,
          $text: {
            $search: search,
            $diacriticSensitive: true
          }
        }
      }, {
        $project: {
          vin: 1,
          brand: 1,
          denomination: 1,
          material: 1,
          score: {
            $meta: "textScore"
          }
        }
      }, {
        $match: {
          score: {
            $gt: 1.0
          }
        }
      }, {
        $group: {
          _id: {
            brand: '$brand',
            denomination: '$denomination',
            material: '$material',
            score: '$score'
          }
        }
      }, {
        $sort: {
          "_id.score": -1
        }
      }, {
        $limit: 100
      }, {
        $project: {
          brand: "$_id.brand",
          denomination: "$_id.denomination",
          material: "$_id.material",
          score: "$_id.score",
          _id: false
        }
      }]);

      /*const cars = await Car.find({
        team,
        $or:[{
            brand: {$regex: searchText}
          }, {
            denomination: {$regex: searchText}
          }]
      }, {_id:1, brand: 1, denomination: 1}).limit(100);*/
      res.json({
        cars
      })
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`RequestController.searhCar: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      logger.error(e);
      res.status(500).json(e);
    }
  }

  private getRequets(filter: any, options: PaginateOptions): Promise<PaginateResult<IRequestModel>>{
    return new Promise((resolve, reject) => {
      Request.paginate(filter, options, (err, result)=>{
        if (err) {
          return reject(err);
        }
        return resolve(result);
      })
    });
  }
}

export default new RequestController();
