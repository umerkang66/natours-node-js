const fs = require('fs');

// READING THE LOCAL FILES
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);

// ROUTE HANDLERS
exports.checkId = (req, res, next, val) => {
  // console.log(`Tour id is: ${val}`);
  if (+req.params.id > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid Id',
    });
  }

  next();
};

exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing name or price',
    });
  }

  next();
};

exports.getAllTours = (req, res) => {
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: { tours },
  });
};

exports.getTour = (req, res) => {
  const id = +req.params.id;
  const requestedTour = tours.find(tour => tour.id === id);

  if (!requestedTour) {
    return res.status(404).json({
      status: 'error',
      message: 'Requested tour did not found',
    });
  }

  res.status(200).json({
    status: 'success',
    data: { tour: requestedTour },
  });
};

exports.createTour = (req, res) => {
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign(req.body, { id: newId });

  tours.push(newTour);

  fs.writeFile(
    `${__dirname}/../dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    () => {
      res.status(201).json({
        status: 'success',
        data: { tour: newTour },
      });
    }
  );
};

exports.updateTour = (req, res) => {
  const newObj = req.body;
  const id = +req.params.id;

  const tourToChangeIndex = tours.findIndex(tour => tour.id === id);
  const tourToChange = tours[tourToChangeIndex];
  const tourChanged = Object.assign(tourToChange, newObj);

  tours.splice(tourToChangeIndex, 1, tourChanged);

  fs.writeFile(
    `${__dirname}/../dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    () => {
      res.status(200).json({
        status: 'success',
        data: { tour: tourChanged },
      });
    }
  );
};

exports.deleteTour = (req, res) => {
  const id = +req.params.id;

  const deleteIndex = tours.findIndex(tour => tour.id === id);
  tours.splice(deleteIndex, 1);

  fs.writeFile(
    `${__dirname}/../dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    () => {
      res.status(204).json({
        status: 'deleted successfully',
        data: null,
      });
    }
  );
};
