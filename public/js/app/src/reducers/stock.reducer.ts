import {IStockState, StockReducerAction} from "../actions/stock.actions";
import * as unorm from "unorm";
import {IInventoryCar} from '../../../../../src/inventory/interfaces/inventory.interface';
import * as moment from 'moment-timezone';
import { StatusHistory } from "../../../../../src/app/models/history.types";

const initialState: IStockState = {
  cars: [],
  carsTable: [],
  filter: {
    text: '',
    property: '',
    status: [StatusHistory.available, StatusHistory.inTransit],
    venues: [],
    colors: [],
    brands: [],
    denominations: [],
    from: moment().subtract(30, 'days').startOf('day'),
    to: moment().endOf('day')
  },
  defaultSorted: [{
    dataField: 'daysInVenue',
    order: 'desc'
  }],
  dataFilters:{
    venues:[],
    colors:[],
    brands:[],
    denominations:[],
    types:[],
    properties:[],
  },
  vinInStock: {},
  searching: false,
  message: "",
  loading: true,
  source: null,
  rangeOptions: {
    startDate: moment().subtract(11, 'months').startOf('month').toDate(),
    endDate: moment().toDate(),
    maxDate: moment().toDate(),
    locale: {
      format: 'DD/MM/YYYY',
      customRangeLabel: 'Período personalizado',
      applyLabel: 'Aplicar',
      cancelLabel: 'Cancelar'
    },
    ranges: {
      // 'Este mes': [moment().startOf('month').startOf('month').toDate(), moment().endOf('month').toDate()],
      // 'Últimos 3 meses': [moment().startOf('month').subtract(3, 'months').startOf('month').toDate(), moment().endOf('month').toDate()],
      // 'Últimos 6 meses': [moment().startOf('month').subtract(6, 'months').startOf('month').toDate(), moment().endOf('month').toDate()],
      // 'Último año': [moment().startOf('month').subtract(12, 'months').startOf('month').toDate(), moment().endOf('month').toDate()]
    },
    opens: 'left'
  }
};

export interface IFilterStock {
  text: string;
  status: string[];
  property: string;
  venues: string[];
  colors: string[];
  brands: string[];
  denominations: string[];
  from: any;
  to: any;
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
        ...processCars(state.cars, action.payload.filter),
        filter: action.payload.filter,
        searching: isSearching(action.payload.filter)
      };
    case '/STOCK/CHANGE_ORDER':
      return {
        ...state,
        defaultSorted: [action.payload.order]
      }
    case '/STOCK/LOAD':
      let rangeOptions: any = state.rangeOptions;
      let filter: any = state.filter;
      if (action.payload.inventories.length && !Object.keys(state.rangeOptions.ranges as any).length) {
        if (action.payload.inventories.length === 2) {
          rangeOptions['ranges']['Último inventario'] = [moment(action.payload.inventories[0].createdAt).startOf('day'), moment().endOf('day')];
          rangeOptions['ranges']['Penúltimo inventario'] = [moment(action.payload.inventories[1].createdAt).startOf('day'), moment().endOf('day')];
          rangeOptions['startDate'] = moment(action.payload.inventories[0].createdAt).startOf('day');
          rangeOptions['endDate'] = moment().endOf('day');
          filter['from'] = moment(action.payload.inventories[0].createdAt).startOf('day');
          filter['to'] = moment().endOf('day');
        }
        if (action.payload.inventories.length === 1) {
          rangeOptions['ranges']['Último inventario'] = [moment(action.payload.inventories[0].createdAt).startOf('day'), moment(action.payload.inventories[0].finalizedAt).endOf('day')];
          rangeOptions['startDate'] = moment(action.payload.inventories[0].createdAt).startOf('day');
          rangeOptions['endDate'] = moment().endOf('day');
          filter['from'] = moment(action.payload.inventories[0].createdAt).startOf('day');
          filter['to'] = moment().endOf('day');
        }
      }
      return {
        ...state,
        cars: action.payload.cars,
        ...processCars(action.payload.cars, state.filter),
        dataFilters: processfilters(action.payload.cars),
        message: action.payload.message,
        filter,
        rangeOptions
      };
    default:
      return state;
  }
}

