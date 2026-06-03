import * as moment from 'moment';
import * as Sentry from '@sentry/node';
// import * as Raven from 'raven';
import GeneralUtils from '../utils/general.utils';
import type {
  CaptureContext,
} from '@sentry/types';
// import * as path from 'path';

export interface Icolors {
  [key: string]: any;
}

// Logger app
// export const logDirectory = path.join(__dirname, '../logs');

// export const accessLogStream = fileStreamRotator.getStream({
//   date_format: 'YYYYMMDD',
//   // date_format: 'YYYY/MM/DD',
//   filename: logDirectory + '/access-%DATE%.log',
//   frequency: 'daily',
//   verbose: falseF
// });

class LoggerService {
  public colors: Icolors;
  protected message: string;
  protected env: string;
  protected useColors: boolean;

  constructor() {
    this.message = '';
    this.env = GeneralUtils.getFromEnviroment('ENV', 'development');
    // Disable ANSI colors in production: CloudWatch does not render escape
    // codes and they make the logs unreadable.
    this.useColors = this.env !== 'production';
    // https://github.com/shiena/ansicolor/blob/master/README.md
    this.colors = {
      black: this.useColors ? '\x1b[30m' : '',
      brightBlack: this.useColors ? '\x1b[90m' : '',
      reset: this.useColors ? '\x1b[0m' : '',
      magenta: this.useColors ? '\x1b[35m' : '',
      green: this.useColors ? '\x1b[32m' : '',
      brighGreen: this.useColors ? '\x1b[92m' : '',
      yellow: this.useColors ? '\x1b[33m' : '',
      brighYellow: this.useColors ? '\x1b[93m' : '',
      blue: this.useColors ? '\x1b[34m' : '',
      brighBlue: this.useColors ? '\x1b[94m' : '',
      cyan: this.useColors ? '\x1b[36m' : '',
      brighCyan: this.useColors ? '\x1b[96m' : '',
      red: this.useColors ? '\x1b[31m' : '',
      brighRed: this.useColors ? '\x1b[91m' : '',
      white: this.useColors ? '\x1b[37m' : '',
      brighwhite: this.useColors ? '\x1b[97m' : ''
    };
  }

  public info(message: string): void {
    this.logger('INFO', 'production', message, this.colors.reset);
    this.logger('INFO', 'development', message, this.colors.reset);
  }

  /* istanbul ignore next */
  public debug(message: string): void {
    this.logger(
      'DEBUG',
      'production',
      message,
      this.colors.brightBlack,
      this.colors.brightBlack
    );
    this.logger(
      'DEBUG',
      'development',
      message,
      this.colors.brightBlack,
      this.colors.brightBlack
    );
  }

  /* istanbul ignore next */
  public error(
    message: string,
    propagate?: boolean,
    context?: CaptureContext
  ): void {
    this.logger('ERROR', 'production', message, this.colors.brighRed);
    this.logger('ERROR', 'development', message, this.colors.brighRed);
    if (propagate) {
      Sentry.captureException(message, context);
    }
  }

  /* istanbul ignore next */
  private now(): string {
    if (process.env.ENV === 'production') {
      // Human readable timestamp for CloudWatch
      return moment().utc().format('YYYY-MM-DD HH:mm:ss.SSS [UTC]');
    } else {
      return moment().format('x');
    }
  }

  /* istanbul ignore next */
  private logger(
    type: string,
    env: string,
    message: string,
    color: string,
    textColor?: string
  ) {
    if (this.env === env) {
      // Strip any ANSI escape codes embedded in the message itself when
      // colors are disabled (e.g. callers passing '\x1b[90m' inline).
      this.message = this.useColors
        ? message
        : // eslint-disable-next-line no-control-regex
          message.replace(/\x1b\[\d+m/g, '');
      if (!textColor) {
        textColor = this.colors.reset;
      }
      console.log(
        `${color}[${type}] ${textColor}${this.message} ${
          this.colors.brightBlack
        }${this.now()}${this.colors.reset}`
      );
      // this.writeLog(type);
    }
  }

  /* istanbul ignore next */
  // private writeLog(type: string) {
  // accessLogStream.write(`[${this.now()}] [${type}]: ${this.message} \n`);
  // }
}

export default new LoggerService();
