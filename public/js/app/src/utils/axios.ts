import Axios, {
  AxiosError,
  AxiosInstance,
  AxiosPromise,
  CancelTokenSource,
  CancelTokenStatic
} from 'axios';
import * as Raven from 'raven-js';
import {IWindow} from '../interfaces/window';

declare let window: IWindow;

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
    let headers: IHeaders = {};
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
    const ingnoreStatus = [403, 404];
    if (err.response) {
      if (!ingnoreStatus.includes(err.response.status)) {
        Raven.captureException(JSON.stringify(err.response));
      }
    } else if (err.request) {
      Raven.captureException(JSON.stringify(err.request));
    } else {
      Raven.captureException(JSON.stringify(err));
    }
  }

  public getUsers(page?:number): AxiosPromise {
    return this.instance.get(
      `/api/admin/users/${page ? `?page=${page}` : ''}`
      , {
        cancelToken: this.source.token
      });
  }

  public deleteUser(id: string): AxiosPromise {
    return this.instance.delete(
      `/api/admin/users/${id}/`
    );
  }

  public getTicket(ticket: number): AxiosPromise {
    return this.instance.get(
      `${window.urls.tickets}${ticket}/`
    );
  }

  public createTicket(ticket: any): AxiosPromise {
    return this.instance.post(
      `${window.urls.tickets}`,
      ticket
    );
  }

  public addComment(ticket: string, comment: string): AxiosPromise {
    return this.instance.post(
      `${window.urls.ticketComments.replace('0', ticket)}`,
      {comment}
    );
  }
  public closeTicket(ticket: string): AxiosPromise {
    return this.instance.put(
      `${window.urls.ticketClose.replace('0', ticket)}`
    );
  }
  public invalidateTicket(ticket: string): AxiosPromise {
    return this.instance.put(
      `${window.urls.ticketInvalidate.replace('0', ticket)}`
    );
  }

  public getTeams(): AxiosPromise {
    return this.instance.get(window.urls.ticketsTeams);
  }

  public getSource(): CancelTokenSource {
    this.source = this.CancelToken.source();
    return this.source;
  }

}
