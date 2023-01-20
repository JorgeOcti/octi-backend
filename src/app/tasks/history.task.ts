import * as Queue from 'bull';
import InventoryCar from '../../inventory/models/inventoryCar.model';
import { createRedisClient } from '../../services/redis.service';
import carTracker from '../controllers/tracker/car.tracker';

class HistoryQueue {
  public queue: Queue.Queue;
  readonly processJob: boolean = true;

  constructor() {
    this.queue = new Queue('finishInventory', {
      createClient: () => {
        return createRedisClient();
      },
      prefix: '{andes}'
    });
    this.process = this.process.bind(this);
  }

  public run() {
    this.queue.process('finishInventory', this.process);
  }

  private async process(job: Queue.Job<any>, done: Queue.DoneCallback) {
    if (this.processJob) {
      job.log('start process');
      try {
        const inventoryCarcursor = await InventoryCar.find(
          {
            inventory: job.data.inventory
          },
          {
            _id: true
          }
        )
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

const historyQueue = new HistoryQueue();
export default historyQueue;
