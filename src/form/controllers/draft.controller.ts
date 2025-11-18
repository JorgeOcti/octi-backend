import { IRequest } from '../../interfaces/global.interface';
import { Response } from 'express';
import Draft, { IDraftModel } from '../models/draft.model';
import mongoose from 'mongoose';
import ParticipantFile from '../models/participantFile.model';
import logger from '../../services/logger.service';

class DraftController {

  constructor() {
    this.save = this.save.bind(this);
  }

  public async save(req: IRequest, res: Response){
    const {user} = req;
    const {venue} =  user;
    const {id} = req.params;
    const {answers, startedAt, car} = req.body;


    logger.info(`Save Draft from user: ${user.email}`);
    logger.info(`Saving draft for car ${car} and form ${id}`);
    logger.info(`Draft answers: ${JSON.stringify(answers)}`);
    logger.info(`Draft body: ${JSON.stringify(req.body)}`);

    if (!car) {
      return res.status(400).json({
        success: false,
        message: 'Car not found'
      });
    }

    try {
      let draft = await Draft.findOneAndUpdate(
        {
          car: new mongoose.Types.ObjectId(car),
          form: new mongoose.Types.ObjectId(id),
          venue: new mongoose.Types.ObjectId(venue._id)
        }, {
          $set: {
            answers,
          },
        },{
          new: true,
          upsert: true
        }
      )

      if (!draft.startedAt) {
        draft.startedAt = startedAt ? new Date(startedAt) : new Date();
        draft.save();
      }


      return res.status(200).json({
        status: 200,
        data: {
          draft,
        }
      });
    } catch (error) {
      logger.error(error);
      return res.status(500).json({
        status: 500,
        message: 'Error saving draft',
      });
    }
  }

  public async getDrafts(car: string, venue: string, forms?: string[]): Promise<IDraftModel[]> {
    try {
      let filter: any = {
        car: new mongoose.Types.ObjectId(car),
        venue: new mongoose.Types.ObjectId(venue),
      }
      if (forms && forms.length > 0) {
        filter['form'] = {
          $in: forms.map((form: string) => new mongoose.Types.ObjectId(form))
        }
      }
      let drafts: IDraftModel[] = await Draft.find(filter);

      for (let draft of drafts) {
        for (let questionKey in draft.answers) {
          let answer = draft.answers[questionKey];
          if (answer && answer.images) {
            let images = await ParticipantFile.find({
              _id: {
                $in: answer.images.map((image: any) => new mongoose.Types.ObjectId(image))
              }
            });
            draft.answers[questionKey].images = images;
          }
          if (answer && answer.damages){
            for (let damage of answer.damages) {
              let images = await ParticipantFile.find({
                _id: {
                  $in: damage.images.map((image: any) => new mongoose.Types.ObjectId(image))
                }
              });
              damage.images = images;
            }
          }
          if (answer && answer.matrix) {
            for (let row of answer.matrix) {
              for (let question of row){
                if (question && question.images) {
                  let images = await ParticipantFile.find({
                    _id: {
                      $in: question.images.map((image: any) => new mongoose.Types.ObjectId(image))
                    }
                  });
                  question.images = images;
                }
              }
            }
          }
        }
      }

      // drafts = drafts.map((draft: IDraftModel) => {
      //   draft.answers = draft.answers || {};
      //   logger.info(`Draft found for car ${car} and form ${JSON.stringify(Object.keys(draft.answers))}`);
      //   Object.keys(draft.answers).map(async (questionKey: any) => {
      //     let answer = draft.answers[questionKey];
      //     if (answer && answer.images) {
      //       logger.debug(`Draft answer found for question ${questionKey} and answer ${JSON.stringify(answer)}`);
      //       let images = await ParticipantFile.find({
      //         _id: {
      //           $in: answer.images.map((image: any) => new mongoose.Types.ObjectId(image))
      //         }
      //       });
      //       logger.debug(`Draft images found for question ${questionKey} and imajes ${JSON.stringify(images)}`);
      //       draft.answers[questionKey].images = images;
      //     }
      //     draft.answers[questionKey] = answer;
      //   })
      //   return draft;
      // })

      return drafts;
    } catch (error) {
      logger.error(error);
      return [];
    }
  }
}

export default new DraftController();
