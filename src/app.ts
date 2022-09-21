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
import * as swaggerUi from "swagger-ui-express";
import * as swaggerJSDoc from "swagger-jsdoc";
// const passportSaml = require('passport-saml');
import * as path from 'path';
// import * as Raven from 'raven';
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
// import { accessLogStream } from './services/logger.service';
import HistoryQueue from './app/tasks/history.task';
import logger from './services/logger.service';
import {queue} from "./utils/queue";
// import GeneralUtils from './utils/general.utils';

// Create Express server
const app = express();

// Configure sentry
// Load environment variables from .env file, where API keys and passwords are configured

// (global as any).__rootdir__ = __dirname || process.cwd();
// const root = (global as any).__rootdir__;
// const gitCommit = git.long();
const redisStore = connectRedis(session);

dotenv.config({
  path: path.join(__dirname, '../.env')
});

/* istanbul ignore next */
const Sentry = require('@sentry/node');

Sentry.init({ dsn: process.env.SENTRY_DNS });
// Raven.config(process.env.SENTRY_DNS, {
//   // release: gitCommit,
//   tags: {
//     // git_commit: gitCommit,
//     environment: process.env.ENV || 'development'
//   },
//   environment: process.env.ENV,
//   parseUser: (req) => {
//     // custom user parsing logic
//     const username = req.user ? req.user : {
//       id: 0,
//       email: 'anonymous'
//     };
//     return {
//       email: username.email,
//       name: `${username.firstName} ${username.lastName}`,
//       id: username._id
//     };
//   },
//   dataCallback: (data) => {
//     const stacktrace = data.exception && data.exception[0].stacktrace;
//
//     if (stacktrace) {
//       if (stacktrace.frames) {
//         stacktrace.frames.forEach((frame: any) => {
//           if (frame.filename.startsWith('/')) {
//             frame.filename = 'app:///' + path.relative(root, frame.filename);
//           }
//         });
//       }
//     }
//
//     return data;
//   }}).install();

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

logger.info(`Setting cookies ${JSON.stringify(cookieSetting)}`);

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


app.use('/robots.txt', AppController.robots);
app.use('/health-check/', AppController.healthCheck);

