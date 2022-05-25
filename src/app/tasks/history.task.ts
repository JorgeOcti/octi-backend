import { Job, Queue } from 'kue';
import InventoryCar from '../../inventory/models/inventoryCar.model';
import carTracker from '../controllers/tracker/car.tracker';

class HistoryQueue {
  private queue: Queue;

  constructor(queue: Queue) {
    this.queue = queue;
    this.processFinishInventory = this.processFinishInventory.bind(this);
  }

  public run() {
    this.queue.process('finishInventory', this.processFinishInventory);
  }

  private async processFinishInventory(job: Job, done: (error?: Error | null, data?: object) => void) {
    if (job) {
      job.log('start processFinishInventory');
      try {
        const inventoryCarcursor = await InventoryCar
          .find({
            inventory: job.data.inventory
          }, {
            _id: true
          })
          .batchSize(20)
          .cursor();
        inventoryCarcursor.on('data', async (inventoryCar) => {
          try {
            await carTracker.fromInventoryCar({ id: inventoryCar._id });
          } catch (e) {
            console.log('error:', e);
          }
        });
        inventoryCarcursor.on('end', async () => {
          done(null, {});
        });

      } catch (e) {
        done(e);
      }
    }
  }
}

export default HistoryQueue;
