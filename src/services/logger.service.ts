import * as moment from 'moment';
import * as Raven from 'raven';
import GeneralUtils from '../utils/general.utils';
// import * as fileStreamRotator from 'file-stream-rotator';
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
//   verbose: false
// });

class LoggerService {

  public colors: Icolors;
  protected message: string;
  protected env: string;

  constructor() {
    this.message = '';
    this.env = GeneralUtils.getFromEnviroment('ENV', 'development');
    // https://github.com/shiena/ansicolor/blob/master/README.md
    this.colors = {
      black: '\x1b[30m',
      brightBlack: '\x1b[90m',
      reset: '\x1b[0m',
      magenta: '\x1b[35m',
      green: '\x1b[32m',
      brighGreen: '\x1b[92m',
      yellow: '\x1b[33m',
      brighYellow: '\x1b[93m',
      blue: '\x1b[34m',
      brighBlue: '\x1b[94m',
      cyan: '\x1b[36m',
      brighCyan: '\x1b[96m',
      red: '\x1b[31m',
      brighRed: '\x1b[91m',
      white: '\x1b[37m',
      brighwhite: '\x1b[97m'
    };
  }

  public info(message: string): void {
    this.logger('INFO', 'production', message, this.colors.reset);
    this.logger('INFO', 'development', message, this.colors.reset);
  }

  /* istanbul ignore next */
  public debug(message: string): void {
    this.logger('DEBUG', 'production', message, this.colors.brightBlack, this.colors.brightBlack);
    this.logger('DEBUG', 'development', message, this.colors.brightBlack, this.colors.brightBlack);
  }

  /* istanbul ignore next */
  public error(message: string, propagate?: boolean): void {
    this.logger('ERROR', 'production', message, this.colors.brighRed);
    this.logger('ERROR', 'development', message, this.colors.brighRed);
    if (propagate) {
      Raven.captureException(new Error(message));
    }
  }

  /* istanbul ignore next */
  private now(): string {
    // return moment();
    // return moment().utc().format('DD/MMM/YYYY:HH:mm:ss ZZ').replace('.', "");
    if (process.env.ENV === 'production') {
      // return moment().utc().format('DD/MMM/YYYY:HH:mm:ss ZZ').replace('.', "");
      return moment().format('x')
    } else {
       return moment().format('x')
    }
  }

  /* istanbul ignore next */
  private logger(type: string, env: string, message: string, color: string, textColor?: string) {
    if (this.env === env) {
      this.message = message;
      if (!textColor) {
        textColor = this.colors.reset;
      }
      if (process.env.ENV === 'production') {
        // console.log(`${color}[${this.now()}] [${type}]:${textColor} ${this.message}${this.colors.reset}`);
        console.log(`${color}[${type}] ${textColor}${this.message} \x1b[90m${this.now()}${this.colors.reset}`);
      } else {
        console.log(`${color}[${type}] ${textColor}${this.message} \x1b[90m${this.now()}${this.colors.reset}`);
      }
      // this.writeLog(type);
    }
  }

  /* istanbul ignore next */
  // private writeLog(type: string) {
    // accessLogStream.write(`[${this.now()}] [${type}]: ${this.message} \n`);
  // }
}

export default new LoggerService();
