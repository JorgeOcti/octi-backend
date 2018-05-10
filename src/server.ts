import * as bluebird from 'bluebird';
import * as mongoose from 'mongoose';
import app from './app';
import logger from './services/logger';

// Mongoose setting
const MONGODB_URI: string = process.env.MONGODB_URI || '';

// Mongoose connect
mongoose.connect(MONGODB_URI, {useMongoClient: true}, (err) => {
  if (err) {
    console.log('Unable to connect to the mongodb instance. Error: ', err);
    // throw err;
  }
  /* istanbul ignore if */
  if (app.get('env') !== 'testing') {
    console.log('Mongoose Successfully connected');
  }
});
(mongoose as any).Promise = bluebird;
// mongoose.Promise = global.Promise;
mongoose.set('debug', app.get('env') !== 'testing');
// mongoose.set('debug', false);
const server = app.listen(app.get('port'), () => {
  /* istanbul ignore if */
  if (app.get('env') !== 'testing') {
    console.log(`${logger.colors.magenta}----------------------${logger.colors.reset}`);
    console.log(`${logger.colors.brighCyan}OSA-ANDES ${logger.colors.white}v1.0.0 ${logger.colors.brighGreen}RELEASE${logger.colors.reset}`);
    console.log(`${logger.colors.magenta}----------------------${logger.colors.reset}`);
    console.log(
      'is running at http://localhost:%s in %s mode',
      app.get('port'),
      app.get('env')
    );
    console.log(`${logger.colors.brightBlack}Press CTRL-C to stop${logger.colors.reset}`);
  }
});

export default server;
