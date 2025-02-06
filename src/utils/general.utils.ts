import { compileTemplate } from 'pug';
import * as pug from 'pug';
import { IAnyObject } from '../interfaces/global.interface';
import axios from 'axios';

interface IGeneralutils {
  getObjectProperty(
    obj: IAnyObject,
    attribute: string,
    defaultValue: any
  ): boolean;
  getFromEnviroment(name: string, defaultValue: string): string;
}

class GeneralUtils implements IGeneralutils {
  public getObjectProperty(
    obj: IAnyObject,
    attribute: string,
    defaultValue: any
  ): any {
    if (obj && obj.hasOwnProperty(attribute)) {
      return obj[attribute];
    } else {
      return defaultValue;
    }
  }

  public getFromEnviroment(name: string, defaultValue: string): string {
    if (process.env.hasOwnProperty(name) && process.env[name]) {
      return process.env[name] as string;
    } else {
      return defaultValue;
    }
  }

  public async imageToBase64(url: string) {
    if (url.length) {
      try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        let raw = Buffer.from(response.data).toString('base64');
        return 'data:' + response.headers['content-type'] + ';base64,' + raw;
      } catch (e) {
        console.log(e);
        return '';
      }
    } else {
      return '';
    }
  }

  public generateHtmlFromPugFile(path: string, context: any): any {
    try {
      const pugCompile: compileTemplate = pug.compileFile(path);
      return pugCompile(context);
    } catch (error) {
      console.log(error);
    }
  }

  public getFileFromRequest(
    files: Express.Multer.File[],
    name: string
  ): Express.Multer.File | undefined {
    if (files && files.length) {
      return files.find((file: Express.Multer.File) => file.fieldname === name);
    }
    return undefined;
  }

  public capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLocaleLowerCase();
  }
}
export default new GeneralUtils();
