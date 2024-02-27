import * as unorm from 'unorm';
import {
  IInventoryCar
} from '../../../../../src/inventory/interfaces/inventory.interface';
import {IInventoryState, InventoryReduxAction} from '../actions/inventory.actions';

const initialState: IInventoryState = {
  inventories: [],
  inventorySettings: {
    report: null,
    leftoverDifferentVenue: false,
    pending: "",
    pendingClass: "aqua",
    pendingColor: "",
    found: "",
    foundClass: "green",
    foundColor: "",
    missing: "",
    missingClass: "red",
    missingColor: "",
    leftover: "",
    leftoverClass: "yellow",
    leftoverColor: "",
    reported: "",
    reportedClass: "gray-dark",
    reportedColor: ""
  },
  brands: [],
  loading: true,
  inventoryCar: null,
  source: null,
  loadingDetail: true,
  fetchingDetail: false,
  summary: {
    _id: '',
    name: '',
    status: '',
    createdAt: null,
    finalizedAt: null
  },
  detail: {
    venues: [],
    cars: []
  },
  labels: [],
  detailByVenue: [],
  detailByBrand: [],
  carsTable: [],
  cardTypes: [],
  cardProperties: [],
  selectedItems: {},
  filter: {
    text: '',
    property: '',
    type: '',
    venues: [],
    states: [],
    brands: []
  },
  pagination: {
    count: 0,
    page: 1,
    pages: 1
  }
};

export interface IFilterCar {
  text: string;
  type: string;
  property: string;
  venues: string[];
  states: string[];
  brands: string[];
}

export function inventoriesReducer(state = initialState, action: InventoryReduxAction): IInventoryState {
  switch (action.type) {
    case '/INVENTORIES/IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      };
    case '/INVENTORIES/CANCEL_REQUEST':
      return {
        ...state,
        source: action.payload.source
      };
    case '/INVENTORIES/LOAD_BRANDS':
      return {
      ...state,
      brands: action.payload.brands
    };
    case '/INVENTORIES/LOAD_DATA':
      return {
        ...state,
        inventories: action.payload.inventories,
        inventorySettings: action.payload.inventorySettings,
        pagination: {
          ...state.pagination,
          pages: action.payload.pages,
          page: action.payload.page,
          count: action.payload.count
        }
      };
    case '/INVENTORIES/UPDATE_INVENTORY_CAR':
      return {
        ...state,
        inventoryCar: action.payload.inventoryCar
      };
    case '/INVENTORIES/CHANGE_FILTER':
      return {
        ...state,
        carsTable: processCars(state.detail.cars, state.selectedItems, action.payload.filter),
        filter: action.payload.filter
      };
    case '/INVENTORIES/CHANGE_SELECTED':
      const newSelected = processSelected(state.selectedItems, action.payload.item);
      return {
        ...state,
        selectedItems: newSelected,
        carsTable: processCars(state.detail.cars, newSelected, state.filter)
      };
    case '/INVENTORIES/LOADING_INVENTORY_DETAIL':
      return {
        ...state,
        loadingDetail: action.payload.loadingDetail
      };
    case '/INVENTORIES/FETCHING_INVENTORY_DETAIL':
      return {
        ...state,
        fetchingDetail: action.payload.fetchingDetail
      };
    case '/INVENTORIES/LOAD_INVENTORY_DATA':
      const selectedItems = action.payload.resetFilter ? initialState.selectedItems : state.selectedItems;
      const filter = action.payload.resetFilter ? initialState.filter : state.filter;
      return {
        ...state,
        ...processPropertyCars(action.payload.detail.cars),
        carsTable: processCars(action.payload.detail.cars, selectedItems, filter),
        selectedItems,
        filter,
        labels: action.payload.labels,
        summary: action.payload.summary,
        inventorySettings: action.payload.inventorySettings,
        detailByVenue: action.payload.detailByVenue,
        detail: action.payload.detail,
        detailByBrand: action.payload.detailByBrand
      };
    case '/INVENTORIES/ADD_COMMENT':
      if (state.inventoryCar) {
        return {
          ...state,
          inventoryCar: {
            ...state.inventoryCar,
            comments: [...state.inventoryCar.comments, action.payload.inventoryComment]
          }
        };
      } else {
        return state;
      }
    default:
      return state;
  }
}

