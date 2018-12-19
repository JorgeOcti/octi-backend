declare module 'mongoose'  {
  interface ConnectionOpenOptions extends ConnectionOptionsBase {
    /** mongoose-specific options */
    dbName?: string;
    config?: {
      /**
       * set to false to disable automatic index creation for all
       * models associated with this connection.
       */
      autoIndex?: boolean;
    };
  }
}
