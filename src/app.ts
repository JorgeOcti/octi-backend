import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as connectRedis from 'connect-redis';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import * as express from 'express';
import * as session from 'express-session';
import * as fileStreamRotator from 'file-stream-rotator';
import * as kue from 'kue';
// import * as lusca from 'lusca';
import * as morgan from 'morgan';
import * as multer from 'multer';
import * as passport from 'passport';
import * as passportLocal from 'passport-local';
import * as path from 'path';
import * as Raven from 'raven';
import * as responseTime from 'response-time';
import * as Staticify from 'staticify';
import AppController from './app/controllers/app.controller';
import User from './app/models/user.model';
import {appRouter, jwtRouter} from './app/router';
import EmailQueue from './app/tasks/email.task';
import formRouter from './form/router';
import {inventoryRouter} from './inventory/router';
import InventoryQueue from './inventory/taks/inventory.task';
import Middlewares from './middlewares/middlewares';

// Create Express server
const app = express();

// Configure sentry
// Load environment variables from .env file, where API keys and passwords are configured

(global as any).__rootdir__ = __dirname || process.cwd();
const root = (global as any).__rootdir__;
const LocalStrategy = passportLocal.Strategy;
// const gitCommit = git.long();
const redisStore = connectRedis(session);

dotenv.config({
  path: path.join(__dirname, '../.env')
});

/* istanbul ignore next */
Raven.config(process.env.SENTRY_DNS, {
  // release: gitCommit,
  tags: {
    // git_commit: gitCommit,
    environment: process.env.ENV || 'development'
  },
  environment: process.env.ENV,
  parseUser: (req) => {
    // custom user parsing logic
    const username = req.user ? req.user : {
      id: 0,
      email: 'anonymous'
    };
    return {
      email: username.email,
      name: `${username.firstName} ${username.lastName}`,
      id: username._id
    };
  },
  dataCallback: (data) => {
    const stacktrace = data.exception && data.exception[0].stacktrace;

    if (stacktrace && stacktrace.frames) {
      stacktrace.frames.forEach((frame: any) => {
        if (frame.filename.startsWith('/')) {
          frame.filename = 'app:///' + path.relative(root, frame.filename);
        }
      });
    }

    return data;
  }}).install();

// Middlewares
app.use(compression());
// app.use(lusca.xframe('SAMEORIGIN'));
// app.use(lusca.xssProtection(true));
app.use(responseTime());

// template engine
const viewDirectory = path.join(__dirname, '../views');
app.set('view engine', 'pug');
app.set('view cache', false);
app.set('views', viewDirectory);

// Set environment variables
app.set('env', process.env.ENV || 'development');
app.set('port', process.env.PORT || 3000);

app.locals.secretKey = process.env.SECRET_KEY;
app.locals.MIXPANEL = process.env.MIXPANEL;
app.locals.MAPBOX = process.env.MAPBOX;

// Remove x-powered-by
app.disable('x-powered-by');

// strict routing
app.set('strict routing', true);

// For parsing application/json
app.use(bodyParser.json({limit: '50mb'}));

// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true }));

// For parsing multipart/form-data
// const upload = multer({dest:'/tmp/'});
const upload = multer({
  storage: multer.diskStorage({
    destination: '/tmp/',
    filename: (req, file, callback) => {
      callback(null, file.originalname);
    }
  })
});
app.use(upload.any());

// static files
const staticDirectory = path.join(__dirname, '../public');
app.use(Middlewares.cleanStaticFiles);
app.use('/static', express.static(staticDirectory, { maxAge: '30 days' }));
const staticify = Staticify(staticDirectory);
app.use(staticify.middleware);
//
app.locals.getVersionedPath = staticify.getVersionedPath;
// app.helpers({getVersionedPath: staticify.getVersionedPath})

app.use(cookieParser());
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: (process.env.SECRET_KEY as string),
  cookie: {
    maxAge: 2592000000 // 30 * 24 * 60 * 60 * 1000 Rememeber 'me' for 30 days
  },
  store: new redisStore( {
    host: process.env.REDIS_SERVICE_SERVICE_HOST ? process.env.REDIS_SERVICE_SERVICE_HOST : 'localhost',
    port: 6379
  })
}));

