import {Request, Response} from "express";

class AdminCarsController {

  constructor() {
    this.index = this.index.bind(this);
  }

  public async index(req: Request, res: Response) {
    res.render('app/index');
  }
}

export default new AdminCarsController();
