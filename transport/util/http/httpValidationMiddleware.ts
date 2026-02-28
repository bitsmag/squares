import Joi from 'joi';
import type { RequestHandler } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import { sanitize } from '../validation';
import type { ValidationErrorDetails } from '../validation';

type RequestSource = 'body' | 'params' | 'query';

export function validate<P = import('express-serve-static-core').ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = ParsedQs>(
  source: RequestSource,
  schema: Joi.ObjectSchema<any>
): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
  return (req, _res, next) => {
    const target = (req as unknown as Record<RequestSource, unknown>)[source] ?? {};
    const { error, value } = schema.validate(target, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      const details = error.details.map((d) => ({
        message: d.message,
        path: d.path,
      }));
      // Log HTTP validation errors for easier debugging
      console.error('[httpValidationMiddleware] Invalid request parameters', {
        method: req.method,
        url: (req as any).originalUrl ?? (req as any).url,
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

    (req as unknown as Record<RequestSource, unknown>)[source] = sanitize(value);
    return next();
  };
}
