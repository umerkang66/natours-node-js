const dotenv = require('dotenv');
const fs = require('fs');
const mongoose = require('mongoose');

// Importing the Models
const Tour = require('../../src/models/tourModel');
const User = require('../../src/models/userModel');
const Review = require('../../src/models/reviewModel');

// Tell where the config file is located, and get the config file before requiring the app.js file
dotenv.config({ path: `${__dirname}/../../config.env` });

// CONNECTING TO THE DB
// Creating the db connection string
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// const DB_LOCAL = process.env.DATABASE_LOCAL;

mongoose.connect(DB).then(() => console.log('Db connection successful'));

// Read Json file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

// Import Data into DB
const importData = async () => {
  try {
    // Tour.create can also accept the array of objects
    await Tour.create(tours);
    console.log('Tours successfully loaded!');
    await User.create(users, { validateBeforeSave: false });
    console.log('Users successfully loaded!');
    await Review.create(reviews);
    console.log('Reviews successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  // process.exit is aggressive way of stopping node process, which is no problem because this is just basic script
  process.exit();
};

// Delete all Data from collection
const deleteData = async () => {
  try {
    // This is going to delete the all the documents in the db.tours
    await Tour.deleteMany({});
    console.log('Tours successfully Deleted!');
    await User.deleteMany({});
    console.log('Users successfully Deleted!');
    await Review.deleteMany({});
    console.log('Reviews successfully Deleted!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// Interacting with the command line
// process.argv is an array where 3rd element is actually what we specified in the terminal after node process
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
