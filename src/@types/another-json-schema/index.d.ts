declare module 'another-json-schema' {

  module AJS {

  }
  interface IActions {
    validate: (data: any) => any;
  }

  function AJS(name: string, options: any): IActions;

  export = AJS;
}
