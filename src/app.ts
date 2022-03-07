import * as bodyParser from 'body-parser';
import * as Bull from 'bull';
import { DoneCallback, Job } from 'bull';
import * as compression from 'compression';
import * as connectRedis from 'connect-redis';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import * as express from 'express';
import * as session from 'express-session';
import * as fileStreamRotator from 'file-stream-rotator';
import * as kue from 'kue';
import * as morgan from 'morgan';
import * as multer from 'multer';
import * as moment from 'moment-timezone';
import { passport } from './passport.conf';
// const passportSaml = require('passport-saml');
import * as path from 'path';
import * as Raven from 'raven';
import * as responseTime from 'response-time';
import * as Staticify from 'staticify';
import AppController from './app/controllers/app.controller';
import { appRouter, jwtRouter } from './app/router';
import EmailQueue from './app/tasks/email.task';
import { billingRouter } from './billing/router';
import BillingQueue from './billing/tasks/billing.task';
import formRouter from './form/router';
import { inventoryRouter } from './inventory/router';
import InventoryQueue from './inventory/taks/inventory.task';
import Middlewares from './middlewares/middlewares';
import { planningRouter } from './planning/router';
import { requestRouter } from './request/router';
import redisClient, { createRedisClient } from './services/redis.service';
import { distributionRouter } from './distribution/router';
import { CookieOptions } from 'express-session';

// Create Express server
const app = express();

// Configure sentry
// Load environment variables from .env file, where API keys and passwords are configured

(global as any).__rootdir__ = __dirname || process.cwd();
const root = (global as any).__rootdir__;
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

    if (stacktrace) {
      if (stacktrace.frames) {
        stacktrace.frames.forEach((frame: any) => {
          if (frame.filename.startsWith('/')) {
            frame.filename = 'app:///' + path.relative(root, frame.filename);
          }
        });
      }
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

app.use(cookieParser());

// For parsing application/json
app.use(bodyParser.json({limit: '50mb'}));

// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true }));

// For parsing multipart/form-data
// const upload = multer({dest:'/tmp/'});
const upload = multer({
  limits: { fieldSize: 32 * 1024 * 1024 },
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
app.locals.moment = moment;
// app.helpers({getVersionedPath: staticify.getVersionedPath})

// if (process.env.NODE_ENV === 'production') {
//
// }
app.set('trust proxy', 1); // trust first proxy
let cookieSetting: CookieOptions = {
  secure: process.env.ENV === 'production',
  maxAge: 2592000000 // 30 * 24 * 60 * 60 * 1000 Rememeber 'me' for 30 days
};
if (process.env.ENV === 'production') {
  cookieSetting.sameSite = 'none';
}

app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: (process.env.SECRET_KEY as string),
  cookie: {
    ...cookieSetting
  },
  store: new redisStore({ client: redisClient as any })
}));

app.use(passport.initialize());
app.use(passport.session());

// app.use(passport.authenticate('session'));

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
  app.use(morgan('\x1b[90m[:date[clf]] [INFO]:\x1b[0m :remote-addr :method :url :status :response-time ms - :res[content-length]'));
}

// The request handler must be the first middleware on the app
app.use(Raven.requestHandler());
app.use(Middlewares.context);

// Routes
app.use('/', appRouter);
app.use('/', formRouter);
app.use('/', planningRouter);
app.use('/', inventoryRouter);
app.use('/', requestRouter);
app.use('/', distributionRouter);
app.use('/', billingRouter);
app.use('/api/v1', jwtRouter);

/* queues */
export const queue = kue.createQueue({
  redis: {
    createClientFactory: () => {
      return createRedisClient();
    }
  }
});

const billingQueue = new Bull('billing', {
  createClient: () => {
    return createRedisClient();
  },
  prefix: '{andes}'
});

(async () => {
  try {
    // let job = await billingQueue.removeRepeatable('task', {cron: '0 47 6 * * 4'});
    const jobs = await billingQueue.getRepeatableJobs();
    if (jobs && jobs.length) {
      for (const job of jobs) {
        await billingQueue.removeRepeatableByKey(job.key);
        console.log(`${jobs[0].key} Removida`);
      }
    }
    await billingQueue.clean(0, 'delayed');
    console.log('Se ejecuto la limpieza de tareas');
  } catch (error) {
    console.log(error);
    console.log('NO existen tareas');
  }
  if (process.env.ENV === 'development') {
    // billingQueue.add({}, {repeat: {cron: '0 */1 * * *'}, jobId: 'billing'});
    // billingQueue.add({}, {repeat: {cron: '*/10 * * * *'}, jobId: 'billing'});
  } else if (process.env.ENV === 'production') {
    billingQueue.process(async (job: Job, done: DoneCallback) => {
      await new BillingQueue().processBilling();
      done();
    });
    await billingQueue.add({}, { repeat: { cron: '0 1 1 * *' }, jobId: 'billing' });
  }
})();


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

export { app as default };
