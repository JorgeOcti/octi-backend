"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queue = exports.accessLogStream = void 0;
const bodyParser = require("body-parser");
const compression = require("compression");
const connectRedis = require("connect-redis");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const express = require("express");
const session = require("express-session");
const fileStreamRotator = require("file-stream-rotator");
const kue = require("kue");
const morgan = require("morgan");
const multer = require("multer");
const Bull = require("bull");
const passport = require("passport");
const passportLocal = require("passport-local");
const path = require("path");
const Raven = require("raven");
const responseTime = require("response-time");
const Staticify = require("staticify");
const app_controller_1 = require("./app/controllers/app.controller");
const user_model_1 = require("./app/models/user.model");
const router_1 = require("./app/router");
const email_task_1 = require("./app/tasks/email.task");
const router_2 = require("./form/router");
const router_3 = require("./inventory/router");
const router_4 = require("./request/router");
const inventory_task_1 = require("./inventory/taks/inventory.task");
const middlewares_1 = require("./middlewares/middlewares");
const redis_service_1 = require("./services/redis.service");
const router_5 = require("./planning/router");
const billing_task_1 = require("./billing/tasks/billing.task");
const router_6 = require("./billing/router");
// Create Express server
const app = express();
// Configure sentry
// Load environment variables from .env file, where API keys and passwords are configured
global.__rootdir__ = __dirname || process.cwd();
const root = global.__rootdir__;
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
        if (stacktrace) {
            if (stacktrace.frames) {
                stacktrace.frames.forEach((frame) => {
                    if (frame.filename.startsWith('/')) {
                        frame.filename = 'app:///' + path.relative(root, frame.filename);
                    }
                });
            }
        }
        return data;
    }
}).install();
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
app.use(bodyParser.json({ limit: '50mb' }));
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
app.use(middlewares_1.default.cleanStaticFiles);
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
    secret: process.env.SECRET_KEY,
    cookie: {
        maxAge: 2592000000 // 30 * 24 * 60 * 60 * 1000 Rememeber 'me' for 30 days
    },
    store: new redisStore({ client: redis_service_1.default })
}));
// passport
app.use(passport.initialize());
app.use(passport.session());
// passport.use(new LocalStrategy((User as any).authenticate()));
/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({ usernameField: 'username' }, (username, password, done) => {
    user_model_1.default.findOne({
        username: username.toLowerCase(),
        active: true
    }, (err, user) => {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(undefined, false, { message: `username ${username} not found.` });
        }
        user.comparePassword(password, (err, isMatch) => {
            if (err) {
                return done(err);
            }
            if (isMatch) {
                return done(undefined, user);
            }
            return done(undefined, false, { message: 'Invalid email or password.' });
        });
    });
}));
passport.serializeUser(user_model_1.default.serializeUser());
// passport.deserializeUser((User as any).deserializeUser());
passport.deserializeUser(async (email, done) => {
    try {
        const user = await user_model_1.default.findOne({ email }).populate([{
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
        }
        else {
            done(new Error('User not found'));
        }
    }
    catch (e) {
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
exports.accessLogStream = fileStreamRotator.getStream({
    date_format: 'YYYYMMDD',
    // date_format: 'YYYY/MM/DD',
    filename: logDirectory + '/access-%DATE%.log',
    frequency: 'daily',
    verbose: false
});
app.use('/robots.txt', app_controller_1.default.robots);
app.use('/health-check/', app_controller_1.default.healthCheck);
/* istanbul ignore if */
if (app.get('env') !== 'testing') {
    morgan.token('remote-addr', (req) => {
        return req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
    });
    app.use(morgan('[:date[clf]] [INFO]: :remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time', {
        stream: exports.accessLogStream
    }));
    app.use(morgan('\x1b[90m[:date[clf]] [INFO]:\x1b[0m :remote-addr :method :url :status :response-time ms - :res[content-length]'));
}
// The request handler must be the first middleware on the app
app.use(Raven.requestHandler());
app.use(middlewares_1.default.context);
// Routes
app.use('/', router_1.appRouter);
app.use('/', router_2.default);
app.use('/', router_5.planningRouter);
app.use('/', router_3.inventoryRouter);
app.use('/', router_4.requestRouter);
app.use('/', router_6.billingRouter);
app.use('/api/v1', router_1.jwtRouter);
/* queues */
exports.queue = kue.createQueue({
    redis: {
        createClientFactory: function () {
            return redis_service_1.createRedisClient();
        }
    }
});
const billingQueue = new Bull('billing', {
    createClient: function () {
        return redis_service_1.createRedisClient();
    },
    prefix: '{andes}'
});
billingQueue.process(async () => {
    await new billing_task_1.default().processBilling();
});
const addCronTask = async () => {
    try {
        // let job = await billingQueue.removeRepeatable('task', {cron: '0 47 6 * * 4'});
        let jobs = await billingQueue.getRepeatableJobs();
        if (jobs && jobs.length) {
            for (const job of jobs) {
                await billingQueue.removeRepeatableByKey(job.key);
                console.log(`${jobs[0].key} Removida`);
            }
        }
    }
    catch (error) {
        console.log(error);
        console.log("NO existen tareas");
    }
    if (process.env.ENV === 'development') {
        // billingQueue.add({}, {repeat: {cron: '0 */1 * * *'}, jobId: 'billing'});
        // billingQueue.add({}, {repeat: {cron: '*/10 * * * *'}, jobId: 'billing'});
    }
    else if (process.env.ENV === 'production') {
        billingQueue.add({}, { repeat: { cron: '0 1 1 * *' }, jobId: 'billing' });
    }
};
addCronTask();
//
/*
export const queueScheduler = kueScheduler.createQueue({
  redis: {
    createClientFactory: function () {
      return createRedisClient();
    }
  }
});

const job = queueScheduler
  .createJob('billing', {})
  .attempts(3)
  .priority('normal')
  .unique('billing');

//schedule it to run every 2 seconds
queueScheduler.every('30 seconds', job);
// queueScheduler.every('30 minutes', job);

//somewhere process your scheduled jobs
queueScheduler.process('billing', new BillingQueue().processBilling);

*/
new email_task_1.default(exports.queue).run();
new inventory_task_1.default(exports.queue).run();
kue.app.listen((parseInt(process.env.PORT, 10) || 3000) + 40);
// The error handler must be before any other error middleware
app.use(Raven.errorHandler());
app.use((req, res, next) => {
    const err = {
        message: 'Not Found',
        status: 404
    };
    /* istanbul ignore next */
    next(err);
});
/* istanbul ignore next */
app.use((err, req, res, next) => {
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
exports.default = app;
//# sourceMappingURL=app.js.map