function processSelected(selectedItems: any, item: string) {
  let newSelectedItems = {...selectedItems};
  if (newSelectedItems.hasOwnProperty(item)) {
    delete (newSelectedItems as any)[item];
  } else {
    newSelectedItems = {
      ...newSelectedItems,
      [item]: true
    };
  }
  return newSelectedItems;
}

interface IPropertyCar {
  cardProperties: string[];
  cardTypes: string[];
}

function processPropertyCars(cars: IInventoryCar[]): IPropertyCar {
  const propertyCars: IPropertyCar = {
    cardProperties: [],
    cardTypes: []
  };
  for (const car of cars) {
    if (car.car?.property && !propertyCars.cardProperties.includes(car.car.property)) {
      propertyCars.cardProperties.push(car.car.property);
    }
    if (car.car?.type && !propertyCars.cardTypes.includes(car.car.type)) {
      propertyCars.cardTypes.push(car.car.type);
    }
  }
  return propertyCars;
}

function processCars(cars: IInventoryCar[], selectedItems: { [key: string]: any }, filter: IFilterCar) {
  const products: any[] = [];
  // const missincars = [];
  for (const car of cars) {
    let add = true;
    if (filter && filter.venues && filter.venues.length && car.venue) {
      add = (filter.venues as any).includes(car.venue._id);
      if (!add && car.venueFound) {
        add = (filter.venues as any).includes(car.venueFound._id);
      }
    }
    if (add && filter && filter.states && filter.states.length && car.status) {
      add = (filter.states as any).includes(car.status);
    }
    if (add && filter && filter.property && filter.property.length) {
      add = car.car.property === filter.property;
    }
    if (add && filter && filter.type && filter.type.length) {
      add = car.car.type === filter.type;
    }
    if (add && filter && filter.brands && filter.brands.length) {
      add = (filter.brands as any).includes(car.car.brandRelated?._id);
    }
    if (add && filter && filter.text && filter.text.length) {
      const result: boolean[] = filter.text.toLowerCase().split(' ').map((text) => (
        unorm.nfd(`${car.car.vin}${car.car.brand}${car.car.denomination}${car.car.patent}${car.car.internalNumber}`)
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .includes(text.toLowerCase())
      ));
      add = result.every((element: boolean) => element);
      /*add = `${car.car.vin}${car.car.brand}${car.car.denomination}${car.car.patent}`.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .includes(filter.text.toLowerCase());*/
    }
    const patent: string = car.car?.patent ? car.car.patent : '';
    // if (add && filter && filter && filter.type.length) {
    //   if (filter.type === 'new') {
    //     add = patent.length === 0;
    //   } else if (filter.type === 'used') {
    //     add = patent.length !== 0;
    //   }
    // }
    if (add && (car as any).car?._id) {
      products.push({
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
        files: car.files && car.files.length ? car.files : [],
        images: car.images && car.images.length ? car.images : [],
        comments: car.comments && car.comments.length ? car.comments : [],
        countComments: car.comments && car.comments.length ? car.comments.length : 0,
        venueFound: car.venueFound ? car.venueFound.name : '-',
        patent,
        inventoriedBy: car.inventoriedBy ? `${car.inventoriedBy.firstName} ${car.inventoriedBy.lastName}` : '-',
        selected: selectedItems.hasOwnProperty((car as any)._id),
        status: car.status,
        option: car.status
      });
    } else {
      // if(car.status !=="pending"){
        // console.log('car', car);
        // missincars.push(car)
      // }
    }
  }
  // console.log('missincars', missincars);
  return products;
}
