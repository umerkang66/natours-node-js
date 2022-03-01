// BEFORE IMPLEMENTING AUTHENTICATION: It is a real responsibility to get the authentication right. Because user's data is at stake, and the company who runs the application is at stake as well

const crypto = require('crypto');
const { promisify } = require('util');
// Importing the packages
const jwt = require('jsonwebtoken');

// Importing the Models
const User = require('../models/userModel');

// Importing the Utils
// Explanation of catchAsync is in the tourController and catchAsync file
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

// AUTH CONTROLLER UTILS
const jwtVerifyPromisified = promisify(jwt.verify);

const signToken = userId => {
  // FIRST ARGUMENT is payload (all the data that we want to store in the jwt i.e. userId)
  // SECOND ARGUMENT IS SECRET
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    // This jwt token will expires in the time specified (automatically logs out after certain period of time)
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  return token;
};

// We also need to send statusCode with it, because different token creating operations can have different statusCode
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Attach the cookie to the cookie (a cookie is a piece of text, that server send to the browser, then browser automatically attach this cookie to every request that browser made to that certain server)
  // JWT_COOKIE_EXPIRES_IN: This is in days, convert it into milliseconds
  const cookieOptions = {
    // When the cookie should expires (this should be the same the jwt expires date in config.env file)
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // By using this cookie cannot be modified by any way by browser
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    // By using this cookie will be only sent if we are using https
    // This one should only be done in production
    cookieOptions.secure = true;
  }

  res.cookie('jwt', token, cookieOptions);

  // Delete the password from user data
  user.password = undefined;

  // "201" means created
  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  });
};

// We are not calling is createUser but signup, because that one has appropriate meaning in the context of authentication
exports.signup = catchAsync(async (req, res, next) => {
  // Get user properties from req.body
  const { name, email, password, passwordConfirm } = req.body;

  // Create new user
  const newUser = await User.create({ name, email, password, passwordConfirm });
  // If user creation failed, mongoose will automatically reject the promise, thus error will be caught in the catchAsync()

  // After signing up, log in the user
  // Usually when we signup for any web application, we also get automatically logged in (just log in no need to check for the password is correct or something like that)

  // Send welcome email
  // The url will point to the /me because we want to tell the user to upload the user photo
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  // "201" means created
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  // Logging users just means to check if the password is right, if it is sign the token
  const { email, password } = req.body;

  // 1) Check if email and password actually exists
  if (!email || !password || !email.includes('@')) {
    // Create an error, and send it by either by throwing, returning next. Imp! return it
    return next(new AppError('Please provide valid email and password', 400));
  }

  // 2) Check if user exists && password is correct
  // findOne will not have the password because we have selected false in the model, but here we need it, so we explicitly have to tell the mongoose
  const user = await User.findOne({ email }).select('+password');

  // Check if the password is correct using User Model instance method, do it after !user because if user doesn't exit (null) and we access the user.correctPassword || user.password, the server will give us the error

  /* const passwordCorrect = await user.correctPassword(password, user.password); */

  // If it doesn't exist user will be "null"
  if (!user || !(await user.correctPassword(password, user.password))) {
    // We should tell the user, if the only email is correct or password is correct, tell that email or password is incorrect
    // "401" means unauthorize
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to the client
  // "200" means "ok"
  createSendToken(user, 200, res);
});

// Logging out the user
exports.logout = (req, res, next) => {
  // By setting the fake cookie as the exact same name "jwt" we can simply just log out the users
  // Secret is to give it the exact same name
  res.cookie('jwt', 'loggedOut', {
    // This will expires in 10 seconds from now
    expires: new Date(Date.now() + 10 * 1000),
    // By using this cookie cannot be modified by any way by browser
    httpOnly: true,
  });

  // We don't need to set it to secure (use only https) because there is not sensitive data

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};

// This is going to be a middleware function, that will before some other route handler (then that handler will become protected)
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting the token from req headers and check of it's there
  let token;

  if (
    // This is for POSTMAN
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // req.headers.authorization will be 'Bearer {{token}}', we need to extract the token (remove "Bearer" string part)
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    // This is for browser cookies
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please log in to get access', 401)
    );
  }

  // 2) Verification of token
  // If this promise rejected we have already handled that in our error controller
  const decoded = await jwtVerifyPromisified(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  // If the user is deleted by user himself or admin, then this token should not work, but currently it will work (so we have to change it)

  // We have encoded the userId as "id" in the jwt
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token does no longer exist', 401)
    );
  }

  // 4) Check if user changed password after the token was issued
  // This will return true, if the user changed their password
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    // If user has changed his password, and someone has steel his previous password or token then after changing the password that previous token should not work, we are going to implement it on the instance method
    return next(
      new AppError('User recently changed password. Please log in again', 401)
    );
  }

  // Grant access to the next protected route handler, and put the entire user data on the req.user
  req.user = currentUser;
  // When this middleware run before views controller then, this this will be helpful, more explanation is in the isLoggedIn function
  res.locals.user = currentUser;
  next();
});

