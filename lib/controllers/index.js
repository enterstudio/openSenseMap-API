'use strict';

const usersController = require('./usersController'),
  boxesController = require('./boxesController'),
  statisticsController = require('./statisticsController'),
  sensorsController = require('./sensorsController'),
  measurementsController = require('./measurementsController');

module.exports = {
  usersController,
  boxesController,
  statisticsController,
  sensorsController,
  measurementsController
};
