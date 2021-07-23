const mongoose = require('mongoose');
const dotenv = require('dotenv');

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
app.listen(port, () => {
  // console.log(`APP RUNNING ON PORT ${port}...`);
});
