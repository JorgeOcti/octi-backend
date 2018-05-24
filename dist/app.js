"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bodyParser = require("body-parser");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const express = require("express");
const session = require("express-session");
const fileStreamRotator = require("file-stream-rotator");
const git = require("git-rev-sync");
const lusca = require("lusca");
const morgan = require("morgan");
const multer = require("multer");
const passport = require("passport");
const passportLocal = require("passport-local");
const path = require("path");
const Raven = require("raven");
const responseTime = require("response-time");
const user_model_1 = require("./app/models/user.model");
// Import routes
const router_1 = require("./app/router");
const router_2 = require("./form/router");
// Configure sentry
global.__rootdir__ = __dirname || process.cwd();
const root = global.__rootdir__;
const LocalStrategy = passportLocal.Strategy;
const gitCommit = git.long();
/* istanbul ignore next */
Raven.config(process.env.SENTRY_DNS, {
    release: gitCommit,
    tags: {
        git_commit: gitCommit,
        environment: process.env.ENV || 'development'
    },
    environment: process.env.ENV,
    parseUser: (req) => {
        // custom user parsing logic
        const username = req.user ? req.user : { username: 'anonymous', id: 0 };
        return {
            username: username.username,
            id: username.id
        };
    },
    dataCallback: (data) => {
        const stacktrace = data.exception && data.exception[0].stacktrace;
        if (stacktrace && stacktrace.frames) {
            stacktrace.frames.forEach((frame) => {
                if (frame.filename.startsWith('/')) {
                    frame.filename = 'app:///' + path.relative(root, frame.filename);
                }
            });
        }
        return data;
    }
}).install();
// Load environment variables from .env file, where API keys and passwords are configured
dotenv.config({
    path: path.join(__dirname, '../.env')
});
// Create Express server
const app = express();
// Middlewares
app.use(compression());
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.use(responseTime());
// template engine
const viewDirectory = path.join(__dirname, '../views');
app.set('view engine', 'pug');
app.set('views', viewDirectory);
// Set environment variables
app.set('env', process.env.ENV || 'development');
app.set('port', process.env.PORT || 3000);
app.locals.secretKey = process.env.SECRET_KEY;
// Remove x-powered-by
app.disable('x-powered-by');
// strict routing
app.set('strict routing', true);
// For parsing application/json
app.use(bodyParser.json());
// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true }));
// For parsing multipart/form-data
const upload = multer();
app.use(upload.single());
app.use(cookieParser());
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.SECRET_KEY
    // store: new redisStore({
    //   host: 'localhost',
    //   port: 6379,
    //   client: redisClient,
    //   ttl: 260
    // })
}));
// passport
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user, done) => {
    done(undefined, user.id);
});
passport.deserializeUser((id, done) => {
    user_model_1.default.findById(id, (err, user) => {
        if (user) {
            done(err, user);
        }
    });
});
/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
    user_model_1.default.findOne({ email: email.toLowerCase() }, (err, user) => {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(undefined, false, { message: `Email ${email} not found.` });
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
// Logger app
const logDirectory = path.join(__dirname, '../logs');
exports.accessLogStream = fileStreamRotator.getStream({
    date_format: 'YYYYMMDD',
    filename: logDirectory + '/access-%DATE%.log',
    frequency: 'daily',
    verbose: false
});
/* istanbul ignore if */
if (app.get('env') !== 'testing') {
    morgan.token('remote-addr', (req) => {
        return req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
    });
    app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time', { stream: exports.accessLogStream }));
    app.use(morgan('[:date[clf]] :remote-addr :method :url :status :response-time ms - :res[content-length]'));
}
// The request handler must be the first middleware on the app
app.use(Raven.requestHandler());
// Routes
const staticDirectory = path.join(__dirname, '../public');
app.use('/static', express.static(staticDirectory));
app.use('/', router_1.appRouter);
app.use('/api/v1', router_1.jwtRouter);
app.use('/api/v1/forms', router_2.default);
// The error handler must be before any other error middleware
app.use(Raven.errorHandler());
app.use((req, res, next) => {
    const err = {
        message: 'Not Found',
        status: 404
    };
    next(err);
});
app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.json({
        status: err.status,
        error: err.message ? err.message : err.error
    });
    next();
});
exports.default = app;
//# sourceMappingURL=app.js.map