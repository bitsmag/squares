import type { Request, Response, NextFunction } from 'express';

type ErrorLike = {
  status?: unknown;
  userMessage?: unknown;
  context?: unknown;
  stack?: unknown;
  message?: unknown;
};

function isErrorLike(err: unknown): err is ErrorLike {
  return typeof err === 'object' && err !== null;
}

function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const context = isErrorLike(err) && typeof err.context === 'string' ? err.context : 'server';
  const stack = isErrorLike(err) && typeof err.stack === 'string' ? err.stack : undefined;
  console.error('Error (%s):', context, stack ?? err);

  if (req.originalUrl && req.originalUrl.startsWith('/')) {
    if (isErrorLike(err) && err.message === 'matchNotFound') {
      res.status(404).render('error.html', {
        errorMessage: 'The match you are looking for was not found.',
      });
      return;
    }
  }

  const statusCode = isErrorLike(err) && typeof err.status === 'number' ? err.status : 500;
  const userMessage =
    isErrorLike(err) && typeof err.userMessage === 'string'
      ? err.userMessage
      : 'There was an unknown issue - please try again.';

  if (req.accepts && req.accepts('html')) {
    res.status(statusCode).render('error.html', { errorMessage: userMessage });
    return;
  }

  res.status(statusCode).json({ error: userMessage || 'Internal Server Error' });
}

export default errorHandler;
