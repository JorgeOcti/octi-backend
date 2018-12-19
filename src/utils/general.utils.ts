import {IAnyObject} from '../interfaces/global.interface';

class GeneralUtils {

  public getObjectProperty(obj: IAnyObject, attribute: string, defaultValue: any) {
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
}

export default new GeneralUtils();
