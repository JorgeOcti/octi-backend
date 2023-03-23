import * as bluebird from 'bluebird';
import * as mongoose from 'mongoose';
import app from './app';
import logger from './services/logger.service';
import { socket } from './services/socket.service';
import GeneralUtils from './utils/general.utils';
const mongooseRedisCache = require('mongoose-redis-cache');

async function main() {
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  mongoose.set('strictQuery', true);
  mongoose.set('debug', true);
  mongooseRedisCache(mongoose, {
    host: GeneralUtils.getFromEnviroment(
      'REDIS_SERVICE_SERVICE_HOST',
      'localhost'
    ),
    port: 6379
  });
  await mongoose.connect(MONGODB_URI, {  });
  console.log('Mongoose Successfully connected');
}

main().catch((err) => console.log(err));

const server = app.listen(parseInt(app.get('port'), 10), () => {
  /* istanbul ignore if */
  if (app.get('env') !== 'testing') {
    console.log(
      `${logger.colors.magenta}------------------------${logger.colors.reset}`
    );
    console.log(
      `${logger.colors.brighCyan}OSA-ANDES ${logger.colors.white}v2.1.3 ${logger.colors.red}RELEASE ${logger.colors.brighGreen}NODE ${logger.colors.white}${process.version}${logger.colors.reset}`
    );
    console.log(
      `${logger.colors.magenta}------------------------${logger.colors.reset}`
    );
    console.log(
      'is running at http://localhost:%s in %s mode',
      app.get('port'),
      app.get('env')
    );
    console.log(
      `${logger.colors.brightBlack}Press CTRL-C to stop${logger.colors.reset}`
    );
  }
});

socket(server);

export default server;
