const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const sendError = (res, message, statusCode = 400) => {
  res.status(statusCode).json({
    success: false,
    error: message
  });
};

const sendValidationError = (res, errors) => {
  res.status(400).json({
    success: false,
    error: 'Validation failed',
    details: errors
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendValidationError
};
