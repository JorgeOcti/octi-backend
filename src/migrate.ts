// In this file you can configure migrate-mongo
// const MONGO_URI = 'mongodb+srv://osacontrol:B72R32mTPJeuw8ni7v4AYJ7ZzMyf6f9@osaproduction-uln1t.mongodb.net/osaAndesProduction?retryWrites=true&w=majority';
const MONGO_URI =
  process.env.MONGODB_URI || 'mongodb://osacontrol:osacontrol@localhost:27017';
export default {
  uri: MONGO_URI,
  migrationsPath: 'migrations',
  collection: 'migrations',
  templatePath: 'migrations/migration.template.ts',
  autosync: true
};
