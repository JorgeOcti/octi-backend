import * as mongoose from 'mongoose';
import { AggregatePaginateModel, PaginateModel } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { IMilestoneType } from '../interfaces/milestoneType.interface';
import mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

export interface IMilestoneTypeModel extends IMilestoneType, mongoose.Document {}

const milestoneTypeSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  name: {
    type: String
  },
  needMarkBorder: {
    type: Boolean,
    default: false
  },
}, {
  timestamps: true
});

milestoneTypeSchema.statics.findOneOrCreate = function(condition: any, create: any): Promise<IMilestoneTypeModel> {
  const model = this;
  return new Promise((resolve, reject) => {
    model.findOne(condition, (err: any, result: IMilestoneTypeModel) => {
      if (err) {
        return reject(err);
      }
      if (result) {
        return resolve(result);
      }
      model.create(create, (err: any, result: IMilestoneTypeModel) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    });
  });
};

milestoneTypeSchema.index({ 'team': 1 });

milestoneTypeSchema.plugin(mongoosePaginate);
milestoneTypeSchema.plugin(mongooseAggregatePaginate);

export type MilestoneTypeSchema = mongoose.Model<IMilestoneTypeModel>
  & PaginateModel<IMilestoneTypeModel> & AggregatePaginateModel<IMilestoneTypeModel> & {
  findOneOrCreate(condition: any, create: any): Promise<IMilestoneTypeModel>
};

const MilestoneType = mongoose.model<IMilestoneTypeModel, MilestoneTypeSchema>('MilestoneType', milestoneTypeSchema);

export default MilestoneType;
