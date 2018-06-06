import {Request, Response} from "express";
import Venue from '../../models/venue.model'

class AdminVenuesController {
  constructor() {
    this.index = this.index.bind(this);
    this.getVenues = this.getVenues.bind(this);
  }

  public index(req: Request, res: Response) {

  }

  private getVenues() {
    return new Promise((resolve, reject) => {
      Venue.find({}, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new AdminVenuesController();
