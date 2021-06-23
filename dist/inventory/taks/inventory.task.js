"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const car_model_1 = require("../../app/models/car.model");
const logger_service_1 = require("../../services/logger.service");
class InventoryQueue {
    queue;
    constructor(queue) {
        this.queue = queue;
        this.updateCar = this.updateCar.bind(this);
    }
    run() {
        this.queue.process('updateCar', this.updateCar);
    }
    async updateCar(job, done) {
        if (job && done) {
            logger_service_1.default.info('updateCar');
            logger_service_1.default.info(JSON.stringify(job.data));
            const { car } = job.data;
            try {
                const carToUpdate = await car_model_1.default.findById(job.data.currentCar);
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
                        logger_service_1.default.info('car updated');
                        job.log('car updated');
                    }
                    else {
                        logger_service_1.default.info('car no updated');
                        job.log('car no updated');
                    }
                }
                done(null, {});
            }
            catch (e) {
                done(e);
            }
        }
    }
}
exports.default = InventoryQueue;
//# sourceMappingURL=inventory.task.js.map