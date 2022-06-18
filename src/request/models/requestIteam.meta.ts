class RequestItemMeta {

  constructor() {
    this.processUser = this.processUser.bind(this);
    this.processRequest = this.processRequest.bind(this);
    this.processCar = this.processCar.bind(this);
    this.processVenue = this.processVenue.bind(this);
    this.processMeta = this.processMeta.bind(this);
    this.processTransmittal = this.processTransmittal.bind(this);
  }

  public processUser(user: any) {
    return {
      _id: user._id,
      team: user.team,
      company: user.company,
      firstName: user.firstName,
      lastName: user.lastName,
      venue: user.venue,
      email: user.email,
      createdAt: user.createdAt
    };
  }

  public processRequest(request: any) {
    return {
      _id: request._id,
      number: request.number,
      createdBy: request.createdBy,
      sellerText: request.sellerText,
      conectaID: request.conectaID,
      advancePaymentInformation: request.advancePaymentInformation,
      createdAt: request.createdAt
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
      property: car.property,
      createdAt: car.createdAt
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

  public processTransmittal(transmittal: any) {
    return {
      _id: transmittal._id,
      team: transmittal.team,
      company: transmittal.company,
      createdBy: transmittal.createdBy,
      transporter: transmittal.transporter,
      number: transmittal.number,
      status: transmittal.status,
      createdAt: transmittal.createdAt
    };
  }

  public processMeta({ request, car, user, origin, destination, status, transmittal }: any) {
    if (request) {
      request = this.processRequest(request);
    }
    if (transmittal) {
      transmittal = this.processTransmittal(transmittal);
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
      request, car, user, origin, destination, status, transmittal
    };
  }
}

const requestItemsMeta = new RequestItemMeta();
export default requestItemsMeta;
