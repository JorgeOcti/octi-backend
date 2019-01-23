///<reference path="../../node_modules/sweetalert/typings/sweetalert.d.ts"/>
import Axios, {
  AxiosError,
  AxiosInstance,
  AxiosPromise,
  CancelTokenSource,
  CancelTokenStatic
} from 'axios';
import * as Raven from 'raven-js';
import {
  IBaseCompany
} from '../../../../../src/interfaces/company.interface';
import {
  IBaseVenue
} from '../../../../../src/interfaces/venue.interface';
import {ITempUser} from '../actions/users.actions';
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

  public createUser(user: ITempUser): AxiosPromise {
    delete user._id;
    return this.instance.post(
      `/api/admin/users/`
      , user);
  }

  public changePasswordUser(user: string, password: string): AxiosPromise {
    return this.instance.post(
      `/api/admin/users/change-password/`
      , {
        user,
        password
      });
  }

  public updteUser(user: ITempUser): AxiosPromise {
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
      `/api/participants-per-date/`
    );
  }
  public getParticipant(id: string) {
    return this.instance.get(
      `/api/participant/${id}/`
    );
  }

  public getCompanies(page: number, pageSize?: number): AxiosPromise {
    return this.instance.get(
      `/api/admin/companies/?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}`
    );
  }
  public createCompany(company: IBaseCompany): AxiosPromise {
    return this.instance.post(
      `/api/admin/companies/`, company
    );
  }

  public updateCompany(company: IBaseCompany): AxiosPromise {
    return this.instance.patch(
      `/api/admin/companies/${company._id}`, company
    );
  }

   public deleteCompany(id: string): AxiosPromise {
    return this.instance.delete(
      `/api/admin/companies/${id}`
    );
  }

  public getVenues(page: number, pageSize?: number): AxiosPromise {
    return this.instance.get(
      `/api/admin/venues/?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}`
    );
  }

  public deleteVenue(id: string): AxiosPromise {
    return this.instance.delete(
      `/api/admin/venues/${id}/`
    );
  }

  public updateVenue(venue: IBaseVenue): AxiosPromise {
    return this.instance.patch(
      `/api/admin/venues/${venue._id}/`, venue
    );
  }

  public createVenue(venue: IBaseVenue): AxiosPromise {
    return this.instance.post(
      `/api/admin/venues/`, venue
    );
  }

  public getPermissions(page: number, pageSize?: number): AxiosPromise {
    return this.instance.get(
      `/api/admin/permissions/?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}`
    );
  }

  public getForms(page: number, pageSize?: number): AxiosPromise {
    return this.instance.get(
      `/api/admin/forms/?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}`
    );
  }

  public getCars(page?: number): AxiosPromise {
    return this.instance.get(
      `/api/cars/${page ? `?page=${page}` : ''}`, {
        cancelToken: this.source.token
      }
    );
  }

  public getAdminCars(page?: number, search?: string): AxiosPromise {
    return this.instance.get(
      `/api/admin/cars/?page=${page}${search ? `&search=${search}` : ''}`, {
        cancelToken: this.source.token
      }
    );
  }

  public getCar(id: string): AxiosPromise {
    return this.instance.get(
      `/api/cars/${id}`, {
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

  public getInventories(): AxiosPromise  {
    return this.instance.get(
      `/api/inventory/`,  {
        cancelToken: this.source.token
      }
    );
  }

  public getInventory(id: string): AxiosPromise {
    return this.instance.get(
      `/api/inventory/${id}`,  {
        cancelToken: this.source.token
      }
    );
  }

  public addComment(id: string, carId: string, comment: string): AxiosPromise {
    return this.instance.post(
      `/api/inventory/${id}/comment/`, {
        _id: carId,
        comment
      }
    );
  }

  public createInventory(carsByVenue: any, name: string, notification: boolean): AxiosPromise {
    return this.instance.post(
      `/api/inventory/`, {
        carsByVenue,
        name,
        notification
      }, {
        cancelToken: this.source.token
      }
    );
  }

  public finishInventory(id: string): AxiosPromise {
    return this.instance.post(
      `/api/inventory/${id}/finish/`, {}
    );
  }

  public deleteInventory(id: string): AxiosPromise {
    return this.instance.delete(
      `/api/inventory/${id}/`, {}
    );
  }

  public getAlerts(): AxiosPromise {
    return this.instance.get(
      `/api/admin/alerts/`, {
        cancelToken: this.source.token
      }
    );
  }

  public createAlert(alert: any): AxiosPromise {
    return this.instance.post(
      `/api/admin/alerts/`,
      alert
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

  public setLabel(inventory: string, car: string, carID: string, label: string, custom?: string): AxiosPromise {
    return this.instance.post(
      `/api/inventory/${inventory}/set-label/`, {
        car,
        label,
        carID,
        custom
      }
    );
  }

  public getLabels(page: number, pageSize?: number): AxiosPromise {
    return this.instance.get(
      `/api/admin/labels/?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}`
    );
  }

  public createLabel(label: any): AxiosPromise {
    return this.instance.post(
      `/api/admin/labels/`, label
    );
  }

  public updateLabel(label: any): AxiosPromise {
    return this.instance.put(
      `/api/admin/labels/${label._id}`, label
    );
  }

  public deleteLabel(id: string): AxiosPromise {
    return this.instance.delete(
      `/api/admin/labels/${id}`
    );
  }

}
