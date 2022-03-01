class AppError extends Error {
  constructor(message, statusCode) {
    // Pass the message in super() to become the message of the Error Object i.e. err.message property
    // new Error(message)
    super(message);
    this.statusCode = statusCode;
    // If the statusCode starts with 4, it is "fail", if it starts with 5, it is "error"
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // Errors that are inevitable (like no internet, no db connection, wrong url, wrong req) are operational (!programming error)
    this.isOperational = true;

    // Conserve the Stack Trace
    // By doing this, this constructor function call will not shows itself in the stackTrace, thus not polluting the stackTrace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
