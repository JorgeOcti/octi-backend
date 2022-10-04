import Axios, {AxiosError, AxiosInstance, AxiosPromise, AxiosRequestHeaders, CancelTokenSource, CancelTokenStatic } from 'axios';
import * as Raven from 'raven-js';
import * as swal from 'sweetalert';
import { IBaseCarrier } from '../../../../../src/app/interfaces/carrier.interface';
import { IBaseCompany } from '../../../../../src/app/interfaces/company.interface';
import { IReason } from '../../../../../src/request/interfaces/reason.interface';
import { IBaseRegion } from '../../../../../src/app/interfaces/region.interface';
import { IRequestItem } from '../../../../../src/request/interfaces/requestItem.interface';
import { IRequestStatus } from '../../../../../src/request/interfaces/requestStatus.interface';
import * as queryString  from 'query-string';
import { ISalesChannel } from '../../../../../src/request/interfaces/salesChannel.interface';
import { IPaymentMethod } from '../../../../../src/request/interfaces/paymentMethod.interface';
import { IBaseVenue } from '../../../../../src/app/interfaces/venue.interface';
import { ITempUser } from '../actions/users.actions';
import { IFilterCar } from '../reducers/inventory.reducer';
import { ITransmittalItem } from '../../../../../src/distribution/interfaces/transmittalItem.interface';
import { ITransmittal } from '../../../../../src/distribution/interfaces/transmittal.interface';
import { IOperationType } from '../../../../../src/request/interfaces/operationType.interface';
import { IMilestone } from '../../../../../src/distribution/interfaces/milestone.interface';
import { IMilestoneType } from '../../../../../src/distribution/interfaces/milestoneType.interface';
import { ITempStudio } from '../actions/statsDashboard.actions';
import { getUsersParams } from './axios.types';
import {IBaseBorder} from "../../../../../src/app/interfaces/border.interface";

export default class ApiService {

  private readonly instance: AxiosInstance;
  private CancelToken: CancelTokenStatic;
  private source: CancelTokenSource;

  constructor(private headers: AxiosRequestHeaders = {}) {
    this.instance = Axios.create({
      headers: this.headers
    });
    this.CancelToken = Axios.CancelToken;
  }

  public errorHandler(err: AxiosError): void {
    if (err.response) {
      if ([500].includes(err.response.status)) {
        Raven.captureException(JSON.stringify(err.response));
        swal!('Ups ha ocurrido un error', err.response.data.message ? err.response.data.message : err.response.data.errmsg, 'error');
      } else {
        swal!('Ups ha ocurrido un error', err.response.data.message ? err.response.data.message : err.response.data.errmsg, 'error');
      }
    } else if (err.request) {
      Raven.captureException(JSON.stringify(err.request));
    } else {
      Raven.captureException(JSON.stringify(err));
    }
  }

  public getProperties(): AxiosPromise {
    return this.instance.get(
      `/api/cars/properties/`
      , {
        cancelToken: this.source.token
      });
  }

