// Importing Models
const Tour = require('../models/tourModel');
// Importing the HandleFactory
const factory = require('./handleFactory');

// Importing Utils
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const upload = require('../utils/uploadTourImages');
const resizeTourImages = require('../utils/resizeTourImages');

// ROUTE HANDLER MIDDLEWARES
exports.aliasTopTours = (req, res, next) => {
  // When it should reaches the getAllTours, its query object should be manipulated with appropriate values
  // Limit is 5, because we want top "5" tours, and make sure to set it as string
  req.query.limit = '5';
  // Because we wanted to be sorted by -ratingsAverage (high to low), if ratings are same, sort from price (low to high)
  req.query.sort = '-ratingsAverage,price';
  // Only send these fields as response
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  // Make sure to call next()
  next();
};

// HANDLING UPLOADING THE IMAGES: This will run before createTour
// Some fields expects multiple images, and some fields expects only 1 image, then we use fields
// Currently we are only saving it to the memory
// This will be actually a middleware
exports.uploadTourImages = upload.fields([
  // "imageCover" will only able to upload 1 image
  { name: 'imageCover', maxCount: 1 },
  // "images" will only able to upload 3 image
  { name: 'images', maxCount: 3 },
]);

// If we have only one field with multiple images then we will use upload.array()
// upload.array('images', 3);
// If there is only 1 then,
// upload.single('image');

// This will run after the images have been uploaded in the memory (upper middleware)
exports.resizeTourImages = resizeTourImages;

// ROUTE HANDLERS
// catchAsync can also be called in the router file (that would have the same result), but we didn't do it because, we have to remember which function is the async and which function is not
exports.getAllTours = factory.getAll(Tour);
// Populate the users (guides) from the user model, and reviews are also populated from Tour Model
exports.getTour = factory.getOne(Tour);
// The function that should be exported from controller, should be a function (not the returned value from function call)
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  // Using aggregation pipeline (this is a mongodb feature)
  // We pass in an array of so-called stages (what happens in each stage, then documents pass through these stages and be manipulated)
  // Each stage is an object
  const stats = await Tour.aggregate([
    // 1) $match: It is basically just  filter for certain fields (just like filter object in query methods)
    {
      // This stage is the preliminary stage for the next stages to compare
      $match: {
        // We only want to select an element which has ratingsAverage [gte] to 4.5
        ratingsAverage: { $gte: 4.5 },
      },
    },

    // 2) $group: It will group documents together using accumulators
    {
      // For example we can calculate an average
      $group: {
        // we always need to specify _id, because this is where we will specify what we want to group by (group the documents), now we dont want to group them (separate them by groups), we just want every document in one group (so we can calculate the statistics of all the tours together), we can also group them (like group them with difficulty, then calculate the average of easy tours, medium tours, and difficult tours)
        // _id: null,
        // now group them by difficulty
        _id: { $toUpper: '$difficulty' },
        // also with ratingsAverage
        // _id: '$ratingsAverage',
        // The name of the fields of document that are specified in strings, should be start with "$" sign only in the aggregation pipeline
        numTours: {
          // When we will go through each document, 1 will be added to numTours
          $sum: 1,
        },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },

    // Another stage "sort" stage
    // In the next stage, we can only use the names that are specified in the previous stages, so instead of "price" we have to use avgPrice
    {
      $sort: { avgPrice: 1 },
    },

    /* 
      // we can also repeat stages
      {
        // this will remove the 'EASY' group from response result
        $match: { _id: { $ne: 'EASY' } },
      },
    */
  ]);

  // Sending response
  res.status(200).json({
    status: 'success',
    data: { stats },
  });
});

// This will tell us the busiest month of the tours
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = +req.params.year;

  const plan = await Tour.aggregate([
    {
      // $unwind will deconstruct an array of fields into documents, and then output one document for each element (in our case, single document will be sended 3 times if the startDates is an array of 3 elements, and every tour (document) will have its own single start date)
      $unwind: '$startDates',
    },
    // Now select documents for the years that was passed through req
    {
      $match: {
        // Tours date should be greaterEqual than January 1st of [year] and lessEqual than 31st december of [year]
        startDates: {
          // year-month-day
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    // Now group them with month
    {
      $group: {
        _id: {
          // Here startDates is not an array but a single value, bcs of the upper match field, id will also return month as number
          $month: '$startDates',
        },
        numTourStarts: { $sum: 1 },
        // $push will create an array
        // All the tours that would have same month, will be pushed to this tours array
        tours: { $push: '$name' },
      },
    },
    // $addFields will add value, in our case we need to add month value same as "_id" value
    {
      $addFields: { month: '$_id' },
    },
    // $project can add or delete values from the response, if we add 1 as the value, it will only send that field, if we add zero, it will send everything except that field with 0 value
    {
      $project: { _id: 0 },
    },
    // Sorting with the "_id" field that we specified above
    {
      $sort: { numTourStarts: -1 },
    },
    /*
      // $limit will limit the result
      {
        $limit: 1,
      },
    */
  ]);

  // Sending response
  res.status(200).json({
    status: 'success',
    data: { plan },
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/30.444463,72.664833/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  // Radius is distance as the radius, but converted to the special unit radians, which mongodb excepts, and in order to get the radians, we need to divide the distance with the radius of the earth
  // 3963.2 radius of earth in miles
  // 6378.1 radius of earth in km
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude, and longitude in the format lat,lng',
        400
      )
    );
  }

  // GEO_SPATIAL QUERY
  // For geo_spatial query to run, we have to specify the index (in the model) of field on which this query will run (here that is "startLocation")
  // We will search for the start location, because that is what that stores the geo_spatial points
  // If i live in some place, so at the :distance i would say 300 miles (find the distance in 300 miles), and :latlng (where i live), and :unit is like miles or km (in which unit we have sent the data)
  const tours = await Tour.find({
    startLocation: {
      // $geoWithing finds the documents, withing the certain geoMetry
      $geoWithin: {
        // First element is where the tours are located in lng, lat
        // Second argument is radius location, where tours should be found within
        $centerSphere: [[lng, lat], radius],
      },
    },
  });

  // Sending response
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { data: tours },
  });
});

// This one will calculate the the distances of tours from the location specified (:latlng) and also the unit (like km, or mi)
// '/distances/:latlng/unit/:unit'
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude, and longitude in the format lat,lng',
        400
      )
    );
  }

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  // For geoSpatial aggregation pipeline, there is only one stage that is $geoNear
  const distances = await Tour.aggregate([
    {
      // And this one also needs to be the first one in the pipeline
      // And atLeast one of our fields should contains the index, and if there is one field with geoSpatial index, then this geoNear will automatically calculate using that index, if we have multiple, then we have define the "keys" parameter
      $geoNear: {
        // "near" is to from where to find the indexes
        near: {
          // Near expects the geoJson format
          type: 'Point',
          // convert them to numbers
          coordinates: [+lng, +lat],
        },
        // This is the name of the field that will be created, adn where all the calculated distances will be stored
        distanceField: 'distance',
        // This number will be multiplied to all the distanceFields, means this will convert it into kilometers
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        // Only keep these two properties in the final result
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: { data: distances },
  });
});
