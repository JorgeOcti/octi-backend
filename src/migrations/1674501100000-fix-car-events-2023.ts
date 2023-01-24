import * as mongoose from 'mongoose';
import carTracker from '../app/controllers/tracker/car.tracker';
import Car from '../app/models/car.model';

mongoose.set('strictQuery', false);
mongoose.set('debug', true);

/*
* Migration: fix-car-events-2023
* npm exec migrate up fix-car-events-2023
* npm exec migrate down fix-car-events-2023
* */

// Make any changes you need to make to the database here
export async function up() {
  await this.connect(mongoose);
  const carsCursor = Car.find({}, { _id: 1, history: 1 }).cursor()
  await carsCursor.eachAsync(async (car: any) => {
    await carTracker.updateCurrentHistory(car)
  });
}

// Make any changes that UNDO the up function side effects here (if possible)
export async function down() {
  await this.connect(mongoose);
}
