const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email!'],
    unique: true,
    // This will automatically convert it to lowerCase
    lowercase: true,
    // "validate" can be used as array, and also object, or just a simple callback fn
    // isEmail is a function, but we don't have to call it
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  // Photo is not required
  photo: {
    type: String,
    default: 'default.jpeg',
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'guide', 'lead-guide', 'admin'],
      message: 'Role only can be "user", "guide", "lead-guide", "admin"',
    },
    // By default the role is user
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    // Don't show the password in the returned response
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // Explanation of this in tourModel, this is only going to work on modelInstance.save() and Model.create(), for this reason, when we have to update a user, we always have to call save() (this does not work on findOneAndUpdate() and findByIdAndUpdate())
      validator: function (passwordConfirm) {
        return this.password === passwordConfirm;
      },
      message: 'Password should be equal to password confirm',
    },
  },
  // This property will only be truthy when, someone will change its password (when the user is created it will be undefined or null)
  passwordChangedAt: Date,
  // Store the token in DB
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// MONGOOSE MIDDLEWARES: Explanations are in TourModel file
// Pre save middleware, to encrypt the password
userSchema.pre('save', async function (next) {
  // We only want to encrypt the password if the password field is actually updated, we can check this by checking isNew property on password (that should be true, if it is updated), for example if the user is updating the email, then we don't want to encrypt the password again

  // If the password is not modified, just call the next middleware
  if (!this.isModified('password')) {
    return next();
  }

  // HASHING THE PASSWORD
  // This bcrypt.hash() function will done two things, first it will create hash using the number (12), then it will hash the password. Salting means that it is going to add a string to the password, so that the two equal passwords, should not look same after hashing
  // The second Argument is cost parameter, means how cpu intensive this operation should be (the more the number, the more the cpu intensive, more the secure password). The number "12" is considered as the safe value
  this.password = await bcrypt.hash(this.password, 12);

  // Delete the passwordConfirm, because we don't want to persist it to the DB, passwordConfirm is only required input (not actually required for DB)
  // By setting it to undefined, it will automatically not save in DB
  this.passwordConfirm = undefined;
  // We don't have to call save(), because it is automatically going to save (it is pre-save hook/middleware)

  // Make sure to call next
  next();
});

// This will run when we will reset the password in authController, and update password
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) {
    // If password is not modified then call the next middleware
    // Or if the document is new, then isModified will be true, but we don't want to set the passwordChangedAt Property, so also call next()
    return next();
  }

  // If password is modified, then set the passwordChangedAt property, before saving (we don't need to call save, because this is a save middleware, this will run before saving actually)

  // IMPORTANT PROBLEM! Sometimes saving it to the DB is slow than issuing jwt to the client, so passwordChangedAt will become after the jwt is created and sent, then user will not be able to get access to the protected route, using the token (he has to log in again), so subtract it with 1 seconds
  this.passwordChangedAt = Date.now() - 1000;

  // Make sure to call next
  next();
});

// Query Middleware
userSchema.pre(/^find/, function (next) {
  // "this" points to the current query, and we can chain further methods on query
  // The users that are deleted (active: false) should be shown in the find query result
  this.find({ active: { $ne: false } });

  // Make sure to call next
  next();
});

// INSTANCE METHODS: These methods will be available on instance of User Model (user)
userSchema.methods.correctPassword = async function (password, userPassword) {
  // Here "this" is current document, but because we have select password: false, so this.password is undefined. so we don't need "this" here

  // Here "password" is candidate password, and this method will be used in login auth controller

  // Candidate Password is not Hashed, but user password is hashed
  return await bcrypt.compare(password, userPassword);
};

// It will return boolean, based on that the user has changed password IMP! after the token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  // In instance method "this" points to the current document
  // If this property doesn't exist it means that the user have never changed its password, (it will be undefined or null)
  if (this.passwordChangedAt) {
    // Convert the passwordChangedAt to milliseconds, and JWTTimestamp is in seconds, so convert the changedTimestamp to seconds also by dividing it by 1000
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    // True means changed
    // If password change time is greater than jwtTimestamp means password is changed after the jwt is created, hence return true
    return changedTimestamp >= JWTTimestamp;
  }

  // If the password is not changed after the token was issued
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // This token doesn't need to be that strong as the password hash (not use bcrypt, use node crypto module)

  // randomBytes will return Buffer, convert it to string, this will create a token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // but we also need to hash the created token
  // We have to store this hashed token in the DB, because when user will send token we have to compare it with this one
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Password will expire after the 10 minutes of creation of token
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // Return the !hashed token token, which is then send to the client through email, because that is the one that client will send to the resetPassword route handler, to reset its password, and in the resetPassword route, we can compare the received token (convert it to the hashed token itself) with hashed token in the DB,
  return resetToken;
};

// Creating the modelClass out of schema
const User = mongoose.model('users', userSchema);

module.exports = User;