  public getUsers({
      page, search, type, venue, minified = false, limit = 20
    }: getUsersParams
  ): AxiosPromise {
    const params = queryString.stringify({
      page, search, type, venue, minified, limit
    });
    return this.instance.get(
      `/api/admin/users?${params}`
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

  public updateUser(user: ITempUser): AxiosPromise {
    return this.instance.patch(
      `/api/admin/users/${user._id}/`
      , user);
  }

  public deleteUser(id: string): AxiosPromise {
    return this.instance.delete(
      `/api/admin/users/${id}/`
    );
  }

  public createIntegration(user: any): AxiosPromise {
    return this.instance.post(
      `/api/admin/integrations/`
      , user);
  }

  public updateIntegration(user: ITempUser): AxiosPromise {
    return this.instance.patch(
      `/api/admin/integrations/${user._id}/`
      , user);
  }

  public deleteIntegration(id: string): AxiosPromise {
    return this.instance.delete(
      `/api/admin/integrations/${id}/`
    );
  }

  public getParticipantsPerDate(onlyControls: Boolean, companies?: string) {
    return this.instance.get(
      `/api/participants-per-date${ onlyControls ? `?only_controls=1` : `?only_controls=0`}${companies ? `&companies=${companies}` : ''}`
    );
  }

  public getParticipant(id: string) {
    return this.instance.get(
      `/api/participant/${id}/`
    );
  }

  public getCompanies(page: number, pageSize?: number): AxiosPromise {
    return this.instance.get(
      `/api/admin/companies?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}`
    );
  }

  public createCompany(company: IBaseCompany): AxiosPromise {
    const formData = new FormData();
    formData.append('name', company.name);
    formData.append('businessName', company.businessName);
    formData.append('rut', company.rut);
    formData.append('billing', JSON.stringify(company.billing));
    formData.append('notifications', JSON.stringify(company.notifications));
    if (company.image) {
      formData.append('image', company.image);
    }
    if (company.marker) {
      formData.append('marker', company.marker);
    }
    this.instance.defaults.headers.common['Content-Type'] = 'multipart/form-data';
    return this.instance.post(
      `/api/admin/companies/`, formData
    );
  }

  public updateCompany(company: IBaseCompany): AxiosPromise {
    const formData = new FormData();
    formData.append('name', company.name);
    formData.append('businessName', company.businessName);
    formData.append('rut', company.rut);
    formData.append('billing', JSON.stringify(company.billing));
    formData.append('notifications', JSON.stringify(company.notifications));
    if (company.image) {
      formData.append('image', company.image);
    }
    if (company.marker) {
      formData.append('marker', company.marker);
    }
    this.instance.defaults.headers.common['Content-Type'] = 'multipart/form-data';
    return this.instance.patch(
      `/api/admin/companies/${company._id}/`, formData
    );
  }

  public deleteCompany(id: string): AxiosPromise {
    return this.instance.delete(
      `/api/admin/companies/${id}/`
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

  public getVenues({page, pageSize, noPopulate, filted, search}:{ page: number, pageSize?: number, noPopulate?: boolean, filted?: boolean, search?:string }): AxiosPromise {
    return this.instance.get(
      `/api/admin/venues?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}${noPopulate ? `&noPopulate=${noPopulate}` : ''}${filted ? `&filted=${filted}` : ''}${search ? `&search=${search}` : ''}`
    );
  }
  public getCompanyVenues(): AxiosPromise {
    return this.instance.get(
      `/api/admin/company-venues/`
    );
  }

  public createReason(reason: any): AxiosPromise {
    return this.instance.post(
      `/api/v1/reasons/`, reason
    );
  }

  public updateReason(reason: IReason): AxiosPromise {
    return this.instance.patch(
      `/api/v1/reasons/${reason._id}/`, reason
    );
  }

  public deleteReason(reason: IReason): AxiosPromise {
    return this.instance.delete(
      `/api/v1/reasons/${reason._id}/`
    );
  }

  public getReasons({ page, pageSize, orderBy, orderType }: { page: number, orderType?: string, orderBy?: string, pageSize?: number }): AxiosPromise {
    return this.instance.get(
      `/api/v1/reasons?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}${orderBy ? `&orderBy=${orderBy}` : ''}${orderType ? `&orderType=${orderType}` : ''}`
    );
  }

  public createSalesChannel(salesChannel: any): AxiosPromise {
    return this.instance.post(
      `/api/v1/sales-channel/`, salesChannel
    );
  }

  public updateSalesChannel(salesChannel: ISalesChannel): AxiosPromise {
    return this.instance.patch(
      `/api/v1/sales-channel/${salesChannel._id}/`, salesChannel
    );
  }

  public deleteSalesChannel(salesChannel: ISalesChannel): AxiosPromise {
    return this.instance.delete(
      `/api/v1/sales-channel/${salesChannel._id}/`
    );
  }

  public getSalesChannel({
     page,
     pageSize,
     orderBy,
     orderType
   }: { page: number, orderType?: string, orderBy?: string, pageSize?: number }): AxiosPromise {
    return this.instance.get(
      `/api/v1/sales-channel?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}${orderBy ? `&orderBy=${orderBy}` : ''}${orderType ? `&orderType=${orderType}` : ''}`
    );
  }

  public createPaymentMethod(paymentMethod: any): AxiosPromise {
    return this.instance.post(
      `/api/v1/payment-method/`, paymentMethod
    );
  }

  public updatePaymentMethod(paymentMethod: IPaymentMethod): AxiosPromise {
    return this.instance.patch(
      `/api/v1/payment-method/${paymentMethod._id}/`, paymentMethod
    );
  }

  public deletePaymentMethod(paymentMethod: IPaymentMethod): AxiosPromise {
    return this.instance.delete(
      `/api/v1/payment-method/${paymentMethod._id}/`
    );
  }

  public getPaymentMethods({
   page,
   pageSize,
   orderBy,
   orderType
 }: { page: number, orderType?: string, orderBy?: string, pageSize?: number }): AxiosPromise {
    return this.instance.get(
      `/api/v1/payment-method?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}${orderBy ? `&orderBy=${orderBy}` : ''}${orderType ? `&orderType=${orderType}` : ''}`
    );
  }

  public createCarrier(carrier: IBaseCarrier): AxiosPromise {
    return this.instance.post(
      `/api/admin/carriers/`, carrier
    );
  }

  public updateCarrier(carrier: IBaseCarrier): AxiosPromise {
    return this.instance.patch(
      `/api/admin/carriers/${carrier._id}/`, carrier
    );
  }

  public deleteCarrier(id: string): AxiosPromise {
    return this.instance.delete(
      `/api/admin/carriers/${id}/`
    );
  }

  public getCarriers(page: number, pageSize?: number): AxiosPromise {
    return this.instance.get(
      `/api/admin/carriers?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}`
    );
  }

  public getDrivers(page: number, pageSize?: number): AxiosPromise {
    return this.instance.get(
      `/api/v1/users/drivers?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}`
    );
  }

  public createRegion(region: IBaseRegion): AxiosPromise {
    return this.instance.post(
      `/api/admin/regions/`, region
    );
  }

  public updateRegion(region: IBaseRegion): AxiosPromise {
    return this.instance.patch(
      `/api/admin/regions/${region._id}/`, region
    );
  }

  public deleteRegion(id: string): AxiosPromise {
    return this.instance.delete(
      `/api/admin/regions/${id}/`
    );
  }

  public getRegions(page: number, pageSize?: number): AxiosPromise {
    return this.instance.get(
      `/api/admin/regions?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}`
    );
  }

  public getPermissions(page: number, pageSize?: number): AxiosPromise {
    return this.instance.get(
      `/api/admin/permissions?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}`
    );
  }


  public getCars(page: number, search?: string): AxiosPromise {
    return this.instance.get(
      `/api/cars?page=${page}${search ? `&search=${search}` : ''}`, {
        cancelToken: this.source.token
      }
    );
  }

  public getRevisions({
    onlyControls,
    deliveries,
    page,
    search,
    delivery,
    from,
    to,
    forms
  }: { onlyControls: boolean, deliveries: boolean, page: number, delivery?:string, search?: string, from?: Date, to?: Date, forms?: String[] }
  ): AxiosPromise {
    let query = `?page=${page}&only_controls=${onlyControls ? '1' : '0'}&deliveries=${deliveries ? '1' : '0'}`;
    if (search)
      query += `&search=${search}`;
    if (delivery)
      query += `&delivery=${delivery}`;

    if (from)
      query += `&from=${from.toISOString()}`;

    if (to)
      query += `&to=${to.toISOString()}`;

    if (forms)
      query += `&forms=${forms.join(",")}`;

    return this.instance.get(
      `/api/revisions${query}`, {
        cancelToken: this.source.token
      }
    );
  }

  public getAdminCars(page?: number, search?: string): AxiosPromise {
    return this.instance.get(
      `/api/admin/cars?page=${page}${search ? `&search=${search}` : ''}`, {
        cancelToken: this.source.token
      }
    );
  }

  public getCar(id: string): AxiosPromise {
    return this.instance.get(
      `/api/cars/${id}/`, {
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

  public getInventories(page: number): AxiosPromise {
    return this.instance.get(
      `/api/inventory?page=${page}`, {
        cancelToken: this.source.token
      }
    );
  }

  public getInventory(id: string): AxiosPromise {
    return this.instance.get(
      `/api/inventory/${id}/`, {
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
  public createInventory(
    {
      carsByVenue, name, notification, file, backupFile, manualPhoto, reportPhoto
    }: {
      carsByVenue: any, name: string, notification: boolean, file: File | null, backupFile: File | null, manualPhoto: number, reportPhoto: number
  }): AxiosPromise {
    const formData = new FormData();
    formData.append('carsByVenue', JSON.stringify(carsByVenue));
    formData.append('name', name);
    formData.append('notification', notification.toString());
    formData.append('file', file!);
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

  public importPlanning(data: any): AxiosPromise {
    return this.instance.post(
      `/api/admin/planning/`, data, {
        cancelToken: this.source.token
      }
    );
  }

  public updateMassiveRequest(data: any): AxiosPromise {
    return this.instance.post(
      `/api/v1/requests/update-massive/`, data, {
        cancelToken: this.source.token
      }
    );
  }

  public importRequests(data: any): AxiosPromise {
    return this.instance.post(
      `/api/v1/requests/import/`, data, {
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
  public preMassAllocation(data: any): AxiosPromise {
    return this.instance.post(
      `/api/v1/requests/pre-mass-allocation/`,
      data
    );
  }

  public checkItemMassAllocation(data: any): AxiosPromise {
    return this.instance.post(
      `/api/v1/requests/check-item-mass-allocation/`,
      data
    );
  }

  public processItemMassAllocation(data: any): AxiosPromise {
    return this.instance.post(
      `/api/v1/requests/process-item-mass-allocation/`,
      data
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
      });
  }

  public getInstance(): AxiosInstance {
    return this.instance;
  }

  public getLabels(page: number, pageSize?: number): AxiosPromise {
    return this.instance.get(
      `/api/admin/labels?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}`
    );
  }

  public createLabel(label: any): AxiosPromise {
    return this.instance.post(
      `/api/admin/labels/`, label
    );
  }

  public updateLabel(label: any): AxiosPromise {
    return this.instance.put(
      `/api/admin/labels/${label._id}/`, label
    );
  }

  public deleteLabel(id: string): AxiosPromise {
    return this.instance.delete(
      `/api/admin/labels/${id}/`
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
    );
  }

  public getDashboardTiming(from: string, to: string): AxiosPromise {
    return this.instance.get(
      `/api/dashboard/timing?start=${from}&end=${to}`
    );
  }

  public getDashboardCleaning(): AxiosPromise {
    return this.instance.get(
      '/api/dashboard/cleaning/'
    );
  }

  public getVersions(): AxiosPromise {
    return this.instance.get(
      `/api/admin/versions/`, {
        cancelToken: this.source.token
      });
  }

  public loadStock({ carsByVenue }: { carsByVenue: any }): AxiosPromise {
    return this.instance.post(
      `/api/load-stock/`, {
        carsByVenue
      }, {
        cancelToken: this.source.token
      });
  }

  public getStock(): AxiosPromise {
    return this.instance.get(
      `/api/current-stock/`, {
        cancelToken: this.source.token
      });
  }

  public getPlanning(page: number, pageSize?: number): AxiosPromise {
    return this.instance.get(
      `/api/admin/planning?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}`
    );
  }

  public getBilling(page: number, pageSize?: number): AxiosPromise {
    return this.instance.get(
      `/api/admin/billing?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}`
    );
  }

  public createVersion(version: any): AxiosPromise {
    return this.instance.post(
      `/api/admin/versions/`,
      version
    );
  }

  public getRequest(id: string): AxiosPromise {
    return this.instance.get(
      `/api/v1/requests/${id}/`
    );
  }

  public getRequestsByCar(id: string): AxiosPromise {
    return this.instance.get(
      `/api/v1/requests/by-car/${id}/`
    );
  }


  public getRequests({ page, pageSize, orderBy, orderType }: { page: number, orderBy: string, orderType: string, pageSize?: number }): AxiosPromise {
    let params = `?page=${page}`;
    params = pageSize ? `${params}&pageSize=${pageSize}` : params;
    params = orderBy ? `${params}&orderBy=${orderBy}` : params;
    params = orderType ? `${params}&orderType=${orderType}` : params;
    return this.instance.get(
      `/api/v1/requests${params}/`
    );
  }

  public getRequestItems(
    {
      page,
      pageSize,
      orderBy,
      orderType,
      filters
    }: { page: number, orderBy?: string, orderType?: string, pageSize: number, filters: any }): AxiosPromise {
    let body: any = {
      page,
      filters
    };
    body = pageSize ? { ...body, pageSize } : body;
    body = orderBy ? { ...body, orderBy } : body;
    body = orderType ? { ...body, orderType } : body;
    return this.instance.post(
      `/api/v1/requests-item/`,
      body
    );
  }

  public createRequest(data: any) {
    return this.instance.post(
      `/api/v1/requests/`,
      data
    );
  }

  public deleteRequest(id: string) {
    return this.instance.delete(
      `/api/v1/requests/${id}/`
    );
  }

  public createRequestItem(idRequest: string, car: any) {
    return this.instance.post(
      `/api/v1/add-requests-item/`, {
        idRequest,
        car
      });
  }

  public uppdateRequestItemVin(item: any, vin: string) {
    return this.instance.patch(
      `/api/v1/requests-item/${item._id}/change-vin/`, { vin });
  }

  public createRequestItemsStatus(requestStatus: IRequestStatus): AxiosPromise {
    return this.instance.post(
      `/api/v1/request-item-status/`, requestStatus
    );
  }

  public updateRequestItemsStatus(requestStatus: IRequestStatus): AxiosPromise {
    return this.instance.patch(
      `/api/v1/request-item-status/${requestStatus._id}/`, requestStatus
    );
  }

  public deleteRequestItemsStatus(requestStatus: IRequestStatus): AxiosPromise {
    return this.instance.delete(
      `/api/v1/request-item-status/${requestStatus._id}/`
    );
  }

  public getRequestItemsStatus({
                                 page,
                                 pageSize,
                                 orderBy,
                                 orderType
                               }: { page: number, orderType?: string, orderBy?: string, pageSize?: number }): AxiosPromise {
    return this.instance.get(
      `/api/v1/request-item-status?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}${orderBy ? `&orderBy=${orderBy}` : ''}${orderType ? `&orderType=${orderType}` : ''}`
    );
  }


  public createOperationType(operationType: IOperationType): AxiosPromise {
    return this.instance.post(
      `/api/v1/operation-types/`, operationType
    );
  }

  public updateOperationType(operationType: IOperationType): AxiosPromise {
    return this.instance.patch(
      `/api/v1/operation-types/${operationType._id}/`, operationType
    );
  }

  public deleteOperationType(operationType: IOperationType): AxiosPromise {
    return this.instance.delete(
      `/api/v1/operation-types/${operationType._id}/`
    );
  }

  public getOperationTypes({
                             page,
                             pageSize,
                             orderBy,
                             orderType
                           }: { page: number, orderType?: string, orderBy?: string, pageSize?: number }): AxiosPromise {
    return this.instance.get(
      `/api/v1/operation-types?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}${orderBy ? `&orderBy=${orderBy}` : ''}${orderType ? `&orderType=${orderType}` : ''}`
    );
  }

  public updateRequestItem(id: string, item: IRequestItem) {
    return this.instance.patch(
      `/api/v1/requests-item/${id}/`,
      item
    );
  }

  public deleteRequestItem(id: string) {
    return this.instance.delete(
      `/api/v1/requests-item/${id}/`
    );
  }

  public searchCar(text: string): AxiosPromise {
    return this.instance.get(
      `/api/v1/requests/search-car?search=${text}`
    );
  }

  public getVenuesStats(from: number, to: number): AxiosPromise {
    return this.instance.get(
      `/api/revisions/venue/stats?from=${from}&to=${to}`
    );
  }

  public getRevisionsStats(): AxiosPromise {
    return this.instance.get(
      `/api/revisions/stats/`
    );
  }

  public getTransmittals({
                           page,
                           pageSize,
                           orderBy,
                           orderType,
                           number,
                           plate,
                           drivers,
                           types,
                           from,
                           to
                         }: { page: number, orderType?: string, orderBy?: string, pageSize?: number, number?: string, plate?: string, drivers?: string[], types?: string[],from: number, to: number }): AxiosPromise {
    console.log(types);
    let url = `/api/v1/transmittals?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}${orderBy ? `&orderBy=${orderBy}` : ''}${orderType ? `&orderType=${orderType}` : '?'}${from && to ? `&from=${from}&to=${to}` : '?'}`;
    if(number){
      url = `${url}&number=${number}`;
    }
    if(plate){
      url = `${url}&plate=${plate}`;
    }

    if(drivers){
      url = `${url}&drivers=${drivers}`;
    }

    if (types){
      url = `${url}&types=${types}`;
    }
    return this.instance.get(url);
  }

  public createTransmittals(data: any) {
    return this.instance.post(
      `/api/v1/transmittals/`,
      data
    );
  }

  public updateTransmittal(transmittal: Partial<ITransmittal>): AxiosPromise {
    return this.instance.patch(
      `/api/v1/transmittals/${transmittal._id}/`,
      transmittal
    );
  }

  public addTransmittalItem(data: any): AxiosPromise {
    return this.instance.post(
      `/api/v1/transmittals/item/`,
      data
    );
  }

  public uploadTransmittalFile(data: any): AxiosPromise{
    return this.instance.post(
      `/api/v1/transmittals/upload-file/`, data
    );
  }

  public updateTransmittalItem(transmittalItem: Partial<ITransmittalItem>): AxiosPromise {
    return this.instance.patch(
      `/api/v1/transmittals/item/${transmittalItem._id}/`,
      transmittalItem
    );
  }

  public deleteTransmittalItem(transmittalItem: Partial<ITransmittalItem>): AxiosPromise {
    return this.instance.delete(
      `/api/v1/transmittals/item/${transmittalItem._id}/`
    );
  }

  public getTeamSettings(): AxiosPromise {
    return this.instance.get(
      `/api/admin/team-settings/`
    );
  }

  // public createMilestone(milestone: IMilestone): AxiosPromise {
  //   return this.instance.post(
  //     `/api/v1/milestones/`, milestone
  //   );
  // }

  public updateMilestone(milestone: IMilestone): AxiosPromise {
    return this.instance.patch(
      `/api/v1/milestones/${milestone._id}/`, milestone
    );
  }

  // public deleteMilestone(milestone: IMilestone): AxiosPromise {
  //   return this.instance.delete(
  //     `/api/v1/milestones/${milestone._id}/`
  //   );
  // }

  public getMilestones({
    milestoneType,
    page,
    pageSize,
    orderBy,
    orderType
  }: { page: number, milestoneType?: string, orderType?: string, orderBy?: string, pageSize?: number }): AxiosPromise {
    return this.instance.get(
      `/api/v1/milestones?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}${milestoneType ? `&milestoneType=${milestoneType}` : ''}${orderBy ? `&orderBy=${orderBy}` : ''}${orderType ? `&orderType=${orderType}` : ''}`
    );
  }

  public createMilestoneType(operationType: IMilestoneType): AxiosPromise {
    return this.instance.post(
      `/api/v1/milestone-types/`, operationType
    );
  }

  public updateMilestoneType(operationType: IMilestoneType): AxiosPromise {
    return this.instance.patch(
      `/api/v1/milestone-types/${operationType._id}/`, operationType
    );
  }

  public deleteMilestoneType(operationType: IMilestoneType): AxiosPromise {
    return this.instance.delete(
      `/api/v1/milestone-types/${operationType._id}/`
    );
  }

  public getMilestoneTypes({
    page,
    pageSize,
    orderBy,
    orderType
  }: { page: number, orderType?: string, orderBy?: string, pageSize?: number }): AxiosPromise {
    return this.instance.get(
      `/api/v1/milestone-types?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}${orderBy ? `&orderBy=${orderBy}` : ''}${orderType ? `&orderType=${orderType}` : ''}`
    );
  }

  public getColors({ page, pageSize }: { page: number, pageSize?: number }): AxiosPromise {
    return this.instance.get(
      `/api/admin/colors?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}`
    );
  }

  public createColor(color: any): AxiosPromise {
    return this.instance.post(
      `/api/admin/colors/`, color
    );
  }

  public updateColor(color: any): AxiosPromise {
    return this.instance.patch(
      `/api/admin/colors/${color._id}/`, color
    );
  }

  public deleteColor(color: any): AxiosPromise {
    return this.instance.delete(
      `/api/admin/colors/${color._id}/`
    );
  }

  public getUserForms({ deliveries }: { deliveries: boolean}): AxiosPromise {
    return this.instance.get(
      `/api/v1/user-forms?deliveries=${deliveries ? '1' : 0}`
    );
  }

  public getForms(page: number, pageSize?: number, activated?: boolean): AxiosPromise {
    return this.instance.get(
      `/api/admin/forms?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}${activated ? `&activated=1` : ''}`
    );
  }

  public createForm(form: any): AxiosPromise {
    return this.instance.post(
      `/api/admin/forms/`, form
    );
  }

  public updateForm(form: any): AxiosPromise {
    return this.instance.patch(
      `/api/admin/forms/${form._id}/`, form
    );
  }

  public deleteForm(form: any): AxiosPromise {
    return this.instance.delete(
      `/api/admin/forms/${form._id}/`
    );
  }

  public getInventoryCarFiles(inventoryCarId: string): AxiosPromise {
    return this.instance.get(
      `/api/inventory-car/files/${inventoryCarId}/`
    );
  }

  public deleteInventoryCarFile(inventoryFileId: string): AxiosPromise {
    return this.instance.delete(
      `/api/inventory-car/files/${inventoryFileId}/`
    );
  }

  public validateContectaID(conectaID: string): AxiosPromise {
    return this.instance.post(
      `/requests/vehicles/validate-conecta/`, { conectaID }
    );
  }

  public getMyStudiosDashboards(type? : string) : AxiosPromise {
    return this.instance.get(`/api/stats/my-studio/${type ? `?type=${type}` : ''}`)
  }

  public getStudiosDashboards(type? : string) : AxiosPromise {
    return this.instance.get(`/api/stats/studios/${type ? `?type=${type}` : ''}`)
  }

  public deleteStudio(id: String): AxiosPromise {
    return this.instance.delete(
      `/api/stats/studios/${id}/`
    );
  }

  public getStudioUsers(): AxiosPromise {
    return this.instance.get(
      '/api/stats/users/'
    )
  }

  public createStudio(studio: ITempStudio): AxiosPromise {
    return this.instance.post(
      `/api/stats/studios/`, {studio}
    );
  }

  public updateStudio(studio: ITempStudio): AxiosPromise {
    return this.instance.patch(
      `/api/stats/studios/${studio._id}/`, {studio}
    );
  }

  public getTransmittalResume(from: string, to: string): AxiosPromise {
    return this.instance.get(
      `/api/v1/transmittals/resume?from=${from}&to=${to}`
    );
  }

  public createBorder(border: IBaseBorder): AxiosPromise {
    return this.instance.post(
      `/api/admin/border/`, border
    );
  }

  public updateBorder(border: IBaseBorder): AxiosPromise {
    return this.instance.patch(
      `/api/admin/border/${border._id}/`, border
    );
  }

  public deleteBorder(id: string): AxiosPromise {
    return this.instance.delete(
      `/api/admin/border/${id}/`
    );
  }

  public getBorders(page: number, pageSize?: number, search?:string): AxiosPromise {
    return this.instance.get(
      `/api/admin/border?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}${search ? `&search=${search}` : ''}`
    );
  }

  public getOtsOnStatus(type: string, from: string, to: string): AxiosPromise {
    return this.instance.get(
      `/api/v1/transmittals/resume-by-status?status=${type}&from=${from}&to=${to}`
    );
  }

  public getInvoiceCorporate({ period }: { period?: string }): AxiosPromise {
    return this.instance.get(
      `/settings/billing-settings/invoices/${period? `?period=${period}` : ''}`
    )
  }

  public getBillingByCorporate(): AxiosPromise {
    return this.instance.get(
      '/api/settings/billing/corporate/'
    )
  }

  public updateBillingByCorporate(data: any): AxiosPromise {
    return this.instance.patch(
      '/api/settings/billing/corporate/',
      data
    );
  }

  public getAllCompanies(): AxiosPromise {
    return this.instance.get(
      `/api/settings/billing/companies/`
    );
  }

  public getAllModules(): AxiosPromise {
    return this.instance.get(
      `/api/settings/billing/modules/`
    );
  }
}
