const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

// IMPORTING THE MODELS
// Only required if the users should be embedded
// const User = require('./userModel');

// We can specify the fields of a document, validate them, and also specify some error message
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      // Every name should be unique (unique is technically not a validator)
      unique: true,
      // trim only works for strings, that will remove all the white space from either side of a string
      trim: true,
      // maxlength and minlength both are "String" validators
      // Validators can be array with the second value of array is error message
      maxlength: [
        40,
        'A tour name should have less or equal than 40 characters',
      ],
      minlength: [
        10,
        'A tour name should have more or equal than 10 characters',
      ],
      // Using validator library, don't call the function just say that this is the function that is going to be used, This also checks for spaces, so not that useful
      /* validate: [validator.isAlpha, 'Tour name should only contain letters'], */
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have duration'],
    },
    maxGroupSize: {
      // how many people can take part in a tour
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have duration'],
      // Its like some field Interface or Type that difficulty should easy, medium or hard
      enum: {
        // We cannot specify the error message in this values array,
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either, easy, medium, difficult',
      },
    },
    ratingsAverage: {
      // average rating of this tour (averaged from all the ratings (from reviews))
      type: Number,
      // Min rating should 1, and max should be 5
      // "min" and "max" are also for Numbers and Dates
      min: [1, 'Rating must be above or equal to 1.0'],
      max: [5, 'Rating must be less or equal to 5'],
      // set will run whenever new value will be set on the ratingsAverage
      set: val => {
        // if val is 4.66666, after Math.round it becomes 5, (but we need 4.7), so multiply the value with 10 before rounding (4.666 * 10 = 46.666), after rounding it becomes 47 then divide it by 10, then it becomes 4.7
        return Math.round(val * 10) / 10;
      },
    },
    ratingsQuantity: {
      // how many people have gave the review (that also contains rating)
      type: Number,
      // if we don't specify this, the default will be 0
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (priceDiscount) {
          // Here "this" is the current document
          // "this" only points to current doc on NEW Document creation
          return priceDiscount < this.price;
        },
        // {VALUE}: It is just mongoose thing and it is equal to the priceDiscount
        message: 'Price Discount ({VALUE}) should be less than Price itself',
      },
    },
    summary: {
      type: String,
      // trim only works for strings, that will remove all the white space from either side of a string
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      // because this will simply be the name of the image here
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    // multiple images that will be displayed on the detail page
    // images property will have multiple strings (array of strings)
    images: [String],
    createdAt: {
      // this is a time stamp that will be created when the tour is created
      // Date is another js built in datatype
      type: Date,
      // Date.now() will the give us the time in milliseconds
      default: Date.now(),
      // By selecting false, this will be automatically removed from the response result
      select: false,
    },
    // different dates when tour starts, tour of same type can start on different times in a year
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
      select: false,
    },
    // Mongodb has good support for getSpatial Data, (data that describe places on earth using longitude and latitude: we can point simple points or we can also points more complex geometries, like lines, or polygons)
    startLocation: {
      // This is getJSON
      // This is not schema Types options, but this is an embedded documents, in order for this object to recognized as the getJSON object, we need the "type" and the "coordinates" property
      type: {
        // These are type schema types options
        type: String,
        default: 'Point', // others can be lines, polygons
        enum: ['Point'], // Not other than "Point"
      },
      coordinates: {
        // These are the coordinates schema types options
        // The first number is longitude, and the second one is latitude, (opposite the real world)
        type: [Number],
      },
      // These two are not required for geoJSON
      address: String,
      description: String,
    },
    // In order to create documents, and to embed them into this document, we need to create an array, and specify that document in that, It is also called EMBEDDING
    locations: [
      {
        // This type is because geoJSON excepts type, and coordinate
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      // This should like embedded documents
      {
        // type should be mongodbId,
        type: mongoose.Schema.ObjectId,
        // ref should from which model they will be imported
        ref: 'users',
      },
    ],
  },
  {
    // When converting it to json, make sure to add Virtual Properties
    toJSON: { virtuals: true },
    // Also when the data get outputted as object
    toObject: { virtuals: true },
  }
);

// INDEXING
// Mongodb already creates indexes on _id fields, that they store in order somewhere outside the collection, when we query the results by id, mongodb goes through the indexes, instead of all the documents, hence we can create indexes of some other fields, so that when we search through that field (like price), instead of going through the documents, it goes to the indexes, such makes the query a lot faster
tourSchema.index({
  // "1" means we are sorting the price index in ascending order, and "-1" means the opposite
  price: 1,
  // We can add another field, for ratingsAverage as well, this will create compound index
  ratingsAverage: -1,
});

