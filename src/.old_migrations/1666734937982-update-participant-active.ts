import * as mongoose from 'mongoose';

import Form from '../form/models/form.model';
import Participant from '../form/models/participant.model';

mongoose.set('strictQuery', false);
mongoose.set('debug', true);

/*
* Migration: update-participant-active
* npm exec migrate up update-participant-active
* npm exec migrate down update-participant-active
* */

// Make any changes you need to make to the database here
export async function up() {
  await this.connect(mongoose);
  const activeForms = await Form.find({ active: true }, { _id: true , 'active': true });
  await Participant.updateMany({
    // form: { $nin: activeForms.map((f) => f._id)  },
  }, {
    $set: {
      active: false
    }
  });
  await Participant.updateMany({
    form: { $in: activeForms.map((f) => f._id)  }
  }, {
    $set: {
      active: true
    }
  });
}

// Make any changes that UNDO the up function side effects here (if possible)
export async function down() {
  await this.connect(mongoose);
}
