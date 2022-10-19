// In this file you can configure migrate-mongo
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://osacontrol:osacontrol@localhost:27017';
export default {
  uri: MONGO_URI,
  migrationsPath: 'migrations',
  collection: 'migrations',
  templatePath: 'migrations/migration.template.ts',
  autosync: true
}