// When we will create the SSR website, the tours will be most queried by "slug", so, creating an index for slug
tourSchema.index({ slug: 1 });

// For geo_spatial queries, in the tour controller, this index should be 2dsphere index, if the data describes the real point on the earth like sphere
// We can also use 2d index, if we are using some fictional points on some two dimensional index
tourSchema.index({ startLocation: '2dsphere' });

// STEPS TO CREATE AN INDEX
// 1) If we have a collection, that have high write/read ratio (means write rate is high), then it makes no sense to create an index of any field, because we have to also update the index in memory (because the cost of always updating the index, and keeping it in the memory clearly outweighs, the benefits of having the index in the first place)

// VIRTUAL PROPERTIES
// Virtual Properties are not saved in the DB, but created on the fly
// We cannot use this virtual property in the query, because they are not part of the DB
tourSchema.virtual('durationWeeks').get(function () {
  // Here "this" is instance of Tour Model
  // Convert the duration time into weekly time
  return this.duration / 7;
});

// VIRTUAL POPULATE
// Populating the reviews in the tours, but we don't want to save the ids of the reviews in the tour document, so we have to populate it but virtually,
// If we are doing parent referencing, but also want to get the data in the parent itself
// We have set this field, but we don't yet populated it, but we need to populate it, and we have populated in the query middleware
tourSchema.virtual('reviews', {
  // Reference to the reviews model that will be populated, on the fly without the saving the ids on the DB
  ref: 'reviews',
  // Name of the field in the other model (Review model) that contains the id
  foreignField: 'tour',
  // Where that id is stored in the current document
  localField: '_id',
});

// MONGOOSE MIDDLEWARES
// There are 4 types of mongoose middlewares, document, query, aggregate, and model middlewares, we can have multiple pre, and post middlewares
// 1) Document Middlewares
tourSchema.pre('save', function (next) {
  // It runs before "save()" command and create() command (IMP !insertMany(), !insertOne() !findByIdAndUpdate() !findOneAndUpdate)
  // This callback will run before the saving of tour document
  // Here "this" is the currently processed document
  // Add slug before saving the new document
  this.slug = slugify(this.name, {
    // Also convert it to the lowercase
    lower: true,
  });

  // Make sure to call next
  next();
});

// 2) Query Middleware
// pre, and post "find" middleware (hook) is going to run before and after respectively of every "find" query
// This middleware should execute for every query methods that starts with "find" (find, findById, findOne)
tourSchema.pre(/^find/, function (next) {
  // We can filter out the secretTour using this query operator
  // Here "this" is query
  // Same as {secretTour: false}
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();

  next();
});

// WE CAN POPULATE ALSO IN THE MODEL AND THE IN CONTROLLER, BUT WE WILL USE THE POPULATING IN THE CONTROLLER
tourSchema.pre(/^find/, function (next) {
  // here "this" is current find query (with awaiting)
  // Here we can also specify just the path to be populate (populate('guides')), but we are passing object
  this.populate({
    // "path" is the name of the field in current schema,
    path: 'guides',
    // "model" is the name of the schema from where we are importing
    // "model" is not required if we are not populating further nested documents, hence we are just using it because it makes the code clean
    model: 'users',
    select: '-__v -passwordChangedAt',

    // HOW IT WORKS: populate method will collect the ids from the "path" property, and search for that ids in the "model" (that is users), then populate it in this current find query
  });

  next();
});

// Populating the reviews, on the findOne query of the tour
tourSchema.pre('findOne', function (next) {
  // Here "this" is current query
  this.populate('reviews');

  next();
});

// Post middleware
tourSchema.post(/^find/, function (docs, next) {
  // Docs are all the documents that are returned from the query
  // Here "this" is query
  console.log(`Query took ${Date.now() - this.start} milliseconds`);

  next();
});

// 3) Aggregation middleware
tourSchema.pre('aggregate', function (next) {
  // Here "this" is the current aggregation object
  // We have to add $match state in the beginning of pipeline (unshift array method) to remove secret tours from aggregation pipeline,

  // Don't run this middleware before geoNear aggregation pipeline
  if (Object.keys(this.pipeline()[0])[0] === '$geoNear') {
    return next();
  }

  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  next();
});

// Creating the model(collection: Tours) out of schema
const Tour = mongoose.model('tours', tourSchema);

module.exports = Tour;
