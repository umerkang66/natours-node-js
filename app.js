const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/AppError');
const globalErrorController = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// MIDDLEWARES
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
app.use(express.json());

// Serving static html files
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// Handling err for the global routes if the request does hit the upove routes
app.all('*', (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server`, 404);
  next(err);
});

// GLOBAL ERROR HANDLING MIDDLEWARES FOR EVERYTHING
app.use(globalErrorController);

module.exports = app;
