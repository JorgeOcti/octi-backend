import {IRequest} from "../../interfaces/global.interface";
import {Response} from "express";

class TransmittalController {

  constructor() {
    this.index = this.index.bind(this);
    this.apiList = this.apiList.bind(this);
    this.apiDetail = this.apiDetail.bind(this);
    this.apiCreate = this.apiCreate.bind(this);
    this.apiDelete = this.apiDelete.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    res.render('app/index', {token: await req.user.generateToken()});
  }

  public async apiList(req: IRequest, res: Response) {
    res.json({
      api: 'apiList:apiDetail'
    })
  }

  public async apiDetail(req: IRequest, res: Response) {
    res.json({
      api: 'TransmittalController:apiDetail'
    })
  }

  public async apiCreate(req: IRequest, res: Response) {
    res.json({
      api: 'TransmittalController:apiCreate'
    })
  }

  public async apiDelete(req: IRequest, res: Response) {
    res.json({
      api: 'TransmittalController:apiDelete'
    })
  }
}

export default new TransmittalController();
