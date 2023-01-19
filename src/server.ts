import * as bluebird from 'bluebird';

import * as mongoose from 'mongoose';


import GeneralUtils from './utils/general.utils';
import app from './app';

import logger from './services/logger.service';
import { socket } from './services/socket.service';

const mongooseRedisCache = require("mongoose-redis-cache");

// Mongoose setting
const MONGODB_URI: string = process.env.MONGODB_URI || '';

// Mongoose connect
(mongoose as any).Promise = bluebird;
mongoose.connect!(MONGODB_URI, {}, (err: any) => {
  if (err) {
    /* istanbul ignore next */
    console.log('Unable to connect to the mongodb instance. Error: ', err);
    throw err;
  }
  /* istanbul ignore if */
  mongooseRedisCache(mongoose, {
    host: GeneralUtils.getFromEnviroment('REDIS_SERVICE_SERVICE_HOST', 'localhost'),
    port: 6379
  });
  if (app.get('env') !== 'testing') {
    console.log('Mongoose Successfully connected');
  }
});
// mongoose.set('debug', app.get('env') === 'development');
// mongoose.set('debug', true);
mongoose.set('strictQuery', true);
mongoose.set('debug', false);
const NODE_APP_INSTANCE: number = parseInt(process.env.NODE_APP_INSTANCE as string, 10) || 0;
const server = app.listen(parseInt(app.get('port'), 10) + NODE_APP_INSTANCE, () => {
  /* istanbul ignore if */
  if (app.get('env') !== 'testing') {
    console.log(`${logger.colors.magenta}------------------------${logger.colors.reset}`);
    console.log(`${logger.colors.brighCyan}OSA-ANDES ${logger.colors.white}v2.1.3 ${logger.colors.red}RELEASE ${logger.colors.brighGreen}NODE ${logger.colors.white}${process.version}${logger.colors.reset}`);
    console.log(`${logger.colors.magenta}------------------------${logger.colors.reset}`);
    console.log(`process.env.NODE_APP_INSTANCE ${process.env.NODE_APP_INSTANCE}`);
    console.log(`process.env.ENV ${process.env.ENV}`);
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
