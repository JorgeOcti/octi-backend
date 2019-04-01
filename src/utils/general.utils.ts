import {compileTemplate} from 'pug';
import * as pug from 'pug';
import {IAnyObject} from '../interfaces/global.interface';

interface IGeneralutils {
  getObjectProperty(obj: IAnyObject, attribute: string, defaultValue: any): boolean;
  getFromEnviroment(name: string, defaultValue: string): string;
}

class GeneralUtils implements IGeneralutils {

  public getObjectProperty(obj: IAnyObject, attribute: string, defaultValue: any): any {
    if (obj.hasOwnProperty(attribute)) {
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

  public generateHtmlFromPugFile(path: string, context: any) {
    const pugCompile: compileTemplate = pug.compileFile(path);
    return pugCompile(context);
  }
}

export default new GeneralUtils();