// passport
app.use(passport.initialize());
app.use(passport.session());

// passport.use(new LocalStrategy((User as any).authenticate()));

/**
 * Sign in using Email and Password.
 */

passport.use(new LocalStrategy({ usernameField: 'username' }, (username, password, done) => {
  User.findOne({
    username: username.toLowerCase(),
    active: true
  }, (err, user: any) => {
    if (err) { return done(err); }
    if (!user) {
      return done(undefined, false, { message: `username ${username} not found.` });
    }
    user.comparePassword(password, (err: Error, isMatch: boolean) => {
      if (err) { return done(err); }
      if (isMatch) {
        return done(undefined, user);
      }
      return done(undefined, false, { message: 'Invalid email or password.' });
    });
  });
}));

passport.serializeUser((User as any).serializeUser());
// passport.deserializeUser((User as any).deserializeUser());
passport.deserializeUser(async (email, done) => {
  try {
    const user = await User.findOne({email}).populate([{
      path: 'userPermissions',
      select: ['codeName']
    }, {
      path: 'userForms',
      select: ['name']
    }, {
      path: 'venue',
      select: ['name']
    }, {
      path: 'company'
    }]);
    if (user) {
      done(null, user);
    } else {
      done(new Error('User not found'));
    }
  } catch (e) {
    /* istanbul ignore next */
    done(e);
  }
});

/*
passport.serializeUser<any, any>((user, done) => {
  done(undefined, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    if (user) {
      done(err, user);
    }
  });
});
*/

// Logger app
const logDirectory = path.join(__dirname, '../logs');
export const accessLogStream = fileStreamRotator.getStream({
  date_format: 'YYYYMMDD',
  // date_format: 'YYYY/MM/DD',
  filename: logDirectory + '/access-%DATE%.log',
  frequency: 'daily',
  verbose: false
});

app.use('/robots.txt', AppController.robots);
app.use('/health-check/', AppController.healthCheck);

/* istanbul ignore if */
if (app.get('env') !== 'testing') {
  morgan.token('remote-addr', (req: express.Request): string => {
    return (req.headers['x-real-ip'] as string) || (req.headers['x-forwarded-for'] as string) || req.connection.remoteAddress || '';
  });

  app.use(morgan('[:date[clf]] [INFO]: :remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time', {
    stream: accessLogStream
  }));
  app.use(morgan('[:date[clf]] [INFO]: :remote-addr :method :url :status :response-time ms - :res[content-length]'));
}

// The request handler must be the first middleware on the app
app.use(Raven.requestHandler());
app.use(Middlewares.context);

// Routes
app.use('/', appRouter);
app.use('/', formRouter);
app.use('/', inventoryRouter);
app.use('/api/v1', jwtRouter);

/* queues */
export const queue = kue.createQueue({
  redis: {
    host: process.env.REDIS_SERVICE_SERVICE_HOST ? process.env.REDIS_SERVICE_SERVICE_HOST : 'localhost',
    port: 6379
  }
});

new EmailQueue(queue).run();
new InventoryQueue(queue).run();
kue.app.listen((parseInt(process.env.PORT as string, 10) || 3000) + 40);

// The error handler must be before any other error middleware
app.use(Raven.errorHandler());

// Error handlers
interface IResponseError {
  error?: string;
  message?: string;
  status: number;
}

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const err: IResponseError = {
    message: 'Not Found',
    status: 404
  };
  /* istanbul ignore next */
  next(err);
});

/* istanbul ignore next */
app.use((err: IResponseError, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  const statusCode = [403, 404, 500].includes(err.status) ? err.status : 500;
  console.log('err', err);
  res.status(statusCode).render(statusCode.toString());
  // res.json({
  //   status: err.status,
  //   error: err.message ? err.message : err.error
  // });
  next();
});

export default app;
