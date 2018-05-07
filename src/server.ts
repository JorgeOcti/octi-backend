import * as bluebird from 'bluebird';
import * as mongoose from 'mongoose';
import app from './app';
import logger from './services/logger';

// Mongoose setting
const MONGODB_USER = process.env.MONGODB_USER || 'osacontrol';
const MONGODB_PASSWD = process.env.MONGODB_PASSWD || 'osacontrol';
const MONGODB_HOST = process.env.MONGODB_HOST || 'localhost';
const MONGODB_PORT = process.env.MONGODB_PORT || 27017;
const MONGODB_NAME = process.env.MONGODB_NAME || 'osa';

// Mongoose connect
const mongoDB = `mongodb://${MONGODB_USER}:${MONGODB_PASSWD}@${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_NAME}`;
mongoose.connect(mongoDB, (err) => {
  if (err) {
    throw err;
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
