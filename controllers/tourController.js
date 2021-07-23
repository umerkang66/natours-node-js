const Tour = require('../models/tourModels');

// ROUTE HANDLERS
exports.getAllTours = async (req, res) => {
  try {
    const tours = await Tour.find();

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: { tours },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: 'Cannot get tours',
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const requestedTour = await Tour.findById(req.params.id);
    // Tour.findOne({ _id: req.params.id }) if we will be using pure mongodb, but now we are using mongoose library

    res.status(200).json({
      status: 'success',
      data: { tour: requestedTour },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: 'Cannot find the requested tour',
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { tour: newTour },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: 'Invalid data sent',
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tourChanged = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: { tour: tourChanged },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: 'Cannot update the tour',
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'deleted successfully',
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: 'Canont delete the tour you requested',
    });
  }
};
