const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/AppError');
const globalErrorController = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();
app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Serving static html files
app.use(express.static(path.join(__dirname, '../public')));

// GLOBAL MIDDLEWARES
// Adding cors so that other people can also access our api
app.use(cors());
// if we only allow one single url
// app.use(
//   cors({
//     origin: 'https://www.natours.com',
//   })
// );

// For the all the other resources like put, patch and delete
app.options('*', cors());

// Set security http headers
app.use(helmet());

// Log all the requests in console in dev environment
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Limit requests from same api
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP. Please try again in one hour!',
});
app.use('/api', limiter);

// Body parser, reading the data from the body in req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against noSQL query injection
app.use(mongoSanitize());
// Data saniitzation against XSS attacks
app.use(xss());

// Prevent duplicate query string, it will use the last one
// prettier-ignore
const whiteListArr = ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price'];
app.use(hpp({ whitelist: whiteListArr }));

// Compressing the request using gzip
app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// ROUTES
// Website Routes
app.use('/', viewRouter);

// Api Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// Handling err for the global routes if the request does hit the upove routes
app.all('*', (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server`, 404);
  next(err);
});

// GLOBAL ERROR HANDLING MIDDLEWARES FOR EVERYTHING
app.use(globalErrorController);

module.exports = app;
