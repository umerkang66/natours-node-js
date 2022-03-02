const mongoose = require('mongoose');
const dotenv = require('dotenv');

// IMPORTANT! This should be before anything runs, in our server as well as in our application, because this is handling synchronous code (there is no need to put the error handler of asynchronous code at the top)
// Handling synchronous code out of express application (they are also called bugs, and they are no handled anywhere)
process.on('uncaughtException', error => {
  console.log('UNHANDLED EXCEPTION 💥💥💥 Shutting down...');
  console.log(`Error Name: ${error.name}\nError Message: ${error.message}`);

  // We don't need to close the server, and shutdown the application, simply just exit the process (because if there is a programming error in our code, we should immediately exit)
  process.exit(1);
});

// Tell where the config file is located, and get the config file before requiring the app.js file
dotenv.config({ path: './config.env' });
const app = require('./src/app');

/* This env variable is set by express
console.log(app.get('env'));

// but node js also set some environment variables, these are the following
console.log(process.env.NODE_ENV); */

// CONNECTING TO THE DB

// Creating the db (mongodb-atlas) connection string
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// const DB_LOCAL = process.env.DATABASE_LOCAL;

mongoose.connect(DB).then(() => console.log('Db connection successful'));

// START THE SERVER
const port = process.env.PORT || 3000;
// server is saved to be used in closing the server gracefully
const server = app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});

// HANDLING ERRORS (THAT ARE NOT PART OF EXPRESS)
// Globally Handling Unhandled Promise rejections (asynchronous code out of express) (like DB not connected)
// We can handle it by listening on event caused by node process
process.on('unhandledRejection', reason => {
  // "reason" can also be called "err"
  console.log('UNHANDLED PROMISE REJECTION 💥💥💥 Shutting down...');
  console.log(`Error Name: ${reason.name} \n Error Message: ${reason.message}`);

  // Exit the program
  // process.exit(1);
  // process.exit() will immediately exit, and all the running request will be stopped (that is not ideal)

  // But shutdown the program gracefully meaning first close the server then shutdown the application
  // We give the time to the current request that are coming to be handled
  server.close(() => {
    // Pass the code in .exit(), 0 stands for success, and 1 stands for uncaught exception
    process.exit(1);

    // After crashing in production, there should be a some tool in place to restart the application
  });
});

// Heroku send SIGTERM in every 24 hours, to keep our application in healthy state
process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED 💥💥💥. Shutting down gracefully');

  // Explanation in unhandled rejection
  server.close(() => {
    console.log('💥 Process terminated');
    // We will not use "process.exit()" because "sigterm" will automatically terminate the application
  });
});
