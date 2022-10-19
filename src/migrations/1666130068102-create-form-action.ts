import * as mongoose from 'mongoose';
import Form, { KindActionForm } from '../form/models/form.model';
mongoose.set('strictQuery', false);
mongoose.set('debug', true);

/*
* npm exec migrate create create-form-action
* npm exec migrate up create-form-action
* npm exec migrate down create-form-action
* */

// Make any changes you need to make to the database here
export async function up() {
  await this.connect(mongoose);
  await Form.updateMany({ deliveryToCustomer: true }, { $set: { action: KindActionForm.delivery } });
  await Form.updateMany({ shipping: true }, { $set: { action: KindActionForm.shipping } });
  await Form.updateMany({ reception: true }, { $set: { action: KindActionForm.reception } });
}

// Make any changes that UNDO the up function side effects here (if possible)
export async function down() {
  await this.connect(mongoose);
}
