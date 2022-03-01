class APIFeatures {
  constructor(query, requestQuery) {
    // "query" is just the Model.find() before awaiting
    this.query = query;
    // "requestQuery" is actually req.query
    this.requestQuery = requestQuery;
  }

  filter() {
    // FILTERING
    // Creating the shallow copy of req.query because all of the query parameters are not for filtering
    const queryObj = { ...this.requestQuery };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];

    // Exclude excluded these fields from queryObj
    excludedFields.forEach(el => delete queryObj[el]);

    // ADVANCE FILTERING
    // when url /api/v1/tours?duration[gte]=5, if duration is "greater than or equal than" then This will come out of url { duration: { gte: '5' } }
    let queryStr = JSON.stringify(queryObj);
    // Replacing all the operators (gte, gt, lte, lt) with mongodb operators ($gte, $gt, $lte, $lt) (add $ sign before operators)
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    // If there are not tours, find method will return an empty array
    // Mongodb way of filtering
    // BUILD QUERY
    // Without awaiting Tour.find() send us query object where we can chain other query methods
    this.query = this.query.find(JSON.parse(queryStr));

    // Return this so we can chain these class methods
    return this;
  }

  sort() {
    // SORTING
    // req comes as api/v1/tours?sort=price,ratingsAverage, if price is same then it will sort on the basis of ratingsAverage because that is the second field
    if (this.requestQuery.sort) {
      // here req.query.sort = price
      // If we set -price here mongoose will automatically sort it in the other order
      // If there are multiple values mongoose will expect a space between them, but there is a comma in the url
      const sortBy = this.requestQuery.sort.replaceAll(',', ' ');

      this.query = this.query.sort(sortBy);
    } else {
      // If user doesn't specify the sort field, we can still sort it by createdAt (in the descending order) so the newest ones will appear first
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    // LIMITING
    // The Url looks like this /api/v1/tours?fields=name,duration,difficulty,price
    // This means in the response only send name, duration, difficulty, price fields
    if (this.requestQuery.fields) {
      // Mongoose expects strings separated by spaces
      const fields = this.requestQuery.fields.replaceAll(',', ' ');

      // query select method limits the field, this is also called projecting
      this.query = this.query.select(fields);
    } else {
      // In case user doesn't specify the field the default is to remove "__v"
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    // PAGINATION
    // Default Pagination (even if the user doesn't even specify the page & limit property), because can have 1 million results

    // /api/v1/tours?page=2&limit=10
    // It means that user want page number 2, with 10 results per page, page 1: 1-10, page 2: 11-20
    // There are two methods .skip() and .limit(), skip() means how many documents to skip before start querying, limit() means how many pages to show per page

    // If we don't have page initialize it with 1
    const page = +this.requestQuery.page || 1;
    // If we don't specify limit initialize it with 20
    const limit = +this.requestQuery.limit || 20;

    // We don't ask for skip value from user, but we calculate it
    const skipCollections = limit * (page - 1);

    // Make sure to sort it by "_id" before implement pagination, because all the tours are implemented at the same time, so some results may come before or after their original position
    this.query = this.query.sort('_id').skip(skipCollections).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
