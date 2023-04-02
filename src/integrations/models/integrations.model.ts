import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';

import type { IIntegration } from '../interfaces/integration.interface';
import { PaginateModel } from 'mongoose';

export interface IIntegrationModel
  extends IIntegration,
    mongoose.Document<any> {}

const integrationConfigSchema = new mongoose.Schema({
  username: {
    type: String
  },
  password: {
    type: String
  },
  host: {
    type: String
  },
  login: {
    type: String
  },
  type: {
    type: String
  }
});

const integrationAction = new mongoose.Schema({
  name: {
    type: String
  },
  type: {
    type: String
  },
  url: {
    type: String
  },
  venue: {
    type: String
  },
  form: {
    type: String
  },
  user: {
    type: String
  }
});

const integrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    token: {
      type: String,
    },
    config: integrationConfigSchema,
    actions: [integrationAction],
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

integrationSchema.plugin(mongoosePaginate);

export type IntegrationSchema = mongoose.Model<IIntegrationModel> &
  PaginateModel<IIntegrationModel> & {};

const Integration = mongoose.model<IIntegrationModel, IntegrationSchema>(
  'Integration',
  integrationSchema
);
export default Integration;
