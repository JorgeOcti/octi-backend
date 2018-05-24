import {Request, Response} from 'express';

class AppController {

  constructor() {
    this.index = this.index.bind(this);
  }

  public index(req: Request, res: Response) {
    res.render('app/index', { title: 'Hey', message: 'Hello there!'});
  }
}

export default new AppController();
