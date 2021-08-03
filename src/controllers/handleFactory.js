const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const ApiFeatures = require('../utils/ApiFeatures');

exports.deleteOne = Model => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document was found with this id', 404));
    }

    res.status(204).json({
      status: 'deleted successfully',
      data: null,
    });
  });
};

exports.updateOne = Model => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(
        new AppError(
          'Cannot update the document, because didnot find a document with this id',
          404
        )
      );
    }

    res.status(200).json({
      status: 'success',
      data: { data: doc },
    });
  });
};

exports.createOne = Model => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { data: doc },
    });
  });
};

exports.getOne = (Model, populateOptions) => {
  return catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);

    const doc = await query;

    if (!doc) {
      return next(
        new AppError('Requested document with this id is not found', 404)
      );
    }

    res.status(200).json({
      status: 'success',
      data: { data: doc },
    });
  });
};

exports.getAll = Model => {
  return catchAsync(async (req, res, next) => {
    // To allow for nested get Reviews
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // Build the query and adding api features
    const apiFeatures = new ApiFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // EXECUTE THE QUERY
    // const doc = await apiFeatures.query.explain();
    const doc = await apiFeatures.query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: { data: doc },
    });
  });
};
