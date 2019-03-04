import * as moment from 'moment';
import * as Raven from 'raven';
import {accessLogStream} from '../app';
import GeneralUtils from '../utils/general.utils';

export interface Icolors {
  [key: string]: any;
}

class LoggerService {

  public colors: Icolors;
  protected message: string;
  protected env: string;

  constructor() {
    this.message = '';
    this.env = GeneralUtils.getFromEnviroment('ENV', 'development');
    // https://github.com/shiena/ansicolor/blob/master/README.md
    this.colors = {
      brightBlack: '\x1b[90m',
      reset: '\x1b[0m',
      magenta: '\x1b[35m',
      green: '\x1b[32m',
      brighGreen: '\x1b[92m',
      yellow: '\x1b[33m',
      brighYellow: '\x1b[93m',
      blue: '\x1b[34m',
      cyan: '\x1b[36m',
      brighCyan: '\x1b[96m',
      red: '\x1b[31m',
      brighRed: '\x1b[91m',
      white: '\x1b[37m'
    };
  }

  public info(message: string): void {
    this.logger('INFO', 'production', message);
    this.logger('INFO', 'development', message);
  }

  /* istanbul ignore next */
  public debbug(message: string): void {
    this.logger('DEBUG', 'development', message);
  }

  /* istanbul ignore next */
  public error(message: string): void {
    this.message = message;
    Raven.captureException(new Error(this.message));
    console.log(`${this.colors.red}ERROR $\{this.colors.brightBlack}${this.now()}: ${this.colors.reset} ${message}${this.colors.reset}`);
    this.writeLog('ERROR');
  }

  /* istanbul ignore next */
  private now(): string {
    // return moment();
    return moment().utc().format('DD/MMM/YYYY:HH:mm:ss ZZ');
  }

  /* istanbul ignore next */
  private logger(type: string, env: string, message: string) {
    if (this.env === env) {
      this.message = message;
      console.log(`${this.colors.brightBlack}[${this.now()}] [${type}] :${this.colors.reset} ${this.message}`);
      this.writeLog(type);
    }
  }

  /* istanbul ignore next */
  private writeLog(type: string) {
    accessLogStream.write(`[${this.now()}] [${type}]: ${this.message} \n`);
  }
}

export default new LoggerService();
