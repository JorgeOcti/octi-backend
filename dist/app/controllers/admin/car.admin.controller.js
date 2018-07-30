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
                if (car.vin && car.vin.length) {
                    const vin2 = car.vin.substr(car.vin.length - 6);
                    try {
                        const newCar = await car_model_1.default.findOne({
                            vin: car.vin,
                            company
                        });
                        if (newCar) {
                            newCar.vin2 = vin2;
                            newCar.brand = car.marca ? car.marca : newCar.brand;
                            newCar.denomination = car.denominacion ? car.denominacion : newCar.denomination;
                            newCar.color = car.denominacion ? car.color : newCar.color;
                            newCar.internalNumber = car.NInterno ? car.NInterno : newCar.internalNumber;
                            newCar.destination = car.destino ? car.destino : newCar.destination;
                            await newCar.save();
                        }
                        else {
                            await car_model_1.default.create({
                                vin: car.vin,
                                vin2,
                                brand: car.marca ? car.marca : '',
                                denomination: car.denominacion ? car.denominacion : '',
                                color: car.color ? car.color : '',
                                internalNumber: car.NInterno ? car.NInterno : '',
                                destination: car.destino ? car.destino : '',
                                company
                            });
                        }
                        // io.to(req.user._id).emit('STATUS-CARS', {newCar});
                    }
                    catch (e) {
                        console.log(e);
                    }
                }
            }
            server_1.io.to(req.user._id).emit('FINISH-IMPORT', { finish: true });
        }
        res.json({
            status: 200
        });
    }
}
exports.default = new AdminCarsController();
//# sourceMappingURL=car.admin.controller.js.map