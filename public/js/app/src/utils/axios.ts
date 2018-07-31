///<reference path="../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
import Axios, {
  AxiosError,
  AxiosInstance,
  AxiosPromise,
  CancelTokenSource,
  CancelTokenStatic
} from 'axios';
import * as Raven from 'raven-js';
import {ITempUser} from '../actions/users';
// import {IWindow} from '../interfaces/window';

// declare let window: IWindow;

export interface IHeaders {
  'X-CSRFToken'?: string;
  'Content-Type'?: string;
  Authorization?: string;
  timeout?: number;
}

export default class ApiService {
  private instance: AxiosInstance;
  private CancelToken: CancelTokenStatic;
  private source: CancelTokenSource;

  constructor() {
    const headers: IHeaders = {};
    // if (window.token) {
    //   headers = {
    //     Authorization: `Bearer ${window.token}`
    //   };
    // } else {
    //   headers = {
    //     'X-CSRFToken': window.getCookie('csrftoken')
    //   };
    // }
    // headers['Content-Type'] = 'application/json';

    this.instance = Axios.create({
      headers
    });
    this.CancelToken = Axios.CancelToken;
  }

  public errorHandler(err: AxiosError): void {
    if (err.response) {
      if ([500].includes(err.response.status)) {
        Raven.captureException(JSON.stringify(err.response));
        swal('Ups ha ocurrido un error', err.response.data.message ? err.response.data.message : err.response.data.errmsg, 'error');
      } else {
        swal('Ups ha ocurrido un error', err.response.data.message ? err.response.data.message : err.response.data.errmsg, 'error');
      }
    } else if (err.request) {
      Raven.captureException(JSON.stringify(err.request));
    } else {
      Raven.captureException(JSON.stringify(err));
    }
  }

  public getUsers(page?: number): AxiosPromise {
    return this.instance.get(
      `/api/admin/users/${page ? `?page=${page}` : ''}`
      , {
        cancelToken: this.source.token
      });
  }

  public addUser(user: ITempUser): AxiosPromise {
    delete user._id;
    return this.instance.post(
      `/api/admin/users/`
      , user);
  }

  public editUser(user: ITempUser): AxiosPromise {
    return this.instance.patch(
      `/api/admin/users/${user._id}`
      , user);
  }

  public deleteUser(id: string): AxiosPromise {
    return this.instance.delete(
      `/api/admin/users/${id}/`
    );
  }

  public getParticipantsPerDate() {
    return this.instance.get(
      `/api/admin/participants-per-date/`
    );
  }
  public getParticipant(id: string) {
    return this.instance.get(
      `/api/admin/participant/${id}/`
    );
  }

  public getVenues(): AxiosPromise {
    return this.instance.get(
      `/api/admin/venues/`
    );
  }

  public getCars(page?: number): AxiosPromise {
    return this.instance.get(
      `/api/admin/cars/${page ? `?page=${page}` : ''}`, {
        cancelToken: this.source.token
      }
    );
  }

  public getCar(id: string): AxiosPromise {
    return this.instance.get(
      `/api/admin/cars/${id}`, {
        cancelToken: this.source.token
      }
    );
  }

  public sendImportCars(data: any): AxiosPromise {
    return this.instance.post(
      `/api/admin/import-cars/`, data, {
        cancelToken: this.source.token
      }
    );
  }

  public getAlerts(): AxiosPromise {
    return this.instance.get(
      `/api/admin/alerts/`, {
        cancelToken: this.source.token
      }
    );
  }

  public deleteAlert(id: string): AxiosPromise {
    return this.instance.delete(
      `/api/admin/alerts/${id}/`
    );
  }

  public getSource(): CancelTokenSource {
    this.source = this.CancelToken.source();
    return this.source;
  }

}