function isSearching(filter: IFilterStock){
  const {text, brands, venues, colors, denominations, property, status} = filter;
  return !!(text.length || brands.length || venues.length || colors.length || denominations.length || property.length || status.length);
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

    if (!car.car)
      continue;
    const {color, property, type, brand, denomination} = car.car;
    const {from, to } = car as any;
    let venue = to ? to : from ? from : null;
    let venueFound = to ? to : from ? from : null;
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
    if (venue && !venuesKeys.includes(venue._id)) {
      venuesKeys.push(venue._id);
      venues.push(venue);
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

function processCars(cars: IInventoryCar[], filter: IFilterStock): { carsTable: any[]; vinInStock: any; } {
  const data: any[] = [];
  let vinInStock: any = {};
  for (const car of cars) {

    if (!car.car)
      continue;

    let add = true;
    let venue = (car as any).to ? (car as any).to : (car as any).from;

    if (filter.from) {
      add = moment(car.createdAt).isSameOrAfter(filter.from);
    }
    if (add && filter.to) {
      add = moment(car.createdAt).isSameOrBefore(filter.to);
    }
    if (add && filter && filter.venues && filter.venues.length && venue) {
      add = (filter.venues as any).includes(venue._id);
    }
    if (add && filter && filter.brands && filter.brands.length && car.car.brand) {
      add = (filter.brands as any).includes(car.car.brand);
    }
    if (add && filter && filter.denominations && filter.denominations.length && car.car.denomination) {
      add = (filter.denominations as any).includes(car.car.denomination);
    }
    if (add && filter && filter.colors && filter.colors.length && car.car.color) {
      add = (filter.colors as any).includes(car.car.color);
    }
    if (add && filter && filter.property && filter.property.length) {
      add = car.car.property === filter.property;
    }
    if (add && filter && filter.status && filter.status.length) {
      add = filter.status.includes(car.status);
    }
    if (add && filter && filter.text && filter.text.length) {
      const result: boolean[] = filter.text.toLowerCase().split(' ').map((text) => (
        unorm.nfd(`${car.car.vin}${car.car.brand}${car.car.color}${car.car.denomination}${car.car.patent}${car.car.internalNumber}`)
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .includes(text.toLowerCase())
      ));
      add = result.every((element: boolean) => element);
    }

    const patent: string = car.car.patent ? car.car.patent : '';
    if (add) {
      const {vin} = car.car;
      if (!vinInStock.hasOwnProperty(vin)) {
        vinInStock[vin] = {
        }
      }
      const venueFoundID = venue ? venue._id : '-';
      let daysInVenue = null;
      let daysPermanence = moment().diff(moment(car.car.createdAt), 'days');
      let receptionVenue = null;

      if (car.car?.meta?.location?.venue && car.car.meta.location.venue._id === venueFoundID) {
        receptionVenue = car.car.meta.location.checkedDate;
        daysInVenue = moment().diff(moment(receptionVenue), 'days');
      }

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
        meta: car.car.meta,
        venue: (car as any).to ? (car as any).to.name : (car as any).from ? (car as any).from.name : '-',
        images: car.images && car.images.length ? car.images : [],
        comments: car.comments && car.comments.length ? car.comments : [],
        countComments: car.comments && car.comments.length ? car.comments.length : 0,
        venueFoundID,
        venueFound: (car as any).to ? (car as any).to.name : (car as any).from ? (car as any).from.name : '-',
        receptionVenue,
        lastUpdate: car.createdAt,
        daysInVenue,
        movements: car.car.events.length,
        daysPermanence,
        patent,
        inventoriedBy: car.inventoriedBy ? `${car.inventoriedBy.firstName} ${car.inventoriedBy.lastName}` : '-',
        status: car.status,
        option: car.status
      });
    }
  }
  return {
    carsTable: data,
    vinInStock
  };
}

