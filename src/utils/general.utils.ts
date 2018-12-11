class GeneralUtils {

  public getObjectAttribute(obj: { [key: string]: any }, attribute: string, defaultValue: any) {
    if (obj.hasOwnProperty(attribute)) {
      return obj[attribute];
    } else {
      return defaultValue;
    }
  }
}

export default new GeneralUtils();
