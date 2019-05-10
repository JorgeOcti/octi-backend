// import * as Raven from 'raven';
/**
 * @extends Error
 */
abstract class ExtendableError extends Error {

  public message: string;
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    this.status = status;
    Error.captureStackTrace(this);
  }
}

/**
 * Class representing an API error.
 * @extends ExtendableError
 */
export class APIError extends ExtendableError {
  /**
   * Creates an API error.
   * @param {string} message - Error message.
   * @param {number} status - HTTP status code of error.
   */
  constructor(message: string, status: number = 500) {
    super(message, status);
    this.name = this.constructor.name;
  }
}

/**
 * Class representing an Web error.
 * @extends ExtendableError
 */
export class WebError extends ExtendableError {
  /**
   * Creates an API error.
   * @param {string} message - Error message.
   * @param {number} status - HTTP status code of error.
   */
  constructor(message: string, status: number = 500) {
    super(message, status);
    this.name = this.constructor.name;
  }
}