/* istanbul ignore if */
if (app.get('env') !== 'testing') {
  morgan.token('remote-addr', (req: express.Request): string => {
    return (req.headers['x-real-ip'] as string) || (req.headers['x-forwarded-for'] as string) || req.connection.remoteAddress || '';
  });

  // app.use(morgan('[:date[clf]] [INFO]: :remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time', {
  //   stream: accessLogStream
  // }));
  if (process.env.ENV === 'production') {
    // app.use(morgan('\x1b[90m[:date[clf]] [INFO]:\x1b[36m :remote-addr :method :url :status \x1b[32m:response-time ms\x1b[0m\ - :res[content-length]\x1b[0m'));
    app.use(morgan('\x1b[0m[INFO]\x1b[36m :remote-addr :method :url :status \x1b[32m:response-time ms\x1b[0m\ - :res[content-length]\x1b[0m'));
  } else {
    app.use(morgan('\x1b[0m[INFO]\x1b[90m\x1b[36m :method \x1b[94m:url \x1b[0m:status \x1b[32m:response-time ms\x1b[0m\ - :res[content-length]\x1b[0m'));
  }

}

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler({
  user: ['id', 'username', 'email'],
  request: true,
  // generate transaction name
  //   path == request.path (eg. "/foo")
  //   methodPath == request.method + request.path (eg. "GET|/foo")
  //   handler == function name (eg. "fooHandler")
  transaction: 'fooHandler',
  // timeout for fatal route errors to be delivered
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

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'OSA API Swagger',
    version: '1.0.0',
    description:
      'Esta es la primera implementación de Swagger para la API de entegas diarias.',
    contact: {
      name: 'Documentación',
      url: 'https://sites.google.com/osacontrol.com/doc-osa-api/inicio',
    },
  },
  components: {
    schemas: {
      Car: {
        type: "object",
        properties: {
          _id: {
            type: "string",
          },
          vin: {
            type: "string",
          },
          patent: {
            type: "string",
          },
          type: {
            type: "string",
          },
          brand: {
            type: "string",
          },
          denomination: {
            type: "string",
          },
          color: {
            type: "string",
          }
        }
      },
      User: {
        type: "object",
        properties: {
          _id: {
            type: "string",
          },
          firstName: {
            type: "string",
          },
          lastName: {
            type: "string",
          },
          email: {
          type: "string",
          },
        }
      },
      Venue: {
        type: "object",
        properties: {
          _id: {
            type: "string",
          },
          name: {
            type: "string",
          },
        }
      },
      Participant: {
        type: "object",
        properties: {
          _id: {
            type: "string",
            format: "UUID",
            example: "b938beb1bcb6493e8418a818a22256fd"
          },
          name: {
            type: "string",
            example: "Entrega a cliente"
          },
          car: {
            "$ref": "#/components/schemas/Car"
          },
          user: {
            "$ref": "#/components/schemas/User"
          },
          venue: {
            "$ref": "#/components/schemas/Venue"
          },
          number: {
            type: "integer",
            format: "int32",
            example: 7
          },
          createdAt: {
            type: "string",
            format: "date-time"
          },
          sections: {
            type: "array",
            items: {
              "$ref": "#/components/schemas/Section"
            }
          }
        },
      },
      Section: {
        type: "object",
        properties: {
          _id: {
            type: "string",
            format: "UUID",
            example: "b938beb1bcb6493e8418a818a22256fd"
          },
          name: {
            type: "string",
            example: "Datos del cliente"
          },
          order: {
            type: "integer",
            format: "int32",
            example: 1
          },
          answers: {
            type: "array",
            items: {
              "$ref": "#/components/schemas/Answer"
            }
          }
        }
      },
      Answer: {
        type: "object",
        properties: {
          accessories: {
            type: "array",
            items:{
              type: "object",
              properties: {
                _id: {
                  type: "string" ,
                },
                question: {
                  type: "string",
                },
                items: {
                  type: "array",
                  items: {
                    "$ref": "#/components/schemas/Accessory"
                  }
                  // type: Array<Accessory>,
                },
              }
            }
          },
          accesoriesSelected: {
            type: "array",
            items: {
              "$ref": "#/components/schemas/AccessorySelected"
            }
            // type: Array<AccessorySelected>,
          },
          images: {
            type: "array",
            items: {
              "$ref": "#/components/schemas/Image"
            }
            // type: Array<Image>,
          },
          kind: {
            type: "string",
          },
          optional: {
            type: "boolean",
          },
          requireSeverity: {
            type: "boolean",
          },
          damage: {
            type: "array",
            items: {
              type: "object",
              properties: {
                positions: {
                  type: "array",
                  items: {
                    "$ref": "#/components/schemas/Position"
                  }
                  // type: Array<Positions>,
                },
                kinds: {
                  type: "array",
                  items: {
                    "$ref": "#/components/schemas/Kind"
                  }
                  // type: Array<Kind>,
                },
                parts: {
                  type: "array",
                  items: {
                    "$ref": "#/components/schemas/Part"
                  }
                  // type: Array<Parts>,
                },
                severityOptions: {
                  type: "array",
                  items: "string"
                },
              }
            }
          },
          damagesSelected: {
            type: "array",
            items: {
              "$ref": "#/components/schemas/DamageSelected"
            }
            // type: Array<DamageSelected>,
          },
          accesoriesAnswered: {
            type: "array",
            items: "string",
          },
          _id: {
            type: "string",
          },
          question: {
            type: "string",
          },
          scale: {
            _id: {
              type: "string",
            },
            choices: {
              type: "array",
              items: {
                "$ref": "#/components/schemas/Choice"
              }
            },
          },
          comment: {
            type: "string",
          },
          answer: {
            type: "string",
          },
          order: {
            type: "integer",
          },
        }
      },
      Accessory: {
        type: "object",
        properties: {
          amount: {
            type: "boolean",
          },
          item: {
            type: "string",
          },
          _id: {
            type: "string",
          },
        }
      },
    AccessorySelected: {
      type: "object",
      properties: {
        amount: {
          type: "integer",
        },
        item: {
          type: "string",
        },
      }
    },
    Image: {
      type: "object",
      properties: {
        _id: {
          type: "string",
        },
        file: {
          type: "object",
          properties: {
            type: {
              type: "string",
            },
            url: {
              type: "string",
            }
          }
        }
      }
    },
      Position: {
        type: "object",
        properties: {
          _id: {
            type: "string",
          },
          name: {
            type: "string",
          },
        }
      },
      Kind: {
        type: "object",
        properties: {
          _id: {
            type: "string",
          },
          name: {
            type: "string",
          },
        }
      },
      Part: {
        type: "object",
        properties: {
          _id: {
            type: "string",
          },
          name: {
            type: "string",
          },
        }
      },
      DamageSelected: {
        type: "object",
        properties: {
          images: {
            type: "array",
            items: {
              "$ref": "#/components/schemas/Image"
            }
          },
          _id: {
            type: "string",
          },
          kind: {
            type: "string",
          },
          part: {
            type: "string",
          },
          position: {
            type: "string",
          },
          severity: {
            type: "string",
          },
        }
      },
      Choice: {
        type: "object",
        properties: {
          backgroundColor: {
            type: "string",
          },
          requireImage: {
            type: "boolean",
          },
          requireComment: {
            type: "boolean",
          },
          requireAccesories: {
            type: "boolean",
          },
          _id: {
            type: "string",
          },
          choice: {
            type: "string",
          },
          order: {
            type: "integer",
          },
        }
      }
    },
    securitySchemes: {
      bearerAuth: {
        type: "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
      }
    }
  },
  servers: [{
      url: process.env.SITE_URL,
      description: 'Development server',
    },
  ],
};

const options : swaggerJSDoc.Options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: [path.join(__dirname, "./**/*.ts"), path.join(__dirname, "./**/*.js") ]
};

const swaggerDocs =  swaggerJSDoc(options);
app.use("/api-docs/", swaggerUi.serve, swaggerUi.setup(swaggerDocs))


const billingQueue = new Bull('billing', {
   // redis: {
   //   host: GeneralUtils.getFromEnviroment('REDIS_SERVICE_SERVICE_HOST', 'localhost'),
   //   port: 6379
   // },
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
    try {
      await billingQueue.add({}, { repeat: { cron: '0 1 1 * *' }, jobId: 'billing' });
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

// Optional fallthrough error handler
/*app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});*/

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
  logger.error(`Server.processError: session: ${JSON.stringify(req.session)}`);
  logger.error(`Server.processError: ${JSON.stringify({
    url: req.url,
    status: err.status,
    statusCode,
    error: err
  })}`);
  res.status(statusCode).render(statusCode.toString());
  // res.json({
  //   status: err.status,
  //   error: err.message ? err.message : err.error
  // });
  next();
});

export { app as default };
