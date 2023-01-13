import * as bodyParser from 'body-parser';
import * as Bull from 'bull';
import { DoneCallback, Job } from 'bull';
import * as compression from 'compression';
import * as connectRedis from 'connect-redis';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import * as express from 'express';
import * as session from 'express-session';
import { CookieOptions } from 'express-session';
import * as kue from 'kue';
import * as morgan from 'morgan';
import * as multer from 'multer';
import * as moment from 'moment-timezone';
import { passport } from './passportConfig';
import * as swaggerUi from 'swagger-ui-express';
import * as swaggerJSDoc from 'swagger-jsdoc';
import * as path from 'path';
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
import { statsRouter } from './stats/router';
import HistoryQueue from './app/tasks/history.task';
import logger from './services/logger.service';
import { queue } from './utils/queue';
import BillingTeamQueue from './billing/tasks/billingTeam.task';
import { swaggerDefinition } from './swagger-schemas/swaggerDefinition';

import * as promBundle from "express-prom-bundle";

const metricsMiddleware = promBundle({includeMethod: true, includePath: true})

// Create Express server
const app = express();



const redisStore = connectRedis(session);

dotenv.config({
  path: path.join(__dirname, '../.env')
});

/* istanbul ignore next */
import * as Sentry from '@sentry/node';

Sentry.init({ dsn: process.env.SENTRY_DNS });

// Middlewares
app.use(compression());
// app.use(lusca.xframe('SAMEORIGIN'));
// app.use(lusca.xssProtection(true));
app.use(responseTime());

// template engine
const viewDirectory = path.join(__dirname, '../views');
app.set('view engine', 'pug');
app.set('view cache', process.env.ENV === 'production');
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
app.use(bodyParser.json({ limit: '50mb' }));

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

app.use(metricsMiddleware);

app.locals.getVersionedPath = staticify.getVersionedPath;
app.locals.moment = moment;

app.set('trust proxy', 1); // trust first proxy
let cookieSetting: CookieOptions = {
  secure: process.env.ENV === 'production',
  maxAge: 2592000000 // 30 * 24 * 60 * 60 * 1000 Rememeber 'me' for 30 days
};
if (process.env.ENV === 'production') {
  cookieSetting.sameSite = 'none';
}

// logger.info(`Setting cookies ${JSON.stringify(cookieSetting)}`);

app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: (process.env.SECRET_KEY as string),
  cookie: {
    ...cookieSetting
  },
  // proxy: process.env.ENV === 'production',
  store: new redisStore({ client: redisClient as any })
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/robots.txt', AppController.robots);
app.use('/health-check/', AppController.healthCheck);

/* istanbul ignore if */
if (app.get('env') !== 'testing') {
  morgan.token('remote-addr', (req: express.Request): string => {
    return (req.headers['x-real-ip'] as string) || (req.headers['x-forwarded-for'] as string) || req.connection.remoteAddress || '';
  });
  if (process.env.ENV === 'production') {
    app.use(morgan('\x1b[0m[INFO]\x1b[36m :remote-addr :method :url :status \x1b[32m:response-time ms\x1b[0m\ - :res[content-length]\x1b[0m'));
  } else {
    app.use(morgan('\x1b[0m[INFO]\x1b[90m\x1b[36m :method \x1b[94m:url \x1b[0m:status \x1b[32m:response-time ms\x1b[0m\ - :res[content-length]\x1b[0m'));
  }
}

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler({
  user: ['id', 'username', 'email'],
  request: true,
  flushTimeout: 4000 // default: 2000
}));
app.use(Middlewares.context);

// Routes
app.use('/', appRouter);
app.use('/', formRouter);
app.use('/', planningRouter);
app.use('/', inventoryRouter);
app.use('/', requestRouter);
app.use('/', distributionRouter);
app.use('/', billingRouter);
app.use('/', statsRouter);
app.use('/api/v1', jwtRouter);

const options: swaggerJSDoc.Options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: [path.join(__dirname, './**/router.ts'), path.join(__dirname, './**/router.js')]
};

const swaggerDocs = swaggerJSDoc(options);
app.use('/api-docs/', swaggerUi.serve, swaggerUi.setup(swaggerDocs, { customSiteTitle: 'Documentación API OSA Andes' }));


const billingQueue = new Bull('billing', {
  createClient: () => {
    return createRedisClient();
  },
  prefix: '{andes}'
});
const billingCorporateQueue = new Bull('billingCorporate', {
  createClient: () => {
    return createRedisClient();
  },
  prefix: '{andes}'
});

(async () => {
  try {
    const billingSettings = await billingCorporateQueue.getRepeatableJobs();
    if (billingSettings && billingSettings.length) {
      for (const job of billingSettings) {
        await billingCorporateQueue.removeRepeatableByKey(job.key);
        console.log(`${billingSettings[0].key} Removida`);
      }
    }
    await billingCorporateQueue.clean(0, 'delayed');

    const billing = await billingQueue.getRepeatableJobs();
    if (billing && billing.length) {
      for (const job of billing) {
        await billingQueue.removeRepeatableByKey(job.key);
        console.log(`${billing[0].key} Removida`);
      }
    }
    await billingQueue.clean(0, 'delayed');
    console.log('Se ejecuto la limpieza de tareas');
  } catch (error) {
    // console.log(error);
    console.log('NO existen tareas');
  }
  if (process.env.ENV === 'development') {
    /*billingQueue.process(async (job: Job, done: DoneCallback) => {
      await new BillingQueue().processBilling();
      done();
    });
    try {
      await billingQueue.add({}, { repeat: { cron: '0 1 1 * *' }, jobId: 'billing' });
    } catch (error) {
      // console.log(error);
      console.log('No se pudo agrega tarea');
    }*/
    // billingQueue.add({}, {repeat: {cron: '*/10 * * * *'}, jobId: 'billing'});
  } else if (process.env.ENV === 'production') {
    billingQueue.process(async (job: Job, done: DoneCallback) => {
      await new BillingQueue().processBilling();
      done();
    });
    billingCorporateQueue.process(async (job: Job, done: DoneCallback) => {
      await new BillingTeamQueue().processBilling({});
      done();
    });
    try {
      await billingQueue.add({}, { repeat: { cron: '0 1 1 * *' }, jobId: 'billing' });
      await billingCorporateQueue.add({}, { repeat: { cron: '0 1 * * *' }, jobId: 'billing' });
    } catch (error) {
      // console.log(error);
      console.log('No se pudo agrega tarea');
    }
  }
})();


new EmailQueue(queue).run();
new InventoryQueue(queue).run();
new HistoryQueue(queue).run();
kue.app.listen((parseInt(process.env.PORT as string, 10) || 3000) + 40);

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

// Error handlers
interface IResponseError {
  error?: string;
  message?: string;
  status: number;
  stack?: string;
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
  console.log(err.stack || err)
  logger.error(`Server.processError: session: ${JSON.stringify(req.session)}`);
  logger.error(`Server.processError: ${JSON.stringify({
    url: req.url,
    status: err.status,
    statusCode,
    message: err
  })}`);
  res.status(statusCode).render(statusCode.toString());
  // res.json({
  //   status: err.status,
  //   error: err.message ? err.message : err.error
  // });
  next();
});

export { app as default };
