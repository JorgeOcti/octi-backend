import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';

import {ITeamBilling} from '../interfaces';
import {PaginateModel} from 'mongoose';

export interface ITeamBillingModel extends ITeamBilling, mongoose.Document<any> {
}

export enum ChoicesTypeBilling {
  default = 'default',
  corporate = 'corporate',
  distributor = 'distributor'
}

export const choicesTypeBilling = [
  ChoicesTypeBilling.default,
  ChoicesTypeBilling.corporate,
  ChoicesTypeBilling.distributor
];

const sectionSchema = new mongoose.Schema({
  name: {
    type: String,
    default: ''
  },
  start: {
    type: Number
  },
  end: {
    type: Number
  },
  price: {
    type: Number
  },
  text: {
    type: String,
    default: ''
  },
  order: {
    type: Number
  }
}, {
  _id: true
});

const notificationsSchema = new mongoose.Schema({
  name: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  _id: true
});

const modulesSchema = new mongoose.Schema({
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  },
  subModules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submodule'
  }],
  sections: {
    type: [sectionSchema],
    default: []
  },
  active: {
    type: Boolean,
    default: false
  }
}, {
  _id: false
});

export const teamBillingSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  businessName: {
    type: String,
    trim: true
  },
  rut: {
    type: String,
    trim: true
  },
  baseCost: {
    type: Number,
    default: 0
  },
  textBaseCost: {
    type: String,
    default: ""
  },
  companies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }],
  notifications: {
    type: [notificationsSchema],
    default: []
  },
  modules: {
    type: [modulesSchema],
    default: []
  },
  type: {
    type: String,
    enum: choicesTypeBilling,
    default: ChoicesTypeBilling.default
  }
}, {
  timestamps: true
});

/*teamBillingSchema.set<any>('redisCache', process.env.ENV === 'production');
teamBillingSchema.set<any>('expires', 30);*/

teamBillingSchema.statics.findOneOrCreate = function(condition: any, create: any): Promise<ITeamBillingModel> {
  const model = this;
  return new Promise((resolve, reject) => {
    model.findOne(condition, (err: any, result: ITeamBillingModel) => {
      if (err) {
        return reject(err);
      }
      if (result) {
        return resolve(result);
      }
      model.create(create, (err: any, result: ITeamBillingModel) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  });
};

teamBillingSchema.plugin(mongoosePaginate);

export type TeamBillingSchema = mongoose.Model<ITeamBillingModel> & PaginateModel<ITeamBillingModel> & {
  findOneOrCreate(condition: any, create: any): Promise<ITeamBillingModel>
};

const TeamBilling = mongoose.model<ITeamBillingModel, TeamBillingSchema>('TeamBilling', teamBillingSchema);

export default TeamBilling;
