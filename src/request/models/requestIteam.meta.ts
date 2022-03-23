class RequestItemMeta {

  constructor() {
    this.processUser = this.processUser.bind(this);
    this.processRequest = this.processRequest.bind(this);
    this.processCar = this.processCar.bind(this);
    this.processVenue = this.processVenue.bind(this);
    this.processMeta = this.processMeta.bind(this);
  }

  public processUser(user: any) {
    return {
      _id: user._id,
      team: user.team,
      company: user.company,
      firstName: user.firstName,
      lastName: user.lastName,
      venue: user.venue
    };
  }

  public processRequest(request: any) {
    return {
      _id: request._id,
      number: request.number,
      sellerText: request.sellerText,
      advancePaymentInformation: request.advancePaymentInformation
    };
  }

  public processCar(car: any) {
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
  }

  public processVenue(venue: any) {
    return {
      _id: venue._id,
      team: venue.team,
      company: venue.company,
      name: venue.name
    };
  }

  public processMeta({ request, car, user, origin, destination, status }: any) {
    const data: any = {};
    if (request) {
      data.request = this.processRequest(request);
    }
    if (car) {
      data.car = this.processCar(car);
    }
    if (user) {
      data.user = this.processUser(user);
    }
    if (origin) {
      data.origin = this.processVenue(origin);
    }
    if (destination) {
      data.destination = this.processVenue(destination);
    }
    return {
      request, car, user, origin, destination, status
    };
  }
}

const requestItemsMeta = new RequestItemMeta();
export default requestItemsMeta;
