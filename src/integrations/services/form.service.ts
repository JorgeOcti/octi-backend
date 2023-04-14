import * as moment from 'moment';
import * as mongoose from 'mongoose';

import {
  IIntegration,
  IIntegrationAction
} from '../interfaces/integration.interface';

import Damages from '../../form/models/damages.model';
import History from '../../app/models/history.model';
import Kind from '../../form/models/kind.model';
import Part from '../../form/models/part.model';
import Participant from '../../form/models/participant.model';
import Position from '../../form/models/position.model';
import Team from '../../app/models/team.model';
import carTracker from '../../app/controllers/tracker/car.tracker';
import logger from '../../services/logger.service';

export default class FormImporter {
  private _isFormInCache: any = {};

  protected participantObject: any = {};

  constructor(
    protected type: string,
    protected integration: IIntegration,
    protected action: IIntegrationAction
  ) {
    mongoose.set('debug', false);
    new Damages();
    new Participant();
    new History();
    new Part();
    new Position();
    new Kind();
    this.getFormNumber = this.getFormNumber.bind(this);
    this.makeCompletedForm = this.makeCompletedForm.bind(this);
    this.import = this.import.bind(this);
  }

  protected async getFormNumber({ team }: any): Promise<any> {
    const formNumber = await Team.findOneAndUpdate(
      {
        _id: team
      },
      {
        $inc: { formsNumber: 1 }
      },
      {
        new: true
      }
    );
    return formNumber?.formsNumber;
  }

  public async import({ data }: { data: any[] }) {
    while (data.length) {
      const batch = data.splice(0, 10);
      let processedBatch = await Promise.all(
        batch.map(async (row) => {
          const {
            externalId,
            form,
            user,
            car,
            venue,
            createdAt,
            updateCarData
          } = row;
          const completedForm = await this.makeCompletedForm({
            externalId,
            form,
            user,
            car,
            venue,
            createdAt,
            updateCarData
          });
          return completedForm;
        })
      );
      processedBatch = processedBatch.filter((item) => item?.updateOne === null);
      if (processedBatch.length) {
        logger.debug(
          `FormImporter.import ${this.integration.name} -> ${this.action.name} Importing ${data.length} participants`
        );
        const show = processedBatch[0];
        console.dir(show, { depth: 2 });
      }

      const bulk = await Participant.bulkWrite(processedBatch);
      if (Object.values(bulk.insertedIds).length) {
        console.log(Object.values(bulk.insertedIds));
        const carTrackers = [];
        for (const participant of Object.values(bulk.insertedIds)) {
          carTrackers.push(carTracker.fromParticipant({ id: participant }));
        }
        await Promise.all(carTrackers);
      }
    }
    return true;
  }

  protected async makeCompletedForm({
    externalId,
    form,
    user,
    car,
    venue,
    createdAt
  }: any) {
    if (!this._isFormInCache[form._id]?.name) {
      this.participantObject = {
        name: form.name,
        sections: [],
        deliveryToCustomer: form.deliveryToCustomer,
        description: form.description,
        deliveryInfo: {},
        kind: form.kind,
        qualification: 0,
        active: form.active
      };
      if (form.reception) {
        this.participantObject.reception = form.reception;
        this.participantObject.receptionText = form.receptionText;
        this.participantObject.receptionVenue = form.receptionVenue;
        this.participantObject.receptionVenueText = form.receptionVenueText;
        this.participantObject.receptionConfirmation = true;
      }
      if (form.shipping) {
        this.participantObject.shipping = form.shipping;
        this.participantObject.shippingText = form.shippingText;
        this.participantObject.shippingVenue = form.shippingVenue;
        this.participantObject.shippingVenueText = form.shippingVenueText;
        this.participantObject.shippingConfirmation = true;
      }
      for (const section of form.sections) {
        const newAnswers: any[] = [];
        for (const question of section.questions) {
          newAnswers.push({
            _id: question._id,
            question: question.question,
            kindUpdate: question?.kindUpdate,
            shortName: question.shortName,
            scale: question.scale,
            conciliation: question.conciliation,
            accessories: question.accessories,
            damages: question.damages,
            damagesSelected: [],
            accesoriesAnswered: [],
            risk: question.risk,
            observe: question.observe,
            images: [],
            qualification: 0,
            answer: null,
            comment: '',
            weight: question.weight,
            kind: question.kind,
            order: question.order,
            hint: question.hint,
            optional: question.optional,
            minValue: question.minValue,
            maxValue: question.maxValue,
            requireSeverity: question.requireSeverity
          });
        }
        this.participantObject.sections.push({
          _id: section._id,
          name: section.name,
          shortName: section.shortName,
          qualification: 0,
          answers: newAnswers,
          weight: section.weight,
          order: section.order
        });
      }
      this._isFormInCache[form._id] = true;
    }
    // console.log('createdAt', createdAt);
    // console.log(
    //   'moment(createdAt).toISOString()',
    //   moment(createdAt).toISOString()
    // );
    // console.log('moment(createdAt).toDate()', moment(createdAt).toDate());

    createdAt = moment(createdAt).toISOString();
    const existParticipant = await Participant.findOne(
      {
        $and: [
          {
            importedID: externalId,
            imported: true,
            createdAt: createdAt,
            user: user._id,
            car: car._id
          }
        ]
      },
      { _id: 1, number: 1 }
    );
    let participant = {
      imported: true,
      importedID: externalId,
      importedFrom: `${this.integration.name} -> ${this.action.name}`,
      importedType: `${this.integration.type}`,
      team: venue.company.team._id,
      company: venue.company._id,
      form: form._id,
      user: user._id,
      car: car._id,
      venue: venue._id,
      number: existParticipant
        ? existParticipant.number
        : await this.getFormNumber({ team: venue.company.team._id }),
      createdAt: createdAt,
      updatedAt: createdAt
    };
    if (existParticipant) {
      // await History.updateOne(
      //   { participant: existParticipant._id },
      //   {
      //     $set: {
      //       from: venue._id,
      //       to: venue._id
      //     }
      //   }
      // );
      return {
        updateOne: {
          filter: {
            _id: existParticipant._id
          },
          update: {
            $set: participant
          },
          upsert: false,
          timestamps: false
        }
      };
    } else {
      return {
        insertOne: {
          document: {
            ...this.participantObject,
            ...participant,
            importedAt: moment().toISOString()
          },
          timestamps: false
        }
      };
    }
  }
}
