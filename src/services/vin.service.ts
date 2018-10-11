import Countries from './data/countries';
import Manufacturers from './data/manufacters';
import Years from './data/years';

interface IIndex {
  [key: string]: number;
}

interface IManufacturers {
  [key: string]: string;
}

interface IYears {
  [key: string]: number;
}

class VINService {

  protected INDEXES: IIndex = {
    MADE_IN_START: 0,
    MADE_IN_END: 2,
    MANUFACTURER_START: 0,
    MANUFACTURER_END: 3,
    DETAILS_START: 3,
    DETAILS_END: 8,
    SECURITY_CODE: 8,
    YEAR: 9,
    ASSEMBLY_PLANT: 10,
    SERIAL_NUMBER_START: 11
  };

  protected manufacturers: IManufacturers;
  protected years: IYears;
  protected countries: any;

  constructor() {
    this.manufacturers = Manufacturers;
    this.years = Years;
    this.countries = Countries;
  }

  public decode(vin: string) {
    if (vin && vin.length > 12) {
      const codeValues = this.split(vin);
      return {
        serialNumber: codeValues.serialNumber,
        securityCode: codeValues.securityCode,
        year: this.getYear(codeValues.year),
        country: this.getCountry(codeValues.madeIn),
        details: codeValues.details,
        manufacturer: this.getManufacturer(codeValues.manufacturer)
      };

    } else {
      return 'Este VIN no ha podido ser procesado. =(';
    }
  }

  public split(vin: string) {
    return {
      madeIn: vin.substring(this.INDEXES.MADE_IN_START, this.INDEXES.MADE_IN_END),
      manufacturer: vin.substring(this.INDEXES.MANUFACTURER_START, this.INDEXES.MANUFACTURER_END),
      details: vin.substring(this.INDEXES.DETAILS_START, this.INDEXES.DETAILS_END),
      securityCode: vin.charAt(this.INDEXES.SECURITY_CODE),
      year: vin.charAt(this.INDEXES.YEAR),
      assemblyPlant: vin.charAt(this.INDEXES.ASSEMBLY_PLANT),
      serialNumber: vin.substring(this.INDEXES.SERIAL_NUMBER_START)
    };
  }

  protected getManufacturer(code: string) {
    return this.manufacturers.hasOwnProperty(code) ? this.manufacturers[code] : '';
  }

  protected getYear(code: string) {
    return this.years.hasOwnProperty(code) ? this.years[code] : '';
  }

  protected getCountry(code: string) {
    return this.countries.hasOwnProperty(code) ? this.countries[code] : '';
  }
}

export default new VINService();
