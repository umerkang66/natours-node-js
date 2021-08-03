const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const factory = require('./handleFactory');

// Utils
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(key => {
    if (allowedFields.includes(key)) newObj[key] = obj[key];
  });

  return newObj;
};

// ROUTE HANDLERS
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Send an error if user tries to update the password
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password update. Please use the /updatePassword route',
        400
      )
    );
  }

  // 2) Filtered out unwanted field names that are not allowed
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Update the user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    user: updatedUser,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({ status: 'success', data: null });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined, Please use /signup for that',
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

// Do not update password with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
