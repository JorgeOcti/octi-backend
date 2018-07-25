"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("../../../server");
const car_model_1 = require("../../models/car.model");
class AdminCarsController {
    constructor() {
        this.index = this.index.bind(this);
        this.importCars = this.importCars.bind(this);
    }
    async index(req, res) {
        res.render('app/index', { token: await req.user.generateToken() });
    }
    async importCars(req, res) {
        const company = req.user.company;
        const cars = req.body;
        if (cars && cars.length) {
            for (const car of cars) {
                setTimeout(async () => {
                    const vin2 = car.vin.substr(car.vin.length - 6);
                    try {
                        const newCar = await car_model_1.default.findOneOrCreate({
                            vin: car.vin,
                            company
                        }, {
                            vin: car.vin,
                            vin2,
                            bran: car.brand ? car.brand : '',
                            denomination: car.denomination ? car.denomination : '',
                            color: car.color ? car.color : '',
                            company
                        });
                        // io.to(req.user._id).emit('STATUS-CARS', {newCar});
                        console.log('newCar', newCar);
                    }
                    catch (e) {
                        console.log(e);
                    }
                }, 1000);
            }
            // cars.forEach(async (car: any) => {
            // });
            server_1.io.to(req.user._id).emit('FINISH-IMPORT', { finish: true });
        }
    }
}
exports.default = new AdminCarsController();
//# sourceMappingURL=car.admin.controller.js.map