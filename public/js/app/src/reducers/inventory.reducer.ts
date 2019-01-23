import {
  IInventoryCar
} from '../../../../../src/interfaces/inventory.interface';
import {IInventoryState, InventoryReduxAction} from '../actions/inventory.actions';

const initialState: IInventoryState = {
  inventories: [],
  loading: true,
  inventoryCar: null,
  source: null,
  loadingDetail: true,
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
  selectedItems: {},
  filter: {
    text: '',
    venues: [],
    states: []
  },
  pagination: {
    count: 0,
    page: 1,
    pages: 1
  }
};
interface IFilterCar {
  text: string;
    venues: string[];
    states: string[];
}

export function inventoriesReducer(state = initialState, action: InventoryReduxAction): IInventoryState {
  switch (action.type) {
    case '/INVENTORORIES/IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      };
    case '/INVENTORORIES/CANCEL_REQUEST':
      return {
        ...state,
        source: action.payload.source
      };
    case '/INVENTORORIES/LOAD_DATA':
      return {
        ...state,
        inventories: action.payload.inventories
      };
    case '/INVENTORORIES/UPDATE_INVENTORY_CAR':
      return {
        ...state,
        inventoryCar: action.payload.inventoryCar
      };
    case '/INVENTORORIES/CHANGE_FILTER':
      return {
        ...state,
        carsTable: processCars(state.detail.cars, state.selectedItems, action.payload.filter),
        filter: action.payload.filter
      };
    case '/INVENTORORIES/CHANGE_SELECTED':
      const newSelected = processSelected(state.selectedItems, action.payload.item);
      return {
        ...state,
        selectedItems: newSelected,
        carsTable: processCars(state.detail.cars, newSelected, state.filter)
      };
    case '/INVENTORORIES/LOADING_INVENTORY_DETAIL':
      return {
        ...state,
        loadingDetail: action.payload.loadingDetail
      };
    case '/INVENTORORIES/LOAD_INVENTORY_DATA':
      const selectedItems = action.payload.resetFilter ? initialState.selectedItems : state.selectedItems;
      const filter = action.payload.resetFilter ? initialState.filter : state.filter;
      return {
        ...state,
        carsTable: processCars(action.payload.detail.cars, selectedItems, filter),
        selectedItems,
        filter,
        labels: action.payload.labels,
        summary: action.payload.summary,
        detailByVenue: action.payload.detailByVenue,
        detail: action.payload.detail,
        detailByBrand: action.payload.detailByBrand
      };
    case '/INVENTORORIES/ADD_COMMENT':
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

function processCars(cars: IInventoryCar[], selectedItems: { [key: string]: any }, filter: IFilterCar) {
  const products: any[] = [];
  for (const car of cars) {
    let add = true;
    if (filter && filter.venues && filter.venues.length && car.venue) {
      add = (filter.venues as any).includes(car.venue._id);
    }
    if (add && filter && filter.states && filter.states.length && car.status) {
      add = (filter.states as any).includes(car.status);
    }
    if (add && filter && filter.text && filter.text.length) {
      const result: boolean[] = filter.text.toLowerCase().split(' ').map((text) => (
        `${car.car.vin}${car.car.brand}${car.car.denomination}${car.car.patent}`.normalize('NFD')
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
    if (add) {
      products.push({
        _id: (car as any)._id,
        carID: (car as any).car._id,
        vin: car.car.vin,
        brand: car.car.brand,
        denomination: car.car.denomination,
        label: car.label,
        labelName: car.label && car.label.hasOwnProperty('name') ? car.label.name : 'z',
        labelBy: car.labelBy,
        labelText: car.labelText,
        venue: car.venue ? car.venue.name : '-',
        images: car.images && car.images.length ? car.images : [],
        comments: car.comments && car.comments.length ? car.comments : [],
        countComments: car.comments && car.comments.length ? car.comments.length : 0,
        venueFound: car.venueFound ? car.venueFound.name : '-',
        patent: car.car.patent ? car.car.patent : '',
        inventoriedBy: car.inventoriedBy ? `${car.inventoriedBy.firstName} ${car.inventoriedBy.lastName}` : '-',
        selected: selectedItems.hasOwnProperty((car as any)._id),
        status: car.status,
        option: car.status
      });
    }
  }
  console.log('products', products)
  return products;
}
