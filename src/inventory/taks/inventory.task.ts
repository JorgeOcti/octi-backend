import {Job, Queue} from 'kue';
import CarModel from '../../app/models/car.model';
import logger from '../../services/logger.service';

class InventoryQueue {
  private queue: Queue;

  constructor(queue: Queue) {
    this.queue = queue;
    this.updateCar = this.updateCar.bind(this);
  }

  public run() {
    this.queue.process('updateCar', this.updateCar);
  }

  private async updateCar(job?: Job, done?: (error?: Error | null, data?: object) => void) {
    if (job && done) {
      logger.info('updateCar');
      logger.info(JSON.stringify(job.data));
      const {car} = job.data;
      try {
        const carToUpdate = await CarModel.findById(job.data.currentCar);
        let update = false;
        if (carToUpdate) {
          if (car.color && carToUpdate.color !== car.color) {
            update = true;
            carToUpdate.color = car.color;
          }
          if (car.denomination && carToUpdate.denomination !== car.denomination) {
            update = true;
            carToUpdate.denomination = car.denomination;
          }
          if (car.brand && carToUpdate.brand !== car.brand) {
            update = true;
            carToUpdate.brand = car.brand;
          }
          if (car.property && carToUpdate.property !== car.property) {
            update = true;
            carToUpdate.property = car.property;
          }
          if (car.type && carToUpdate.type !== car.type) {
            update = true;
            carToUpdate.type = car.type;
          }
          if (car.patent && carToUpdate.patent !== car.patent) {
            update = true;
            carToUpdate.patent = car.patent;
          }
          if (update) {
            await carToUpdate.save();
            logger.info('car updated');
            job.log('car updated');
          } else {
            logger.info('car no updated');
            job.log('car no updated');
          }
        }
        done(null, {});
      } catch (e) {
        done(e);
      }
    }
  }
}

export default InventoryQueue;
