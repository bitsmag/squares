import Joi from 'joi';
import type { Request, Response, NextFunction } from 'express';
import { sanitize } from '../validation';
import type { ValidationErrorDetails } from '../validation';

type RequestSource = 'body' | 'params' | 'query';

export function validate<T>(source: RequestSource, schema: Joi.ObjectSchema<T>) {
  return function (req: Request, _res: Response, next: NextFunction) {
    const target = (req as Record<RequestSource, unknown>)[source] ?? {};
    const validationResult: Joi.ValidationResult<T> = schema.validate(target, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (validationResult.error) {
      const details = validationResult.error.details.map((d) => ({
        message: d.message,
        path: d.path,
      }));
      // Log HTTP validation errors for easier debugging
      console.error('[httpValidationMiddleware] Invalid request parameters', {
        method: req.method,
        url: req.originalUrl ?? req.url,
        source,
        errors: details,
        payload: target,
      });
      const validationError = new Error('invalidRequestParameters') as Error & {
        status: number;
        userMessage: string;
        details: ValidationErrorDetails[];
      };
      validationError.status = 400;
      validationError.userMessage = 'Invalid request parameters.';
      validationError.details = details;
      return next(validationError);
    }

    const value: T = validationResult.value;
    (req as Record<RequestSource, unknown>)[source] = sanitize<T>(value);
    return next();
  };
}
