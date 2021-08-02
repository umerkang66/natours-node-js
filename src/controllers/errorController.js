const AppError = require('../utils/AppError');

// HANDLING ERRORS IN DEVELOPMENT ENVIRONMENT
const sendErrorDev = (err, res) => {
  // Send as much detail as possible in dev environment
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// HANDLING ERRORS IN PRODUCTION ENVIRONMENT
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const { name } = err.keyValue;
  const message = `Duplicate field value: "${name}", please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token! Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Token is expired! Please log in again.', 401);

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to the client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // Programming, unknown error: don't leak the error
  } else {
    // Log the error
    console.error('ERROR 💥💥💥', err);

    // Send the generic message to the client
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    });
  }
};

// HANDLING BOTH PROD AND DEV ERRORS AND SEND THESE ERRORS TO THE EXPRESS ROUTE WHERE ALL THE ERRORS WILL BE HANDLED
const globalErrorController = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') sendErrorDev(err, res);
  else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };

    // Dont use the error, use err because i think the name property is in the prototype of err object so that is doesn't showed in err.name
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    // We dont need a function argument for this simple error
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

module.exports = globalErrorController;
