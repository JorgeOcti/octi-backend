
export interface IModalState {
  title: string;
  body: JSX.Element| null;
  footer: JSX.Element| null;
}

interface ILoadData {
  type: '/MODAL/LOAD_DATA';
  payload: {
    title: string;
    body: JSX.Element | null;
    footer: JSX.Element | null;
  }
}

export function loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ILoadData {
  return {
    type: '/MODAL/LOAD_DATA',
    payload: {
      title,
      body,
      footer
    }
  }
}

interface IClear {
  type: '/MODAL/CLEAR';
}

export type ModalReduxAction = ILoadData | IClear;
