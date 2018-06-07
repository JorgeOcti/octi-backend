import {Response} from "express";
import Venue, {IVenueModel} from '../../models/venue.model'
import {IRequest} from "../../../interfaces/global.interface";
import {ObjectID} from "bson";
import {PaginateOptions, PaginateResult} from "mongoose";

class AdminVenuesController {
  constructor() {
    this.index = this.index.bind(this);
    this.getVenues = this.getVenues.bind(this);
    this.apiVenues = this.apiVenues.bind(this);
  }

  public index(req: IRequest, res: Response) {

  }

  public async apiVenues(req: IRequest, res: Response) {
    const company = req.user.company;
    const {page, pageSize} = req.query;
    // paginate options
    const options: PaginateOptions = {
      select:{
        name: true
      },
      sort: {
        createdAt: -1
      },
      page: parseInt(page ? page : 1),
      limit: parseInt(pageSize ? pageSize : 20),
    };
    try {
      const venues = await this.getVenues(company, options);
      // validate exist page
      if (options.page && venues.pages && venues.pages < options.page) {
        res.status(400).json({
          error: 'La página solicitada no existe.',
          status: 200,
        });
      } else {
        res.json({
          count: venues.total,
          pages: venues.pages,
          hasPrevious: options.page && options.page > 1 && venues.pages && venues.pages >= options.page,
          hasNext: options.page && venues.pages && venues.pages > options.page,
          results: venues.docs,
          status: 200,
        });
      }
    } catch (e) {
      if (e) res.status(500).json(e);
    }
  }

  private getVenues(company: ObjectID, options: PaginateOptions): Promise<PaginateResult<IVenueModel>> {
    return new Promise((resolve, reject) => {
      Venue.paginate({company}, options, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new AdminVenuesController();
