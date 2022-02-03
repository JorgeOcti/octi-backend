"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.queue = exports.accessLogStream = void 0;
var bodyParser = require("body-parser");
var Bull = require("bull");
var compression = require("compression");
var connectRedis = require("connect-redis");
var cookieParser = require("cookie-parser");
var dotenv = require("dotenv");
var express = require("express");
var session = require("express-session");
var fileStreamRotator = require("file-stream-rotator");
var kue = require("kue");
var morgan = require("morgan");
var multer = require("multer");
var moment = require("moment-timezone");
var passport = require("passport");
var passportLocal = require("passport-local");
var path = require("path");
var Raven = require("raven");
var responseTime = require("response-time");
var Staticify = require("staticify");
var app_controller_1 = require("./app/controllers/app.controller");
var user_model_1 = require("./app/models/user.model");
var router_1 = require("./app/router");
var email_task_1 = require("./app/tasks/email.task");
var router_2 = require("./billing/router");
var billing_task_1 = require("./billing/tasks/billing.task");
var router_3 = require("./form/router");
var router_4 = require("./inventory/router");
var inventory_task_1 = require("./inventory/taks/inventory.task");
var middlewares_1 = require("./middlewares/middlewares");
var router_5 = require("./planning/router");
var router_6 = require("./request/router");
var redis_service_1 = require("./services/redis.service");
var router_7 = require("./distribution/router");
// Create Express server
var app = express();
// Configure sentry
// Load environment variables from .env file, where API keys and passwords are configured
global.__rootdir__ = __dirname || process.cwd();
var root = global.__rootdir__;
var LocalStrategy = passportLocal.Strategy;
// const gitCommit = git.long();
var redisStore = connectRedis(session);
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
    parseUser: function (req) {
        // custom user parsing logic
        var username = req.user ? req.user : {
            id: 0,
            email: 'anonymous'
        };
        return {
            email: username.email,
            name: "".concat(username.firstName, " ").concat(username.lastName),
            id: username._id
        };
    },
    dataCallback: function (data) {
        var stacktrace = data.exception && data.exception[0].stacktrace;
        if (stacktrace) {
            if (stacktrace.frames) {
                stacktrace.frames.forEach(function (frame) {
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
var viewDirectory = path.join(__dirname, '../views');
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
var upload = multer({
    limits: { fieldSize: 32 * 1024 * 1024 },
    storage: multer.diskStorage({
        destination: '/tmp/',
        filename: function (req, file, callback) {
            callback(null, file.originalname);
        }
    })
});
app.use(upload.any());
// static files
var staticDirectory = path.join(__dirname, '../public');
app.use(middlewares_1["default"].cleanStaticFiles);
app.use('/static', express.static(staticDirectory, { maxAge: '30 days' }));
var staticify = Staticify(staticDirectory);
app.use(staticify.middleware);
//
app.locals.getVersionedPath = staticify.getVersionedPath;
app.locals.moment = moment;
// app.helpers({getVersionedPath: staticify.getVersionedPath})
// if (process.env.NODE_ENV === 'production') {
//
// }
app.set('trust proxy', 1); // trust first proxy
app.use(cookieParser());
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SECRET_KEY,
    cookie: {
        secure: process.env.ENV === 'production',
        // sameSite: process.env.ENV === 'production' ? 'none' : 'strict',
        // secure: true,
        sameSite: 'none',
        maxAge: 2592000000 // 30 * 24 * 60 * 60 * 1000 Rememeber 'me' for 30 days
    },
    store: new redisStore({ client: redis_service_1["default"] })
}));
// passport
app.use(passport.initialize());
app.use(passport.session());
// passport.use(new LocalStrategy((User as any).authenticate()));
/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({ usernameField: 'username' }, function (username, password, done) {
    user_model_1["default"].findOne({
        username: username.toLowerCase(),
        active: true
    }, function (err, user) {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(undefined, false, { message: "username ".concat(username, " not found.") });
        }
        user.comparePassword(password, function (err, isMatch) {
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
passport.serializeUser(user_model_1["default"].serializeUser());
// passport.deserializeUser((User as any).deserializeUser());
passport.deserializeUser(function (email, done) { return __awaiter(void 0, void 0, void 0, function () {
    var user, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, user_model_1["default"].findOne({ email: email }, {
                        _id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        preferred: true,
                        isAdmin: true,
                        venuesAccess: true
                    }).populate([{
                            path: 'userPermissions',
                            select: ['codeName']
                        }, {
                            path: 'userForms',
                            select: ['name']
                        }, {
                            path: 'venue',
                            select: ['name']
                        }, {
                            path: 'company',
                            select: ['name', "iFrameURL", "iFrameURLInventory"]
                        }, {
                            path: 'team',
                            select: ['name']
                        }])];
            case 1:
                user = _a.sent();
                if (user) {
                    done(null, user);
                }
                else {
                    done(new Error('User not found'));
                }
                return [3 /*break*/, 3];
            case 2:
                e_1 = _a.sent();
                /* istanbul ignore next */
                done(e_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
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
var logDirectory = path.join(__dirname, '../logs');
exports.accessLogStream = fileStreamRotator.getStream({
    date_format: 'YYYYMMDD',
    // date_format: 'YYYY/MM/DD',
    filename: logDirectory + '/access-%DATE%.log',
    frequency: 'daily',
    verbose: false
});
app.use('/robots.txt', app_controller_1["default"].robots);
app.use('/health-check/', app_controller_1["default"].healthCheck);
/* istanbul ignore if */
if (app.get('env') !== 'testing') {
    morgan.token('remote-addr', function (req) {
        return req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
    });
    app.use(morgan('[:date[clf]] [INFO]: :remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time', {
        stream: exports.accessLogStream
    }));
    app.use(morgan('\x1b[90m[:date[clf]] [INFO]:\x1b[0m :remote-addr :method :url :status :response-time ms - :res[content-length]'));
}
// The request handler must be the first middleware on the app
app.use(Raven.requestHandler());
app.use(middlewares_1["default"].context);
// Routes
app.use('/', router_1.appRouter);
app.use('/', router_3["default"]);
app.use('/', router_5.planningRouter);
app.use('/', router_4.inventoryRouter);
app.use('/', router_6.requestRouter);
app.use('/', router_7.distributionRouter);
app.use('/', router_2.billingRouter);
app.use('/api/v1', router_1.jwtRouter);
/* queues */
exports.queue = kue.createQueue({
    redis: {
        createClientFactory: function () {
            return (0, redis_service_1.createRedisClient)();
        }
    }
});
var billingQueue = new Bull('billing', {
    createClient: function () {
        return (0, redis_service_1.createRedisClient)();
    },
    prefix: '{andes}'
});
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var jobs, _i, jobs_1, job, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 7, , 8]);
                return [4 /*yield*/, billingQueue.getRepeatableJobs()];
            case 1:
                jobs = _a.sent();
                if (!(jobs && jobs.length)) return [3 /*break*/, 5];
                _i = 0, jobs_1 = jobs;
                _a.label = 2;
            case 2:
                if (!(_i < jobs_1.length)) return [3 /*break*/, 5];
                job = jobs_1[_i];
                return [4 /*yield*/, billingQueue.removeRepeatableByKey(job.key)];
            case 3:
                _a.sent();
                console.log("".concat(jobs[0].key, " Removida"));
                _a.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5: return [4 /*yield*/, billingQueue.clean(0, 'delayed')];
            case 6:
                _a.sent();
                console.log('Se ejecuto la limpieza de tareas');
                return [3 /*break*/, 8];
            case 7:
                error_1 = _a.sent();
                console.log(error_1);
                console.log('NO existen tareas');
                return [3 /*break*/, 8];
            case 8:
                if (!(process.env.ENV === 'development')) return [3 /*break*/, 9];
                return [3 /*break*/, 11];
            case 9:
                if (!(process.env.ENV === 'production')) return [3 /*break*/, 11];
                billingQueue.process(function (job, done) { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, new billing_task_1["default"]().processBilling()];
                            case 1:
                                _a.sent();
                                done();
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [4 /*yield*/, billingQueue.add({}, { repeat: { cron: '0 1 1 * *' }, jobId: 'billing' })];
            case 10:
                _a.sent();
                _a.label = 11;
            case 11: return [2 /*return*/];
        }
    });
}); })();
new email_task_1["default"](exports.queue).run();
new inventory_task_1["default"](exports.queue).run();
kue.app.listen((parseInt(process.env.PORT, 10) || 3000) + 40);
// The error handler must be before any other error middleware
app.use(Raven.errorHandler());
app.use(function (req, res, next) {
    var err = {
        message: 'Not Found',
        status: 404
    };
    /* istanbul ignore next */
    next(err);
});
/* istanbul ignore next */
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render the error page
    var statusCode = [403, 404, 500].includes(err.status) ? err.status : 500;
    console.log('err', err);
    res.status(statusCode).render(statusCode.toString());
    // res.json({
    //   status: err.status,
    //   error: err.message ? err.message : err.error
    // });
    next();
});
exports["default"] = app;
//# sourceMappingURL=app.js.map