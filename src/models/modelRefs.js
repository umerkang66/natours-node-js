// Fake schema and model
const tourSchema = {};
const User = {};

// EMBEDDING THE USERS (GUIDES) IN TOUR MODEL
tourSchema.pre('save', async function (next) {
  // The guidesPromise will actually array of promises
  const guidesPromise = this.guides.map(async guideId => {
    return await User.findById(guideId);
  });

  this.guides = await Promise.all(guidesPromise);

  next();
});

tourSchema.pre('save', function (next) {
  console.log('From tourSchema second pre save middleware 😀😀😀');
  console.log(this);

  next();
});

// Post document middleware: we have access to the nextFunction but also, document that has been saved as the first argument
tourSchema.post('save', function (doc, next) {
  console.log('From tourSchema Post middleware 😀😀😀 ', this === doc);
  // "this" and "doc" will point to the same document that has been saved ("this" === "doc")
  next();
});

// These console.logs don't matter, because we are not using the functions anywhere
