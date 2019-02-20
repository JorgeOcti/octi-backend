import * as moment from 'moment';
import {ICar} from '../../../../../src/interfaces/car.interface';
import {CarReduxAction, ICarsState} from '../actions/cars.actions';

const initialState: ICarsState = {
  cars: [],
  car: null,
  carEvents: {} ,
  loading: true,
  source: null,
  pagination: {
    count: 0,
    page: 1,
    pages: 1
  }
};

export function carsReducer(state = initialState, action: CarReduxAction): ICarsState {
  switch (action.type) {
    case '/CARS/IS_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      };
    case '/CARS/CANCEL_REQUEST':
      return {
        ...state,
        source: action.payload.source
      };
    case '/CARS/LOAD_CARS':
      return {
        ...state,
        cars: action.payload.cars,
        pagination: {
          ...state.pagination,
          pages: action.payload.pages,
          count: action.payload.count
        }
      };
    case '/CARS/LOAD_CAR':
      return {
        ...state,
        car: action.payload.car,
        carEvents: groupCarEvents(action.payload.car)
      };
    case '/CARS/CHANGE_PAGE':
      return {
        ...state,
        pagination: {
          ...state.pagination,
          page: action.payload.page
        }
      };
    default:
      return state;
  }
}

function groupCarEvents(car: ICar): any[] {
  const events: any[] = [];
  if (car.participants && car.participants.length) {
    for (const participant of car.participants) {
      events.push({
        ...participant,
        createdAt: moment(participant.createdAt),
        typeEvent: 'revision'
      });
    }
  }
  if (car.inventories && car.inventories.length) {
    for (const inventory of car.inventories) {
      events.push({
        ...inventory,
        createdAt: moment(inventory.createdAt),
        typeEvent: 'inventory'
      });
    }
  }
  // const carEvents: any = events
  //   .sort((a, b) => {
  //     return b.createdAt.format('X') - a.createdAt.format('X');
  //   })
  //   .reduce((acc: any, cur: any) => {
  //   const key = cur.createdAt.format('YYYY-MM-DD');
  //   acc[key] = acc[key] || [];
  //   acc[key].push(cur);
  //   return acc;
  // }, {});
  // for(const e in carEvents) {
  //   console.log('e', e);
  //   for(const a of carEvents[e]) {
  //     console.log(' a', a.typeEvent);
  //     console.log(' a', a.createdAt.format('LLLL'));
  //   }
  // }
  return events
    .sort((a, b) => {
      return b.createdAt.format('X') - a.createdAt.format('X');
    })
    .reduce((acc: any, cur: any) => {
    const key = moment(cur.createdAt).startOf('month').format('YYYY-MM-DD');
    acc[key] = acc[key] || [];
    acc[key].push(cur);
    return acc;
  }, {});
}
