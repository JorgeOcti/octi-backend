"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class QueueServices {
    constructor(queue) {
        this.queue = queue;
        this.processors = [];
    }
    register(name, priority, call) {
        const exists = this.processors.indexOf(name);
        if (exists < 0) {
            this.processors.push(name);
            if (this.queue) {
                this.queue.process(name, priority, call);
            }
        }
    }
}
exports.QueueServices = QueueServices;
//# sourceMappingURL=queue.services.js.map