// This middleware runs before every get request to the views, then the pug templates will run different things, based on that the user is logged in or not
// This one just checks if the user is logged in or not, so this one will not throw an error
// IMPORTANT! Don't use catchAsync here, catch the errors locally, and if there is an error just call the next middleware
exports.isLoggedIn = async (req, res, next) => {
  try {
    // 1) Getting the token from browser cookie, and check of it's there
    if (req.cookies.jwt) {
      // This is for browser cookies
      const token = req.cookies.jwt;

      // 2) Verification of token
      // If this promise rejected we have already handled that in our error controller
      const decoded = await jwtVerifyPromisified(token, process.env.JWT_SECRET);

      // 3) Check if user still exists
      // If the user is deleted by user himself or admin, then this token should not work, but currently it will work (so we have to change it)

      // We have encoded the userId as "id" in the jwt
      const currentUser = await User.findById(decoded.id);

      // If there is an error, just don't return an error, but call the next middleware
      if (!currentUser) return next();

      // 4) Check if user changed password after the token was issued
      // This will return true, if the user changed their password
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        // If user has changed his password, and someone has steel his previous password or token then after changing the password that previous token should not work, we are going to implement it on the instance method
        return next();
      }

      // There is a logged in user
      // Every pug template has access to the local object, there we can access the user variable
      res.locals.user = currentUser;
      return next();
    }
  } catch (err) {
    return next();
  }

  // In case there is not cookie, also call next
  next();
};

// If user is logged, further if we want to restrict the routes to the certain types of logged in users
exports.restrictTo = (...roles) => {
  // Roles is an array and it can be "admin", "controller" or "user"
  return (req, res, next) => {
    // If the current user's (req.user: added by restrict middleware) role is not in the roles (that should be allowed) array, then return an error
    // Getting the currentUser's role
    const userRole = req.user.role;

    if (!roles.includes(userRole)) {
      return next(
        new AppError(
          "You don't have the permission to perform this action",
          401
        )
      );
    }

    // Grant access to the next route handler
    next();
  };
};

// Implementing the forgot password, and rest password functionality, first the user will send request to the forgotPassword, then from there the reset password, route will be called
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    // Explanation in upper route handlers
    return next(new AppError('Please provide an email address', 401));
  }

  // 1) Get user based on POST email
  const user = await User.findOne({ email });
  if (!user) {
    // Explanation in upper route handlers
    return next(new AppError('There is no user with this email address', 404));
  }

  // 2) Generate the random reset token (from user instance method)
  const resetToken = user.createPasswordResetToken();
  // IMP! Make sure to save it because, we modify the document values in the createPasswordResetToken() function that will not be saved in the DB (they will just be saved in the memory in this point), unless we save them

  // If we currently save the document, without options, that will give an error, because we didn't specify the other required fields like (email, password), so set the validateBeforeSave to false
  await user.save({ validateBeforeSave: false });

  // 3) Send it to the user's email
  // Here we need to do more than just catchErrors so create an tryCatch block
  try {
    // "req.protocol" may be "http" or "https"
    // "host" can be localhost or the production url itself
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetUrl).sendResetPassword();

    // We should not sent it to the response (because here everyone could get it, so send it to the email)
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    // If there is an error
    // Remove the password reset token, and reset expires property from the DB
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    // Send an error to the response
    // Error code is "500" means server error
    return next(
      new AppError('There was an error sending the email. Try again later', 500)
    );
  }
});

// This will run after the user has received the token from forgotPassword, then it will receive that token as req.parameter as the new password, and the new passwordConfirm from the body
exports.resetPassword = catchAsync(async (req, res, next) => {
  // This token is the non-encrypted one, we have to first encrypt it then compare it to the token that is in the DB
  const { token } = req.params;
  const { password, passwordConfirm } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // 1) Get user based of the token
  const user = await User.findOne({
    token: hashedToken,
    // Date.now() is an timestamp but behind the scenes mongodb will convert them to the same
    // If the token is greater than Date.now() means it is not expired yet, (it will expire it in the future), If it is less than Date.now() (means token is expired and there will be no user)
    passwordResetExpires: { $gt: Date.now() },
  });

  // This will handle both !user, and token date less than Date.now()
  if (!user) {
    return next(new AppError('Token is invalid or has expired.', 400));
  }

  // 2) If token has not expired and there is a user, then reset the password
  user.password = password;
  // Password confirm will not be saved in the DB, this is just for validation purposes
  user.passwordConfirm = passwordConfirm;
  // Delete the password reset token, and password reset expired
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // Don't use findByIdAndUpdate if we have to run the validators
  // This will also run the validators, and the save middleware functions (where passwords are encrypted)
  await user.save();

  // 3) IMP! Update the changedPasswordAt property for the current user, This is automatically changed from the userModel pre save hook

  // 4) Log the user in, send the jwt to the client
  createSendToken(user, 200, res);
});

// This will work if the logged in user want to update his password,
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get the passwordCurrent, newPassword, newPasswordConfirm form the req.body
  const { passwordCurrent, password, passwordConfirm } = req.body;

  // 2) Get the user from request, that is added by "protect"
  // protect middleware will run before this route, this req.user property has the user that is trying to update his password
  const { user } = req;

  // 3) Check if the current password is equal to the user's password that is saved in the DB
  // user.password is undefined so first get the user password from the DB
  const foundUser = await User.findById(user._id).select('+password');

  if (!(await user.correctPassword(passwordCurrent, foundUser.password))) {
    return next(new AppError('Current Password is not correct', 401));
  }

  // 4) If the password is correct, then update the password in the DB
  user.password = password;
  user.passwordConfirm = passwordConfirm;

  // 5) After updating the password, passwordChangedAt property will automatically change from the user model pre save hook

  // Run the validators, and all the save hooks before saving to the DB
  await user.save();

  // 6) Send the success message, and again signIn the user (send the token)
  createSendToken(user, 200, res);
});
