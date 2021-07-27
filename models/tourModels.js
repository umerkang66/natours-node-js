const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxLength: [40, "Tour name shouldn't have more than 40 characters"],
      minLength: [10, "Tour name shouldn't have less than 10 characters"],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      reqruied: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty property'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Tour difficulty is either be easy, medium, or hard',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      max: [5, "Tour rating shouldn't be more than 5"],
      min: [1, "Tour rating shouldn't be less than 1"],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a name'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        // this only points to the current doc on NEW document creation
        validator: function (value) {
          return value < this.price;
        },
        message: 'The discount price ({VALUE}) should be less than price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a image cover'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// DOCUMENT MIDDLEWARES: It runs before the .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

/*
tourSchema.pre('save', function (next) {
  console.log('Coming from the second pre save hook...');
  next();
});

tourSchema.post('save', function (document, next) {
  console.log(document);
  next();
});
*/

// QUERY MIDDLEWARES: They allow us to run function before or after the query is executed
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

// AGGREGATION MIDDLEWARES: They run before and after aggregation pipeline
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

// CREATING A MODEL FROM TOUR SCHEMA
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
