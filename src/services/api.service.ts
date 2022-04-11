import Axios, { AxiosError, AxiosInstance, AxiosRequestHeaders } from 'axios';
import logger from './logger.service';

class ApiService {
  public instance: AxiosInstance;

  constructor() {
    const headers: AxiosRequestHeaders = {};
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
