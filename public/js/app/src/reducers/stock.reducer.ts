import {IStockState, StockReducerAction} from "../actions/stock.actions";
import * as unorm from "unorm";
import {IInventoryCar} from '../../../../../src/interfaces/inventory.interface';

const initialState: IStockState = {
  cars: [],
  carsTable: [],
  filter: {
    text: '',
    property: '',
    type: '',
    venues: [],
    colors: [],
    brands: [],
    denominations: []
  },
  dataFilters:{
    venues:[],
    colors:[],
    brands:[],
    denominations:[],
    types:[],
    properties:[],
  },
  searching: false,
  message: "",
  loading: true,
  source: null
};

export interface IFilterStock {
  text: string;
  type: string;
  property: string;
  venues: string[];
  colors: string[];
  brands: string[];
  denominations: string[];
}


export function stockReducer(state = initialState, action: StockReducerAction) {
  switch (action.type) {
    case '/STOCK/IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      };
    case '/STOCK/CANCEL_REQUEST':
      return {
        ...state,
        source: action.payload.source
      };
     case '/STOCK/CHANGE_FILTER':
      return {
        ...state,
        carsTable: processCars(state.cars, action.payload.filter),
        filter: action.payload.filter,
        searching: isSearching(action.payload.filter)
      };
    case '/STOCK/LOAD':
      return {
        ...state,
        cars: action.payload.cars,
        carsTable: processCars(action.payload.cars, state.filter),
        dataFilters: processfilters(action.payload.cars),
        message: action.payload.message
      };
    default:
      return state;
  }
}

function isSearching(filter: IFilterStock){
  const {text, brands, venues, colors, denominations, property, type} = filter;
  if(text.length || brands.length || venues.length || colors.length || denominations.length || property.length || type.length) {
    return true
  }
  return false;

}

function processfilters(cars:IInventoryCar[]){
  const venues: any[] = [],
    colors: any[] = [],
    brands: any[] = [],
    denominations: any[] = [],
    types: any[] = [],
    properties: any[] = [];
  const venuesKeys: string[] = [],
    colorsKeys: string[] = [],
    brandsKeys: string[] = [],
    denominationsKeys: string[] = [],
    typesKeys: string[] = [],
    propertiesKeys: string[] = [];

  for (const car of cars) {
    const {color, property, type, brand, denomination} = car.car;
    const {venueFound} = car;
    if (brand && brand.length && !brandsKeys.includes(brand)) {
      brandsKeys.push(brand);
      brands.push(brand);
    }
    if (color && color.length && !colorsKeys.includes(color)) {
      colorsKeys.push(color);
      colors.push(color);
    }
    if (denomination && denomination.length && !denominationsKeys.includes(denomination)) {
      denominationsKeys.push(denomination);
      denominations.push(denomination);
    }
    if (type && type.length && !typesKeys.includes(type)) {
      typesKeys.push(type);
      types.push(type);
    }
    if (property && property.length && !propertiesKeys.includes(property)) {
      propertiesKeys.push(property);
      properties.push(property);
    }
    if (venueFound && !venuesKeys.includes(venueFound._id)) {
      venuesKeys.push(venueFound._id);
      venues.push(venueFound);
    }

  }
  return {
    venues: venues.sort(function(a, b){
      if(a.name < b.name) { return -1; }
      if(a.name > b.name) { return 1; }
      return 0;
    }),
    colors: colors.sort(),
    brands: brands.sort(),
    denominations: denominations.sort(),
    types: types.sort(),
    properties: properties.sort()
  }
}

function processCars(cars: IInventoryCar[], filter: IFilterStock) {
  const data: any[] = [];
  for (const car of cars) {
    let add = true;
    if (filter && filter.venues && filter.venues.length && car.venue) {
      add = (filter.venues as any).includes(car.venue._id);
      if (!add && car.venueFound) {
        add = (filter.venues as any).includes(car.venueFound._id);
      }
    }
    if (filter && filter.brands && filter.brands.length && car.car.brand) {
      add = (filter.brands as any).includes(car.car.brand);
    }
    if (filter && filter.denominations && filter.denominations.length && car.car.denomination) {
      add = (filter.denominations as any).includes(car.car.denomination);
    }
    if (filter && filter.colors && filter.colors.length && car.car.color) {
      add = (filter.colors as any).includes(car.car.color);
    }
    if (add && filter && filter.property && filter.property.length) {
      add = car.car.property === filter.property;
    }
    if (add && filter && filter.type && filter.type.length) {
      add = car.car.type === filter.type;
    }
    if (add && filter && filter.text && filter.text.length) {
      const result: boolean[] = filter.text.toLowerCase().split(' ').map((text) => (
        unorm.nfd(`${car.car.vin}${car.car.brand}${car.car.color}${car.car.denomination}${car.car.patent}${car.car.internalNumber}`)
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .includes(text.toLowerCase())
      ));
      add = result.every((element: boolean) => element === true) === true;
      /*add = `${car.car.vin}${car.car.brand}${car.car.denomination}${car.car.patent}`.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .includes(filter.text.toLowerCase());*/
    }
    const patent: string = car.car.patent ? car.car.patent : '';
    // if (add && filter && filter && filter.type.length) {
    //   if (filter.type === 'new') {
    //     add = patent.length === 0;
    //   } else if (filter.type === 'used') {
    //     add = patent.length !== 0;
    //   }
    // }
    if (add) {
      data.push({
        _id: (car as any)._id,
        carID: (car as any).car._id,
        vin: car.car.vin,
        brand: car.car.brand,
        denomination: car.car.denomination,
        internalNumber: car.car.internalNumber,
        label: car.label,
        labelName: car.label && car.label.hasOwnProperty('name') ? car.label.name : 'z',
        labelBy: car.labelBy,
        color: car.car.color,
        labelText: car.labelText,
        venue: car.venue ? car.venue.name : '-',
        images: car.images && car.images.length ? car.images : [],
        comments: car.comments && car.comments.length ? car.comments : [],
        countComments: car.comments && car.comments.length ? car.comments.length : 0,
        venueFound: car.venueFound ? car.venueFound.name : '-',
        patent,
        inventoriedBy: car.inventoriedBy ? `${car.inventoriedBy.firstName} ${car.inventoriedBy.lastName}` : '-',
        status: car.status,
        option: car.status
      });
    }
  }
  return data;
}

