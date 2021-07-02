import {IRequest} from "../../interfaces/global.interface";
import {Response} from "express";

class TransmittalItemController {

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
      api: 'TransmittalItemController:apiDetail'
    })
  }

  public async apiCreate(req: IRequest, res: Response) {
    res.json({
      api: 'TransmittalItemController:apiCreate'
    })
  }

  public async apiDelete(req: IRequest, res: Response) {
    res.json({
      api: 'TransmittalItemController:apiDelete'
    })
  }
}

export default new TransmittalItemController();
