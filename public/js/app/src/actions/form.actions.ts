import Axios, { AxiosError, AxiosResponse, CancelTokenSource } from 'axios';
import { Dispatch } from 'redux';
import { IForm } from '../../../../../src/form/interfaces/form.interface';
import ApiService from '../utils/axios';
import {
  FORM_IS_LOADING,
  FORM_CHANGE_ORDER,
  FORM_CANCEL_STATUS,
  FORM_LOAD_STATUS,
  FORM_CREATE_STATUS,
  FORM_UDPATE_STATUS,
  FORM_DELETE_STATUS,
  ICreateForm,
  ICancelForm,
  IIsLoadingForm,
  ILoadForm,
  IUpdateForm,
  IDeleteForm,
  IChangeOrderForm,
  IFormsState,
  FormReduxActions
} from './form.types';

export function cancelFormAction(source: CancelTokenSource): ICancelForm {
  return {
    type: FORM_CANCEL_STATUS,
    payload: {
      source
    }
  };
}

export function isLoadingFormAction(loading: boolean): IIsLoadingForm {
  return {
    type: FORM_IS_LOADING,
    payload: {
      loading
    }
  };
}

export function loadFormAction(forms: IForm[], count: number, pages: number, page: number): ILoadForm {
  return {
    type: FORM_LOAD_STATUS,
    payload: {
      forms,
      count,
      pages,
      page
    }
  };
}


export function createFormItemAction(form: IForm): ICreateForm {
  return {
    type: FORM_CREATE_STATUS,
    payload: {
      form
    }
  };
}

export function updateFormItemAction(form: IForm): IUpdateForm {
  return {
    type: FORM_UDPATE_STATUS,
    payload: {
      form
    }
  };
}


export function deleteFormAction(form: IForm): IDeleteForm {
  return {
    type: FORM_DELETE_STATUS,
    payload: {
      form
    }
  };
}

export function changeOrderFormAction(orderBy: string, orderType: string): IChangeOrderForm {
  return {
    type: FORM_CHANGE_ORDER,
    payload: {
      orderBy,
      orderType
    }
  };
}

export function getFormsThunkAction(nextPage: number, hideLoading?: boolean) {
  return (dispatch: Dispatch<FormReduxActions>, getState: () => { form: IFormsState }) => {
    const api: ApiService = new ApiService();
    const state = getState();
    dispatch(isLoadingFormAction(!hideLoading));
    const page = nextPage ? nextPage : state.form.pagination.page;
    // dispatch(changeOrderFormAction(orderBy, orderType));
    dispatch(cancelFormAction(api.getSource()));
    Axios
      .all([
        api.getForms(page)
      ])
      .then(Axios.spread((forms) => {
        const { data } = forms;
        dispatch(loadFormAction(data.results, data.count, data.pages, page));
        dispatch(isLoadingFormAction(false));
      }))
      .catch((err: AxiosError) => {
        dispatch(isLoadingFormAction(false));
        api.errorHandler(err);
      });
  };

}

export function createFormThunkAction(form: IForm) {
  return (dispatch: Dispatch<FormReduxActions>) => {
    const api: ApiService = new ApiService();
    api.createForm(form)
      .then((response: AxiosResponse) => {
        // dispatch(updateFormItemAction(idForm, data));
      });
  };
}

export function updateFormThunkAction(form: IForm) {
  return (dispatch: Dispatch<FormReduxActions>) => {
    const api: ApiService = new ApiService();
    api.updateForm(form)
      .then((response: AxiosResponse) => {
        // dispatch(updateFormItemAction(idForm, data));
      });
  };
}

export function deleteFormItemThunkAction(form: IForm) {
  return (dispatch: Dispatch<FormReduxActions>) => {
    const api: ApiService = new ApiService();
    api.deleteForm(form)
      .then((response: AxiosResponse) => {
        // dispatch(updateFormItemAction(idForm, data));
      });
  };
}
