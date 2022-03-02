const express = require('express');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
// http parameter pollution
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');

// Importing the utils
const AppError = require('./utils/appError');
const rootDir = require('./utils/path');

// Importing the routes
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

// Importing the Controllers
const globalErrorHandler = require('./controllers/errorController');

// Creating the application
const app = express();

// Trust proxies Heroku configuration
app.enable('trust proxy');

// ADDING CORS
// Request from different domain, different subdomain, different protocol, or even a different port is considered "cross origin request"
// "cors" stands for "cross origin resource sharing"

// If we only want to allow some specific websites
// app.use(cors({ origin: 'https://www.natours.com' }));
// "header" Access-Control-Allow-Origin ==> *

// Right now this will only work for simple request (get and post)
app.use(cors());

// For the non-simple request (put, patch, delete, and the requests that send cookies, or use nonstandard headers), before the actual request comes in the browser will send a "options" request (in order to figure out if the actual request is safe to send), and we need to respond to that options request
app.options('*', cors());
// app.options('/api/v1/tours/:id', cors());

// WIRING UP THE TEMPLATE ENGINE
// Which template engine to use. express supports the "pug" out of the box, we just have tell the express, and not need to install the pug package
app.set('view engine', 'pug');
// Tell where will be the reviews will be stored in the project
const viewsPath = path.join(rootDir, 'src', 'views');
app.set('views', viewsPath);

// MIDDLEWARES: These are the functions that can modify the request objects. Middlewares that exists firsts in the code, will be executed first

// Serving static files
const staticFilesPath = path.join(rootDir, 'public');
// Fi express doesn't find any route, it will try to get that file from "public folder" because that is what we have specify in the express static middleware
app.use(express.static(staticFilesPath));

// By using the express.json() data from the request body (that comes in streams) collected and stored the req.body object
// We can limit the data coming into the req object
app.use(express.json({ limit: '10kb' }));
// Parse req.body from url encoding (that is sent by automatic forms post request)
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Parse cookies from browser request
app.use(cookieParser());

// After reading the data from express.json() then sanitize it
// Data sanitization against NoSQL query injection
// This will filter out all of the $ signs and dots ".", because that's how mongodb operators are written
app.use(mongoSanitize());

// Data sanitization against XSS attacks
// This will clean any malicious input from html code, mongoose validation also protects us (because it also doesn't allow any other data into our DB excepts that is specify in the schema)
app.use(xss());

// If the user send two same parameter fields, then express will convert it to the array, but our application cannot is prepare for fields array (it is prepare for field string), so this package will remove it
app.use(
  hpp({
    // Allow some of the fields to be existed twice
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// It will compresses all the responses (only text, and json)
app.use(compression());

if (process.env.NODE_ENV === 'development') {
  // Only use morgan if we are in development mode
  // Morgan is a logging middleware (that logs about requests)
  app.use(morgan('dev'));
}

// Limit the request that this server will receive from a certain ip address
const limiter = rateLimit({
  // This will allow 100 request from same ip in 1 hour (1 hour is specified below as windowMx)
  max: 100,
  // 1 Hour in milliseconds
  windowMx: 60 * 60 * 1000,
  message: 'Too many requests from this ip, please try again in an hour',
});

// Apply this limiter on to /api
app.use('/api', limiter);

// In "use" methods we can specify any middlewares that calls next unless we send the response to client (ending the request-response cycle)
app.use((req, res, next) => {
  // Because we didn't specify an routes, this middleware will run for every request
  req.requestTime = new Date().toISOString();
  next();
});

// PLUGGING THE ROUTES IN EXPRESS
// We can also specify the routes in the use function, then callback functions will be applied to specifically to that request url
// Views Routes
app.use('/', viewRouter);

// Api Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
// We can use reviewRouter directly from here, but it can also be accessed from the tourRouter
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// ERROR HANDLING
// Unhandled Routes
// If router reach this part of the app.js file, it means neither of the above router have catch it, so this route doesn't exist
// "*" stands for everything
app.all('*', (req, res, next) => {
  // Create an error, then call next, that will be automatically be caught by Error Handling Middleware
  const errMessage = `Can't find ${req.originalUrl} on this server!`;
  const err = new AppError(errMessage, 404);

  // If "next" function will anything, express will assume that it is an error, then it will skip the other middlewares, and send it directly to the global error handling middleware
  next(err);
});

// Global Error Handling Middleware, also error of rendered pages also handled here
app.use(globalErrorHandler);

module.exports = app;
