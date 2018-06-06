"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const venue_model_1 = require("../../models/venue.model");
class AdminVenuesController {
    constructor() {
        this.index = this.index.bind(this);
        this.getVenues = this.getVenues.bind(this);
    }
    index(req, res) {
    }
    getVenues() {
        return new Promise((resolve, reject) => {
            venue_model_1.default.find({}, (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
}
exports.default = new AdminVenuesController();
//# sourceMappingURL=venues.controller.js.map