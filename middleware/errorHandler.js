"use strict";
// Centralized Express error handler
module.exports = function (err, req, res, _next) {
  // Log with context
  const context = err.context || 'server';
  console.error('Error (%s):', context, err && err.stack ? err.stack : err);

  // Map some known internal error messages to user-friendly output
  if (req && req.originalUrl && req.originalUrl.startsWith('/')) {
    if (err && err.message === 'matchNotFound') {
      return res.status(404).render(__dirname + '/../views/error.html', {
        errorMessage: 'The match you are looking for was not found.',
      });
    }
  }

  // For HTML pages render a generic error page
  if (req && req.accepts && req.accepts('html')) {
    return res.status(err.status || 500).render(__dirname + '/../views/error.html', {
      errorMessage: err.userMessage || 'There was an unknown issue - please try again.',
    });
  }

  // Default JSON response (for APIs)
  res.status(err.status || 500).json({ error: err.userMessage || 'Internal Server Error' });
};
