import Axios, {AxiosError, AxiosInstance} from 'axios';
import logger from '../services/logger';

export interface IHeaders {
  'X-CSRFToken'?: string;
  'Content-Type'?: string;
  Authorization?: string;
  timeout?: number;
}

class ApiService {
  public instance: AxiosInstance;

  constructor() {
    const headers: IHeaders = {};
    headers['Content-Type'] = 'application/json';
    this.instance = Axios.create({
      headers
    });
  }

  /* istanbul ignore next */
  public errorHandler(err: AxiosError): void {
    const ingnoreStatus = [404];
    if (err.response) {
      if (!ingnoreStatus.includes(err.response.status)) {
        logger.error(JSON.stringify(err.response));
      }
    } else if (err.request) {
      logger.error(JSON.stringify(err.request));
    } else {
      logger.error(JSON.stringify(err));
    }
  }
}

export default new ApiService();
