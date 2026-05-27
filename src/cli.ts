import { mongoMigrateCli } from "mongo-migrate-ts";
import { buildMongoUri } from './services/mongo.service';

mongoMigrateCli({
  uri: buildMongoUri() || 'mongodb://osacontrol:osacontrol@localhost:27017',
  // database: 'migrations',
  migrationsDir: `${__dirname}/migrations`,
  migrationsCollection: 'migrations_collection',
});
