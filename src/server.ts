import * as bluebird from 'bluebird';
import * as jwt from 'jsonwebtoken';
import * as mongoose from 'mongoose';
import * as socketIO from 'socket.io';
import * as socketRedis from 'socket.io-redis';
import app from './app';
import logger from './services/logger.service';

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
const NODE_APP_INSTANCE: number = parseInt(process.env.NODE_APP_INSTANCE as string, 10) || 0;
const server = app.listen(parseInt(app.get('port'), 10) + NODE_APP_INSTANCE, () => {
  /* istanbul ignore if */
  if (app.get('env') !== 'testing') {
    console.log(`${logger.colors.magenta}----------------------${logger.colors.reset}`);
    console.log(`${logger.colors.brighCyan}OSA-ANDES ${logger.colors.white}v1.1.2 ${logger.colors.brighGreen}RELEASE${logger.colors.reset}`);
    console.log(`${logger.colors.magenta}----------------------${logger.colors.reset}`);
    console.log(
      'is running at http://localhost:%s in %s mode',
      app.get('port'),
      app.get('env')
    );
    console.log(`${logger.colors.brightBlack}Press CTRL-C to stop${logger.colors.reset}`);
  }
});

export const io = socketIO(server);

io.adapter(socketRedis({
  host: process.env.REDIS_HOST ? process.env.REDIS_HOST : 'localhost',
  port: 6379
}));

io.use( async (socket, next) => {
  // validate token to use socket
  const token = socket.handshake.query.token;
  const msgErrorAuthentication: string = 'authentication error';
  if (token) {
    try {
      const user = await jwt.verify(token, process.env.SECRET_KEY || 'secretKey');
      if (user) {
        // socket: generate user room
        (socket as any).user = user;
        socket.join((user as any)._id);
        return next();
      } else {
        socket.disconnect();
        return next(new Error(msgErrorAuthentication));
      }
    } catch (e) {
      socket.disconnect();
      return next(new Error(msgErrorAuthentication));
    }
  } else {
    socket.disconnect();
    return next(new Error(msgErrorAuthentication));
  }
  // console.log('token', token);
  // if (isValid(token)) {
  //   return next();
  // }
  // return next(new Error('authentication error'));
});

io.on( 'connection', ( socket ) => {
  console.log('---------------------');
  console.log('A user connected');
  console.log('socket.id', socket.id);
  console.log('socket.user\n', (socket as any).user);

  socket.on('join', (data) => {
    console.log(`join ${data.room}`);
    socket.join(data.room);
  });

  socket.on('disconnect',  () => {
    console.log('---------------------');
    console.log('user disconnected');
    console.log('socket.user\n', (socket as any).user);
    // io.emit('user disconnected');
  });
});

export default server;
