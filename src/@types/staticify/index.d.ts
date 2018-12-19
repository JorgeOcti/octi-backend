declare module 'staticify'  {
  function s(patch: string, options?:s.IOptions): s.IStaticify;

    namespace s {

      interface IOptions {
        shortHash?: boolean;
        includeAll?: boolean;
      }

      interface IStaticify  {
        middleware: () => void;
        getVersionedPath: (patch?: string) => void;
        replacePaths: (patch?: string) => void;
      }
    }

    export = s;
}
