const AppError = require('../utils/appError');

const handleCastErroDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const message = `Duplicate field value: ${err.keyValue.name}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorsDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('; ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, req, res) => {
  // FOR API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  // FOR RENDER
  console.error('🚨ERROR🚨', err);
  return res.status(err.statusCode).render('error', {
    title: '404',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // API API API API API API API API API API API API API API API API API API
  if (req.originalUrl.startsWith('/api')) {
    // Operational, თუ კლიენტმა რამე ვერ ქნა და გვინდარო ინფორმაცია მივაწოდოთ
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // 1) კონსოლში ჩვენ პონტში დავაკონსოლოთ რო გავიგოთ
    console.error('🚨ERROR🚨', err);

    // in this case client's fault is nothing and our code is broken so we dont give them any information
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    });
  }

  // RENDER RENDER RENDER RENDER RENDER RENDER RENDER RENDER RENDER RENDER RENDER RENDER RENDER
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: '404',
      msg: err.message,
    });
  }
  console.error('🚨ERROR🚨', err);

  // in this case client's fault is nothing and our code is broken so we dont give them any information
  return res.status(err.statusCode).render('error', {
    title: '404',
    msg: 'Please try again later.',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error ';

  if (process.env.NODE_ENV === 'development') {
    //
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = JSON.parse(JSON.stringify(err));
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErroDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorsDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
