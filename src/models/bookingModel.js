const mongoose = require('mongoose');

// SCHEMA
const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'tours',
    required: [true, 'Booking must belong to a Tour'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'users',
    required: [true, 'Booking must belong to a User'],
  },
  price: {
    // We have to keep the reference of the price, that user has paid, because price can change in the future, and we have to know, what price user has paid
    type: Number,
    required: [true, 'A booking must have a price'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    // What if user don't have credit-card (or stripe service). Then he can pay the cash to the administrator, then administrator can directly create the booking, through our bookings api endpoint, by default it will also be true, (if user doesn't paid the cash then it will be false)
    type: Boolean,
    default: true,
  },
});

// Automatically populate the user, and tour, once queried
bookingSchema.pre(/^find/, function (next) {
  // Here "this" is the current query
  this.populate({
    path: 'tour',
    model: 'tours',
    select: 'name',
  }).populate({
    path: 'user',
    model: 'users',
  });

  next();
});

// MODEL
const Booking = mongoose.model('bookings', bookingSchema);

module.exports = Booking;
