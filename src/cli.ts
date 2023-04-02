import { mongoMigrateCli } from "mongo-migrate-ts";

mongoMigrateCli({
  uri: process.env.MONGODB_URI ?? 'mongodb://osacontrol:osacontrol@localhost:27017',
  // database: 'migrations',
  migrationsDir: `${__dirname}/migrations`,
  migrationsCollection: 'migrations_collection',
});
