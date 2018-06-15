import * as bluebird from 'bluebird';
import * as mongoose from 'mongoose';
import app from './app';
import logger from './services/logger.service';
import * as socketIO from 'socket.io';
import * as socketRedis from 'socket.io-redis';

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
const NODE_APP_INSTANCE: number = parseInt(process.env.NODE_APP_INSTANCE as string) || 0;
const server = app.listen(parseInt(app.get('port')) + NODE_APP_INSTANCE, () => {
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

export const io = socketIO(server);

io.adapter(socketRedis({ host: 'localhost', port: 6379 }));

io.on( "connection", function( socket ) {
  console.log('socket.id', socket.id);
  console.log("A user connected");
  socket.on('private message', function (from, msg) {
    console.log('I received a private message by ', from, ' saying ', msg);
  });

  socket.on('disconnect', function () {
    console.log("user disconnected");
    // io.emit('user disconnected');
  });
});


export default server;
