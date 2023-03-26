
export interface IModalState {
  title: JSX.Element| string;
  body: JSX.Element| null;
  footer: JSX.Element| null;
}

interface ILoadData {
  type: '/MODAL/LOAD_DATA';
  payload: {
    title: JSX.Element | string;
    body: JSX.Element | null;
    footer?: JSX.Element | null;
  };
}

export function loadDataAction(title: string|JSX.Element, body: JSX.Element, footer?: JSX.Element): ILoadData {
  return {
    type: '/MODAL/LOAD_DATA',
    payload: {
      title,
      body,
      footer
    }
  };
}

interface IClear {
  type: '/MODAL/CLEAR';
}

export type ModalReduxAction =
  ILoadData |
  IClear;
