"use strict";
exports.__esModule = true;
var RequestItemMeta = /** @class */ (function () {
    function RequestItemMeta() {
        this.processUser = this.processUser.bind(this);
        this.processRequest = this.processRequest.bind(this);
        this.processCar = this.processCar.bind(this);
        this.processVenue = this.processVenue.bind(this);
        this.processMeta = this.processMeta.bind(this);
    }
    RequestItemMeta.prototype.processUser = function (user) {
        return {
            _id: user._id,
            team: user.team,
            company: user.company,
            firstName: user.firstName,
            lastName: user.lastName,
            venue: user.venue
        };
    };
    RequestItemMeta.prototype.processRequest = function (request) {
        return {
            _id: request._id,
            number: request.number,
            sellerText: request.sellerText,
            advancePaymentInformation: request.advancePaymentInformation
        };
    };
    RequestItemMeta.prototype.processCar = function (car) {
        return {
            _id: car._id,
            team: car.team,
            company: car.company,
            vin: car.vin,
            vin2: car.vin2,
            entry: car.entry,
            brand: car.brand,
            color: car.color,
            denomination: car.denomination,
            material: car.material,
            property: car.property
        };
    };
    RequestItemMeta.prototype.processVenue = function (venue) {
        return {
            _id: venue._id,
            team: venue.team,
            company: venue.company,
            name: venue.name
        };
    };
    RequestItemMeta.prototype.processMeta = function (_a) {
        var request = _a.request, car = _a.car, user = _a.user, origin = _a.origin, destination = _a.destination, status = _a.status;
        if (request) {
            request = this.processRequest(request);
        }
        if (car) {
            car = this.processCar(car);
        }
        if (user) {
            user = this.processUser(user);
        }
        if (origin) {
            origin = this.processVenue(origin);
        }
        if (destination) {
            destination = this.processVenue(destination);
        }
        return {
            request: request,
            car: car,
            user: user,
            origin: origin,
            destination: destination,
            status: status
        };
    };
    return RequestItemMeta;
}());
var requestItemsMeta = new RequestItemMeta();
exports["default"] = requestItemsMeta;
//# sourceMappingURL=requestIteam.meta.js.map