import * as qs from 'qs';

import {
  IIntegration,
  IIntegrationAction
} from '../interfaces/integration.interface';
import axios, { AxiosInstance } from 'axios';

import Integration from '../models/integrations.model';
import logger from '../../services/logger.service';

export default class IXnetClient {
  readonly instance: AxiosInstance;

  constructor(public integration: IIntegration) {
    this.instance = axios.create({
      baseURL: integration.config.host,
      timeout: 20000,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Octimize Client',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    this.interceptors = this.interceptors.bind(this);
    this.getToken = this.getToken.bind(this);
    this.getFrom = this.getFrom.bind(this);
    this.interceptors();
  }

  async interceptors() {
    this.instance.interceptors.request.use(
      async (config) => {
        const { token } = this.integration;
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        logger.error(
          `IXnetClient.interceptors error: ${JSON.stringify(error.response)}`,
          true
        );
        return Promise.reject(error);
      }
    );
    this.instance.interceptors.response.use(
      (res) => {
        // console.dir(res.config)
        logger.debug(
          `IXnetClient.interceptors ${
            JSON.stringify({
              url: res.config.url,
              headers: res.config.headers,
              status: res.status,
            })
          }`
        );
        return res;
      },
      async (err) => {
        const originalConfig = err.config;
        // console.log('request error:', err.response);
        if (err.response) {
          logger.error(
            `IXnetClient.interceptors.retry: status error ${err.response.status}`,
            true
          );
          // Access Token was expired
          if (err.response.status === 401 && !originalConfig._retry) {
            originalConfig._retry = true;
            try {
              await this.getToken();
              return this.instance(originalConfig);
            } catch (_error) {
              logger.error(
                `IXnetClient.interceptors.retry: status error ${err.response.status}`,
                true
              );
              if (_error.response && _error.response.data) {
                return Promise.reject(_error.response.data);
              }
              return Promise.reject(_error);
            }
          }
          if (err.response.status === 403 && err.response.data) {
            return Promise.reject(err.response.data);
          }
        }
        return Promise.reject(err);
      }
    );
    // await this.getToken();
  }

  async getToken(): Promise<string> {
    try {
      const { login, username, password } = this.integration.config;
      logger.info(`IXnetClient getToken: ${this.integration.name}`);
      let data = qs.stringify({
        grant_type: 'password',
        username: username,
        password: password,
        client_id: 'Derco'
      });

      const response = await this.instance.post(login, data);
      this.integration.token = response.data.access_token;
      logger.info(
        `IXnetClient getToken ${this.integration.name}: ${response.data.access_token}`
      );

      await Integration.updateOne(
        { _id: (this.integration as any)._id },
        { token: response.data.access_token }
      );
      this.instance.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${response.data.access_token}`;
      return response.data.access_token;
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  }

  async getFrom(action: IIntegrationAction) {
    try {
      logger.info(`IXnetClient getFrom: ${this.integration.name}`);
      const response = await this.instance.get(`${action.url}`);
      // console.log(response.data);
      return response.data;
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  }
}
