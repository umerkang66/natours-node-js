const catchAsync = asyncFunction => {
  // Return a function that is going to be called by express, then express will pass these (res, res, next) in this function that has been returned
  return (req, res, next) => {
    // We don't have to return this function, just call it with (req, res, next) that has been provided by express
    // When there will be an error (means promise rejected: by "throw new AppError(message, statusCode)"), this error will be caught in the catch block where, it is send off too the "next" function (remember! when "next" is called with something, express will automatically assume that it is error, and pass to the globalErrorHandlingMiddleware)
    // By the way, this async function will be called when "req" comes in
    asyncFunction(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
