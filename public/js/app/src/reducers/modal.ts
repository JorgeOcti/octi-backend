import {IModalState, ModalReduxAction} from "../actions/modal";

const initialState: IModalState = {
  title: '',
  body: null,
  footer: null
};

export function modal(state = initialState, action: ModalReduxAction): IModalState {
  switch (action.type) {
    case '/MODAL/LOAD_DATA':
      setTimeout(()=>{
        ($('#andesModal') as any).modal('show');
      }, 100);
      return {
        ...state,
        title: action.payload.title,
        body: action.payload.body,
        footer: action.payload.footer ? action.payload.footer : null
      };
    case '/MODAL/CLEAR':
      return initialState;
    default:
      return state;
  }
}
