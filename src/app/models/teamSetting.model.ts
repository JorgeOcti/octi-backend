import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import { ITeamSetting } from '../interfaces';
import { ICarModel } from './car.model';

export interface ITeamSettingModel extends ITeamSetting, mongoose.Document {
}

const formSettingSchema = new mongoose.Schema({
  vinMinCharacters: {
    type: Number,
    default: 17
  },
  vinMaxCharacters: {
    type: Number,
    default: 17
  },

});

const helpPhonesSettingSchema = new mongoose.Schema({
  transmittal: {
    type: String,
  }
});

const inventorySettingSchema = new mongoose.Schema({
  pending: {
    type: String
  },
  pendingClass: {
    type: String
  },
  pendingColor: {
    type: String
  },
  found: {
    type: String
  },
  foundClass: {
    type: String
  },
  foundColor: {
    type: String
  },
  missing: {
    type: String
  },
  missingClass: {
    type: String
  },
  missingColor: {
    type: String
  },
  leftover: {
    type: String
  },
  leftoverClass: {
    type: String
  },
  leftoverColor: {
    type: String
  },
  leftoverDifferentVenue: {
    type: Boolean,
    default: false
  },
  reported: {
    type: String
  },
  reportedClass: {
    type: String
  },
  reportedColor: {
    type: String
  }
});

const requestSettingSchema = new mongoose.Schema({
  denomination: {
    type: Boolean,
    default: true
  },
  denominationRequired: {
    type: Boolean,
    default: true
  },
  material: {
    type: Boolean,
    default: true
  },
  materialRequired: {
    type: Boolean,
    default: true
  },
  color: {
    type: Boolean,
    default: true
  },
  colorRequired: {
    type: Boolean,
    default: true
  },
  internalNumber: {
    type: Boolean,
    default: true
  },
  internalNumberRequired: {
    type: Boolean,
    default: true
  },
  internalNumberText: {
    type: String,
    default: 'Número interno'
  }
});

const teamSettingSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  inventory: inventorySettingSchema,
  request: requestSettingSchema,
  helpPhones: helpPhonesSettingSchema,
  form: formSettingSchema
}, {
  timestamps: true
});
// db.teamsettings.updateMany({}, {$set:{request:{denomination: true, denominationRequired: true, material: true, materialRequired: true, internalNumber: true, internalNumberRequired: false, internalNumberText:  "Número interno", color: true, colorRequired: true}}},{many: true});

// db.teamsettings.updateMany({}, { $set: { form: { vinMinCharacters: 17, vinMaxCharacters: 17 } } }, { many: true });


teamSettingSchema.statics.findOneOrCreate = function(condition: any, create: any): Promise<ICarModel> {
  const model = this;
  return new Promise((resolve, reject) => {
    model.findOne(condition, (err: any, result: ICarModel) => {
      if (err) {
        return reject(err);
      }
      if (result) {
        return resolve(result);
      }
      model.create(create, (err: any, result: ICarModel) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  });
};

export type TeamSettingSchema = mongoose.Model<ITeamSettingModel> & PaginateModel<ITeamSettingModel> & {
  findOneOrCreate(condition: any, create: any): Promise<ITeamSettingModel>
};

const TeamSetting = mongoose.model<ITeamSettingModel, TeamSettingSchema>('TeamSetting', teamSettingSchema);

export default TeamSetting;
