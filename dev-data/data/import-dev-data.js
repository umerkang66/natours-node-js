const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Tour = require('../../src/models/tourModel');
const User = require('../../src/models/userModel');
const Review = require('../../src/models/reviewModel');

dotenv.config({ path: './config.env' });

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

// READING THE FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

// IMPORT DATA INTO DATABASE
const importData = async () => {
  try {
    const tourPromise = Tour.create(tours);
    const userPromise = User.create(users, { validateBeforeSave: false });
    const reviewPromise = Review.create(reviews);
    await Promise.all([tourPromise, userPromise, reviewPromise]);
    console.log('Data successfully loaded');
  } catch (err) {
    console.log(err.message);
  }

  process.exit();
};

// DELETE ALL DATA FROM DATABASE
const deleteData = async () => {
  try {
    const tourPromise = Tour.deleteMany();
    const userPromise = User.deleteMany();
    const reviewPromise = Review.deleteMany();
    await Promise.all([tourPromise, userPromise, reviewPromise]);
    console.log('Data successfully deleted');
  } catch (err) {
    console.log(err.message);
  }

  process.exit();
};

if (process.argv[2] === '--import') importData();
else if (process.argv[2] === '--delete') deleteData();
