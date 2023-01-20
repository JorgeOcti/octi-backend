import * as bluebird from 'bluebird';
import * as mongoose from 'mongoose';
import app from './app';
import logger from './services/logger.service';
import { socket } from './services/socket.service';
import GeneralUtils from './utils/general.utils';
const mongooseRedisCache = require("mongoose-redis-cache");


(mongoose as any).Promise = bluebird;
const MONGODB_URI: string = process.env.MONGODB_URI || '';
mongoose.connect!(MONGODB_URI, {}, (err: any) => {
  if (err) {
    console.log('Unable to connect to the mongodb instance. Error: ', err);
    throw err;
  }
  if (app.get('env') == 'production') {
    mongooseRedisCache(mongoose, {
      host: GeneralUtils.getFromEnviroment('REDIS_SERVICE_SERVICE_HOST', 'localhost'),
      port: 6379
    });
  }
  if (app.get('env') !== 'testing') {
    console.log('Mongoose Successfully connected');
  }
});

mongoose.set('strictQuery', true);
mongoose.set('debug', false);

const server = app.listen(parseInt(app.get('port'), 10), () => {
  /* istanbul ignore if */
  if (app.get('env') !== 'testing') {
    console.log(`${logger.colors.magenta}------------------------${logger.colors.reset}`);
    console.log(`${logger.colors.brighCyan}OSA-ANDES ${logger.colors.white}v2.1.3 ${logger.colors.red}RELEASE ${logger.colors.brighGreen}NODE ${logger.colors.white}${process.version}${logger.colors.reset}`);
    console.log(`${logger.colors.magenta}------------------------${logger.colors.reset}`);
    console.log(
      'is running at http://localhost:%s in %s mode',
      app.get('port'),
      app.get('env')
    );
    console.log(`${logger.colors.brightBlack}Press CTRL-C to stop${logger.colors.reset}`);
  }
});

socket(server);

export default server;
