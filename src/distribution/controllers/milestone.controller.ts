import { IRequest } from '../../interfaces/global.interface';
import { Response } from 'express';
import Milestone, { ChoicesKindMilestone, ChoicesStepMilestone, IMilestoneModel } from '../models/milestone.model';
import { PaginateOptions, PaginateResult } from 'mongoose';
import logger from '../../services/logger.service';

class MilestoneController {

  constructor() {
    this.index = this.index.bind(this);
    this.apiList = this.apiList.bind(this);
    // this.apiDetail = this.apiDetail.bind(this);
    // this.apiCreate = this.apiCreate.bind(this);
    // this.apiUpdate = this.apiUpdate.bind(this);
    // this.apiDelete = this.apiDelete.bind(this);
    this.getMilestone = this.getMilestone.bind(this);
  }

  public async index(req: IRequest, res: Response) {
    res.render('app/index', { token: await req.user.generateToken() });
  }

  public async apiList(req: IRequest, res: Response) {
    const { team } = req.user;
    const {
      page,
      pageSize
    } = req.query as { page: string; pageSize: string; };
    const options: PaginateOptions = {
      sort: {
        'order': 1
      },
      page: parseInt(page ? page : '1', 10),
      limit: parseInt(pageSize ? pageSize : '20', 10)
    };
    try {
      /* create default milestones */
      await Milestone.findOneOrCreate({
        step: ChoicesStepMilestone.checkItem,
        team
      }, {
        name: 'Checkear carga',
        team,
        step: ChoicesStepMilestone.checkItem,
        kind: ChoicesKindMilestone.form,
        order: 1
      });
      await Milestone.findOneOrCreate({
        step: ChoicesStepMilestone.loadEvidence,
        team
      }, {
        name: 'Evidencia de carga',
        team,
        step: ChoicesStepMilestone.loadEvidence,
        kind: ChoicesKindMilestone.file,
        order: 2
      });
      await Milestone.findOneOrCreate({
        step: ChoicesStepMilestone.finishTransmittal,
        team
      }, {
        name: 'Subir Documentos',
        team,
        step: ChoicesStepMilestone.finishTransmittal,
        kind: ChoicesKindMilestone.form,
        order: 3
      });
      /* end create default milestones */
      const filter: any = {
        team: team._id
      };
      const milestones = await this.getMilestone(filter, options);
      /* istanbul ignore if  */
      if (options.page && milestones.pages && milestones.pages < options.page) {
        res.status(400).json({
          message: 'La página solicitada no existe.',
          status: 400
        });
      } else {
        res.json({
          count: milestones.total,
          pages: milestones.pages,
          hasPrevious: options.page && options.page > 1 && milestones.pages && milestones.pages >= options.page,
          hasNext: options.page && milestones.pages && milestones.pages > options.page,
          results: milestones.docs,
          status: 200
        });
      }
    } catch (e) {
      /* istanbul ignore next */
      logger.error(`TransmittalController.apiList: Async Error.`);
      /* istanbul ignore next */
      logger.error(`{user: {_id: ${req.user._id}, email: ${req.user.email}}}`);
      res.status(500).json(e);
    }
  }

  private getMilestone(filter: any, options: PaginateOptions): Promise<PaginateResult<IMilestoneModel>> {
    return new Promise((resolve, reject) => {
      Milestone.paginate!(filter, options, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  }
}

export default new MilestoneController();
