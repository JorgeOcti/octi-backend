import * as mongoose from 'mongoose';
import * as moment from 'moment';
import History from '../../app/models/history.model';
import Team from '../../app/models/team.model';
import Damages from '../../form/models/damages.model';
import Kind from '../../form/models/kind.model';
import Part from '../../form/models/part.model';
import Participant from '../../form/models/participant.model';
import Position from '../../form/models/position.model';
import Car from '../../app/models/car.model';

import {
  IIntegration,
  IIntegrationAction
} from '../interfaces/integration.interface';

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
    // logger.debug(
    //   `FormImporter.import ${this.integration.name} -> ${this.action.name} Importing ${data.length} participants`
    // );
    while (data.length) {
      const batch = data.splice(0, 10);
      const processedBatch = await Promise.all(
        batch.map(async (row) => {
          const { externalId, form, user, vin, venue, createdAt } = row;
          const completedForm = await this.makeCompletedForm({
            externalId,
            form,
            user,
            vin,
            venue,
            createdAt
          });
          return completedForm;
        })
      );
      // if (processedBatch.length) {
      //   const show = processedBatch[0];
      //   console.dir(show, { depth: 2 });
      // }
      await Participant.bulkWrite(processedBatch);
    }
    return true;
  }

  protected async makeCompletedForm({
    externalId,
    form,
    user,
    vin,
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
    const car = await Car.findOneAndUpdate(
      {
        $and: [
          {
            team: venue.company.team,
            vin
          }
        ]
      },
      {
        $set: {
          vin,
          company: venue.company._id
        }
      },
      { upsert: true, new: true }
    );
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
