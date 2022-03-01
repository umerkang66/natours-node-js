// Importing the Utils
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// ROUTE HANDLERS
// This search filter is only getting from reviews controller
exports.getAll = Model => {
  return catchAsync(async (req, res, next) => {
    /* // Mongoose way of filtering
  const query = Tour.find()
    .where('duration')
    .equals(5)
    .where('difficulty')
    .equals('easy'); */

    // THIS FILTER IS ONLY FOR REVIEWS (hack)
    // If the request is coming from tourRouter, then we have to send the reviews, specifically to that tours only, this is already done in the tourModel populating we can also do it here
    const tour = req.params.tourId;
    const reviewsFilter = tour ? { tour } : {};

    // ADDING API FEATURES
    // 1st Argument: We can create query just by calling find without awaiting it
    // We can use api features on every api endpoint that has find({}) query, create new instance of APIFeatures then just call the method, which feature we want to use
    const features = new APIFeatures(Model.find(reviewsFilter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // EXECUTE QUERY
    const docs = await features.query;

    // EXPLAIN THE QUERY
    // const docs = await features.query.explain();

    // ERROR HANDLING IN GET_ALL_DOCUMENTS
    // If no DOC found, there is no need to send an error response, (just send an empty array), if there is some mongoose (DB) error then Promise will automatically rejected by mongoose, that error will be caught by catchAsync to globalErrorHandlingMiddleware

    // SENDING RESPONSE
    // By using this json method, we already set the Content-Type header to 'application/json'
    res.status(200).json({
      // "200" means response OK
      status: 'success',
      results: docs.length,
      data: { data: docs },
    });
  });
};

exports.getOne = (Model, populateOptions) => {
  return catchAsync(async (req, res, next) => {
    // This "id" is string
    const { id } = req.params;

    let query = Model.findById(id);
    // We can pass "string", object, or array to populate
    if (populateOptions) query = query.populate(populateOptions);

    const doc = await query;

    // If there is not doc, it is null
    if (!doc) {
      // Both Method 1, and 2 will work here

      // Method 1: This error will be sent in catchAsync catch block to next function
      // throw new AppError('Document with this id is not found', 404);

      // Method 2: This error is explicitly send off the next function here in this current function
      // Make sure to return it
      return next(new AppError('Document with this id is not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { data: doc },
    });
  });
};

exports.createOne = Model => {
  return catchAsync(async (req, res, next) => {
    // req.body is !undefined because we have used a express.json() middleware
    const newDoc = await Model.create(req.body);

    // "201" means created
    res.status(201).json({
      status: 'success',
      data: { data: newDoc },
    });
  });
};

exports.updateOne = Model => {
  return catchAsync(async (req, res, next) => {
    const { body } = req;
    const { id } = req.params;

    const doc = await Model.findByIdAndUpdate(id, body, {
      // By using this, new updated document will be returned
      new: true,
      // It means run validator every time the doc is updated
      runValidators: true,
    });

    // If there is not doc, it is null
    if (!doc) {
      // EXPLANATION OF THIS "IF" BLOCK IS IN GET_ONE FUNCTION
      // throw new AppError('doc with this id is not found', 404);

      // Make sure to return it
      return next(new AppError('Document with this id is not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { data: doc },
    });
  });
};

exports.deleteOne = Model => {
  return catchAsync(async (req, res, next) => {
    // This "id" is a string
    const { id } = req.params;
    // Deleting the Document
    // It will return the Document that is deleted (as the resolved value of promise)
    const doc = await Model.findByIdAndDelete(id);

    // If there is not doc, it is null
    if (!doc) {
      // EXPLANATION OF THIS "IF" BLOCK IS IN GET_DOCUMENT FUNCTION
      // throw new AppError('Model with this id is not found', 404);

      // Make sure to return it
      return next(new AppError('Document with this id is not found', 404));
    }

    // Deleting response is "204" which means "no content"
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
};
