import * as jwt from 'jsonwebtoken';
import redisClient from './redis.service';
import { Server, Socket } from 'socket.io';
import { createAdapter } from "@socket.io/redis-adapter";
import * as http from 'http';

let io: Server;

export function socket(server?: http.Server): Server {
  if (server) {
    io = new Server(server);

    const pubClient = redisClient;
    const subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));

    // io.adapter(createAdapter(createRedisClient(), createRedisClient()));

    /* istanbul ignore next */
    io.use(async (socket: Socket, next: any) => {
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
    });

    /* istanbul ignore next */
    io.on('connection', async (socket: Socket) => {
      socket.on('join', (data) => {
        const { room } = data;
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
              redisClient.setex(room, 60 * 30, JSON.stringify(data));
            }
          } else {
            data = {
              [(socket as any).user._id]: {
                firstName: (socket as any).user.firstName,
                lastName: (socket as any).user.lastName
              }
            };
            redisClient.setex(room, 60 * 30, JSON.stringify(data));
          }
          // logger.info(`socket.join.${room}: {user: ${JSON.stringify((socket as any).user)}}`);
          socket.join(room);
          io.to(room).emit('USERS_IN_CHANNEL', data);
        });
        return socket.id;
      });

      socket.on('leave', (data: any) => {
        const { room } = data;
        redisClient.get(room, async (error, result) => {
          let data: any;
          if (result) {
            data = JSON.parse(result);
            const key = (socket as any).user._id;
            if (data.hasOwnProperty(key)) {
              delete data[key];
              redisClient.setex(room, 60 * 30, JSON.stringify(data));
            }
          }
          io.to(room).emit('USERS_IN_CHANNEL', data);
          socket.leave(room);
        });
      });

      socket.on('disconnect', () => {
        // logger.info(`socket.disconnect: {user: ${JSON.stringify((socket as any).user)}}`);
        // io.emit('user disconnected');
      });
    });

  }
  return io;

}

// export default io;
