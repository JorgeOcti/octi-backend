import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import * as express from 'express';
import * as session from 'express-session';
import * as fileStreamRotator from 'file-stream-rotator';
import * as git from 'git-rev-sync';
import * as lusca from 'lusca';
import * as morgan from 'morgan';
import * as multer from 'multer';
import * as passport from 'passport';
import * as passportLocal from 'passport-local';
import * as path from 'path';
import * as Raven from 'raven';
import * as responseTime from 'response-time';
import User from './app/models/user.model';

// Import routes
import {appRouter, jwtRouter} from './app/router';
import formRouter from './form/router';

// Configure sentry
(global as any).__rootdir__ = __dirname || process.cwd();
const root = (global as any).__rootdir__;
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
    const username = req.user ? req.user : {username: 'anonymous', id: 0};
    return {
      username: username.username,
      id: username.id
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
  secret: (process.env.SECRET_KEY as string)
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

/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
  User.findOne({ email: email.toLowerCase() }, (err, user: any) => {
    if (err) { return done(err); }
    if (!user) {
      return done(undefined, false, { message: `Email ${email} not found.` });
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

// Logger app
const logDirectory = path.join(__dirname, '../logs');
export const accessLogStream = fileStreamRotator.getStream({
  date_format: 'YYYYMMDD',
  filename: logDirectory + '/access-%DATE%.log',
  frequency: 'daily',
  verbose: false
});

/* istanbul ignore if */
if (app.get('env') !== 'testing') {
  morgan.token('remote-addr', (req: express.Request): string => {
    return (req.headers['x-real-ip'] as string) || (req.headers['x-forwarded-for'] as string) || req.connection.remoteAddress || '';
  });

  app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time', {stream: accessLogStream}));
  app.use(morgan('[:date[clf]] :remote-addr :method :url :status :response-time ms - :res[content-length]'));
}

// The request handler must be the first middleware on the app
app.use(Raven.requestHandler());

// Routes
const staticDirectory = path.join(__dirname, '../public');
app.use('/static', express.static(staticDirectory));

app.use('/', appRouter);
app.use('/api/v1', jwtRouter);
app.use('/api/v1/forms', formRouter);

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
  next(err);
});

app.use((err: IResponseError, req: express.Request, res: express.Response, next: express.NextFunction) => {
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

export default app;
