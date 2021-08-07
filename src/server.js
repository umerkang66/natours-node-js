const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
  console.log('UNHANDLED EXCEPTION! Shutting down...');
  console.log(`${err.name}, ${err.message}`);

  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

// GETTING THE DATA ABOUT MONGO-DB FROM
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection succesfull'));

// START THE SERVER
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`APP RUNNING ON PORT ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(`${err.name}, ${err.message}`);

  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('👋 Sigterm recieved. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated');
  });
});
