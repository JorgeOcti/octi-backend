import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import type { IGPSPosition } from '../interfaces/gpsPosition.interface';

export interface IGPSPositionModel
  extends IGPSPosition,
    mongoose.Document<any> {}

const gpsPositionSchema = new mongoose.Schema(
  {
    lat: {
      type: Number
    },
    lng: {
      type: Number
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue'
    },
    os: {
      type: String
    },
    accuracy: {
      type: Number
    },
    provider: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

gpsPositionSchema.plugin(mongoosePaginate);

const GPSPosition = mongoose.model<IGPSPositionModel>(
  'GPSPosition',
  gpsPositionSchema
);

export default GPSPosition;
