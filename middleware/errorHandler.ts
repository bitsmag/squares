// Centralized Express error handler
function errorHandler(err: any, req: any, res: any, _next: any) {
  const context = err.context || 'server';
  console.error('Error (%s):', context, err && err.stack ? err.stack : err);

  if (req && req.originalUrl && req.originalUrl.startsWith('/')) {
    if (err && err.message === 'matchNotFound') {
      return res.status(404).render('error.html', {
        errorMessage: 'The match you are looking for was not found.',
      });
    }
  }

  if (req && req.accepts && req.accepts('html')) {
    return res.status(err.status || 500).render('error.html', {
      errorMessage: err.userMessage || 'There was an unknown issue - please try again.',
    });
  }

  res.status(err.status || 500).json({ error: err.userMessage || 'Internal Server Error' });
}

export default errorHandler;
