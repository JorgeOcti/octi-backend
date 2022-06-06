import * as bluebird from 'bluebird';
import * as jwt from 'jsonwebtoken';
import * as mongoose from 'mongoose';
// @ts-ignore
import { Server, Socket } from 'socket.io';
// @ts-ignore
import { createAdapter } from "@socket.io/redis-adapter";
import app from './app';
import logger from './services/logger.service';
import redisClient, {createRedisClient} from './services/redis.service';
import GeneralUtils from './utils/general.utils';

const mongooseRedisCache = require("mongoose-redis-cache");

// Mongoose setting
const MONGODB_URI: string = process.env.MONGODB_URI || '';

// Mongoose connect
(mongoose as any).Promise = bluebird;
mongoose.connect!(MONGODB_URI, {useNewUrlParser: true,  useUnifiedTopology: true}, (err: any) => {
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
mongoose.set('debug', false);
const NODE_APP_INSTANCE: number = parseInt(process.env.NODE_APP_INSTANCE as string, 10) || 0;
const server = app.listen(parseInt(app.get('port'), 10) + NODE_APP_INSTANCE, () => {
  /* istanbul ignore if */
  if (app.get('env') !== 'testing') {
    console.log(`${logger.colors.magenta}------------------------${logger.colors.reset}`);
    console.log(`${logger.colors.brighCyan}OSA-ANDES ${logger.colors.white}v2.1.3 ${logger.colors.red}RELEASE ${logger.colors.brighGreen}NODE ${logger.colors.white}${process.version}${logger.colors.reset}`);
    console.log(`${logger.colors.magenta}------------------------${logger.colors.reset}`);
    console.log(`process.env.ENV ${process.env.ENV}`);
    console.log(
      'is running at http://localhost:%s in %s mode',
      app.get('port'),
      app.get('env')
    );
    console.log(`${logger.colors.brightBlack}Press CTRL-C to stop${logger.colors.reset}`);
  }
});

// @ts-ignore
export const io = new Server(server);
io.adapter(createAdapter(createRedisClient(), createRedisClient()));

/* istanbul ignore next */
io.use( async (socket: Socket, next: any) => {
  // validate token to use socket
  const token = socket.handshake.query.token as string;
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

/* istanbul ignore next */
io.on( 'connection', async ( socket: Socket) => {
  // logger.info(`socket.connection: {user: ${JSON.stringify((socket as any).user)}}`);
  socket.on('join', (data) => {
    const {room} = data;
    redisClient.get(room, async (error, result) => {
      let data: any;
      if (result) {
        data = JSON.parse(result);
        if (!result.hasOwnProperty((socket as any).user._id)) {
          data = {
            ...data,
            [(socket as any).user._id]: {
              firstName: (socket as any).user.firstName,
              lastName: (socket as any).user.lastName
            }
          };
          redisClient.set(room, JSON.stringify(data), 'ex', 60 * 30);
        }
      } else {
        data = {
          [(socket as any).user._id]: {
            firstName: (socket as any).user.firstName,
            lastName: (socket as any).user.lastName
          }
        };
        redisClient.set(room, JSON.stringify(data), 'ex', 60 * 30);
      }
      // logger.info(`socket.join.${room}: {user: ${JSON.stringify((socket as any).user)}}`);
      socket.join(room);
      io.to(room).emit('USERS_IN_CHANNEL', data);
    });
    return socket.id;
  });

  socket.on('leave', (data: any ) => {
    const {room} = data;
    redisClient.get(room, async (error, result) => {
      let data: any;
      if (result) {
        data = JSON.parse(result);
        const key = (socket as any).user._id;
        if (data.hasOwnProperty(key)) {
          delete data[key];
          redisClient.set(room, JSON.stringify(data), 'ex', 60 * 30);
        }
      }
      io.to(room).emit('USERS_IN_CHANNEL', data);
      // logger.info(`socket.leave.${room}: {user: ${JSON.stringify((socket as any).user)}}`);
      socket.leave(room);
    });
  });

  socket.on('disconnect',  () => {
    // logger.info(`socket.disconnect: {user: ${JSON.stringify((socket as any).user)}}`);
    // io.emit('user disconnected');
  });
});

export default server;
