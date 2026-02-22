import Joi from 'joi';
import { sanitize } from '../validation';
import type { ValidationResult } from '../validation';

type SchemaMap = Record<string, Joi.ObjectSchema>;

function validateSocketPayload<T>(
  schema: Joi.ObjectSchema<T>,
  payload: unknown
): ValidationResult<T> {
  const validationResult: Joi.ValidationResult<T> = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (validationResult.error) {
    return {
      valid: false,
      errors: validationResult.error.details.map((d) => ({ message: d.message, path: d.path })),
    };
  }
  const value: T = validationResult.value;
  return { valid: true, value: sanitize<T>(value) };
}

export function socketValidationMiddleware(schemas: SchemaMap) {
  return (packet: [string, ...unknown[]], next: (err?: Error) => void) => {
    const [event] = packet;
    const schema = schemas[event];
    if (!schema) return next();

    const result = validateSocketPayload(schema, packet[1] || {});
    if (!result.valid) {
      return next(new Error(`Invalid ${event} payload`));
    }
    packet[1] = result.value;
    next();
  };
}
