import * as mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import type { ITeamSetting } from '../interfaces/teamSetting.interface';
import type { ICarModel } from './car.model';

export interface ITeamSettingModel extends ITeamSetting, mongoose.Document {
}

const helpPhonesSettingSchema = new mongoose.Schema({
  transmittal: {
    type: String,
  }
});

const UnitVocabReferenceSchema = new mongoose.Schema({
  singular: {
    type: String,
    default: "Unidad"
  },
  plural: {
    type: String,
    default: "Unidades"
  }
});

const vocabularySettingsSchema = new mongoose.Schema({
  primary: {
    type: String,
    default: "VIN"
  },
  secondary: {
    type: String,
    default: "Patente"
  },
  unitReference: {
    type: UnitVocabReferenceSchema
  }
});

const reportSettingSchema = new mongoose.Schema({
  atLeastOne: {
    type: Boolean,
    default: true
  },
  primaryRequired: {
    type: Boolean,
    default: true
  },
  secondaryRequired: {  //commonly know as Patente for the most
    type: Boolean,
    default: true
  }
});

const formSettingSchema = new mongoose.Schema({
  vinMinCharacters: {
    type: Number,
    default: 17
  },
  vinMaxCharacters: {
    type: Number,
    default: 17
  },
  report: {
    type: reportSettingSchema
  }
});

const inventorySettingSchema = new mongoose.Schema({
  report: {
    type: reportSettingSchema
  },
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
  brand:{
    type: Boolean,
    default: true
  },
  brandReadOnly:{
    type: Boolean,
    default: true
  },
  denomination: {
    type: Boolean,
    default: true
  },
  denominationReadOnly: {
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
  materialReadOnly: {
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
  colorReadOnly: {
    type: Boolean,
    default: true
  },
  colorRequired: {
    type: Boolean,
    default: true
  },
  entry: {
    type: Boolean,
    default: true
  },
  sellerText: {
    type: Boolean,
    default: true
  },
  ticket: {
    type: Boolean,
    default: true
  },
  priority: {
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
  },
  conectaID: {
    type: Boolean,
    default: true
  },
  reason: {
    type: Boolean,
    default: true
  },
  secondColorOption: {
    type: Boolean,
    default: false
  },
  thirdColorOption: {
    type: Boolean,
    default: false
  },
});

const teamSettingSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  inventory: inventorySettingSchema,
  request: requestSettingSchema,
  helpPhones: helpPhonesSettingSchema,
  form: formSettingSchema,
  vocabulary: vocabularySettingsSchema,
}, {
  timestamps: true,
});


teamSettingSchema.set<any>('redisCache', process.env.ENV === 'production');
teamSettingSchema.set<any>('expires', 30);

teamSettingSchema.index({ 'team': 1 });

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
