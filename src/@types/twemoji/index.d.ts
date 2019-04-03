declare module 'twemoji'  {
  function s(test: string): s.ITwemoji;

    namespace s {

      interface ITwemoji  {
        parse: () => string;
      }
    }

    export = s;
}
