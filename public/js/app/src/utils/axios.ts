import Axios, {
  AxiosError,
  AxiosInstance,
  AxiosPromise,
  CancelTokenSource,
  CancelTokenStatic
} from 'axios';
import * as Raven from 'raven-js';
import * as swal from 'sweetalert';
import {
  IBaseCarrier,
  ICarrier
} from '../../../../../src/interfaces/carrier.interface';
import {
  IBaseCompany
} from '../../../../../src/interfaces/company.interface';
import {
  IBaseVenue
} from '../../../../../src/interfaces/venue.interface';
import {ITempUser} from '../actions/users.actions';
import {IFilterCar} from '../reducers/inventory.reducer';

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

  constructor(private headers: IHeaders = {}) {
    this.instance = Axios.create({
      headers: this.headers
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

  public getUsers(page: number, search?: string): AxiosPromise {
    return this.instance.get(
      `/api/admin/users/?page=${page}${search ? `&search=${search}` : ''}`
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

  public getParticipantsPerDate(companies?:string) {
    return this.instance.get(
      `/api/participants-per-date/${companies?`?companies=${companies}`:""}`
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
    const formData = new FormData();
    formData.append('name', company.name);
    if (company.image) {
      formData.append('file', company.image);
    }
    this.instance.defaults.headers.common['Content-Type'] = 'multipart/form-data';
    return this.instance.post(
      `/api/admin/companies/`, formData
    );
  }

  public updateCompany(company: IBaseCompany): AxiosPromise {
    const formData = new FormData();
    formData.append('name', company.name);
    if (company.image) {
      formData.append('file', company.image);
    }
    this.instance.defaults.headers.common['Content-Type'] = 'multipart/form-data';
    return this.instance.patch(
      `/api/admin/companies/${company._id}`, formData
    );
  }

   public deleteCompany(id: string): AxiosPromise {
    return this.instance.delete(
      `/api/admin/companies/${id}`
    );
  }

  public createVenue(venue: IBaseVenue): AxiosPromise {
    return this.instance.post(
      `/api/admin/venues/`, venue
    );
  }

  public updateVenue(venue: IBaseVenue): AxiosPromise {
    return this.instance.patch(
      `/api/admin/venues/${venue._id}/`, venue
    );
  }

  public deleteVenue(id: string): AxiosPromise {
    return this.instance.delete(
      `/api/admin/venues/${id}/`
    );
  }

  public getVenues(page: number, pageSize?: number): AxiosPromise {
    return this.instance.get(
      `/api/admin/venues/?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}`
    );
  }

  public createCarrier(carrier: IBaseCarrier): AxiosPromise {
    return this.instance.post(
      `/api/admin/carriers/`, carrier
    );
  }

  public updateCarrier(carrier: IBaseCarrier): AxiosPromise {
    return this.instance.patch(
      `/api/admin/carriers/${carrier._id}`, carrier
    );
  }

  public deleteCarrier(id: string): AxiosPromise {
    return this.instance.delete(
      `/api/admin/carriers/${id}`
    );
  }

  public getCarriers(page: number, pageSize?: number): AxiosPromise {
    return this.instance.get(
      `/api/admin/carriers/?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}`
    );
  }

  public getRegions(page: number, pageSize?: number): AxiosPromise {
    return this.instance.get(
      `/api/admin/regions/?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}`
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

  public getCars(page: number, search?: string): AxiosPromise {
    return this.instance.get(
      `/api/cars/?page=${page}${search ? `&search=${search}` : ''}`, {
        cancelToken: this.source.token
      }
    );
  }

  public getRevisions(page: number, search?: string, from?: string, to?: string): AxiosPromise {
    let query = `?page=${page}`;
    if(search)
      query += `&search=${search}`;

    if(from)
      query += `&from=${from}`;

    if(to)
      query += `&to=${to}`;

    return this.instance.get(
      `/api/revisions/${query}`, {
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

  public getInventories(page: number): AxiosPromise  {
    return this.instance.get(
      `/api/inventory/?page=${page}`,  {
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

  // public createInventory({carsByVenue: any, name: string, notification: boolean, file: File, backup: File | null}): AxiosPromise {
  public createInventory({
    carsByVenue, name, notification, file, backupFile, manualPhoto, reportPhoto
  }: {
    carsByVenue: any, name: string, notification: boolean, file: File, backupFile: File | null, manualPhoto: number, reportPhoto: number
  }): AxiosPromise {
    const formData = new FormData();
    formData.append('carsByVenue', JSON.stringify(carsByVenue));
    formData.append('name', name);
    formData.append('notification', notification.toString());
    formData.append('file', file);
    formData.append('manualPhoto', manualPhoto.toString());
    formData.append('reportPhoto', reportPhoto.toString());
    if (backupFile) {
      formData.append('backup', backupFile);
    }
    this.instance.defaults.headers.common['Content-Type'] = 'multipart/form-data';
    return this.instance.post(
      `/api/inventory/`, formData, {
        cancelToken: this.source.token
      }
    );
  }

  public importPlanning(data: any): AxiosPromise{
    return this.instance.post(
      `/api/admin/planning/`, data, {
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

  public getInstance(): AxiosInstance {
    return this.instance;
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

  public getInventoryDashboard(filter?: IFilterCar): AxiosPromise {
    return this.instance.post(
      '/api/inventory/dashboard/', filter ? { venues: filter.venues } : {}
    );
  }

  public getDashboardDamagesPerVenue(): AxiosPromise {
    return this.instance.get(
      '/api/dashboard/damages/per-venue/'
    )
  }

  public getDashboardTiming(): AxiosPromise {
    return this.instance.get(
      '/api/dashboard/timing/'
    )
  }

  public getTimingPerVenue(period: string): AxiosPromise {
    return this.instance.get(`/api/dashboard/timing/per-venue/?period=${period}`)
  }

  public getDashboardCleaning(): AxiosPromise {
    return this.instance.get(
      '/api/dashboard/cleaning/'
    )
  }

  public getVersions(): AxiosPromise {
    return this.instance.get(
      `/api/admin/versions/`, {
        cancelToken: this.source.token
      }
    );
  }

  public getPlanning(page: number, pageSize?: number): AxiosPromise {
    return this.instance.get(
      `/api/admin/planning/?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}`
    );
  }

  public createVersion(version: any): AxiosPromise {
    return this.instance.post(
      `/api/admin/versions/`,
      version
    );
  }

}
