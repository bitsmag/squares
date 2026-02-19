import Joi from 'joi';
import xss from 'xss';
import type { Request, Response, NextFunction } from 'express';

export type CreateMatchParams = { playerName: string };
export type CreateMatchLobbyGuestParams = { playerName: string; matchId: string };
export type MatchRouteParams = {
  matchCreatorFlag: 't' | 'f';
  matchId: string;
  playerName: string;
};
export type RegisterPlayerLobbyParams = { matchId: string; playerName: string, isHost: boolean };
export type RegisterPlayerMatchParams = { matchId: string; playerName: string };
export type MatchStartInitiationParams = { matchId: string };

// Shared schemas
export const schemas = {
  createMatchParams: Joi.object<CreateMatchParams>({
    playerName: Joi.string().alphanum().min(1).max(12).required(),
  }),
  createMatchLobbyGuestParams: Joi.object<CreateMatchLobbyGuestParams>({
    playerName: Joi.string().alphanum().min(1).max(12).required(),
    matchId: Joi.string().alphanum().min(1).required()
  }),
  matchRouteParams: Joi.object<MatchRouteParams>({
    matchCreatorFlag: Joi.string().valid('t', 'f').required(),
    matchId: Joi.string().alphanum().min(1).required(),
    playerName: Joi.string().alphanum().min(1).max(12).required(),
  }),
  registerPlayerLobbyParams: Joi.object<RegisterPlayerLobbyParams>({
    matchId: Joi.string().alphanum().min(1).required(),
    playerName: Joi.string().alphanum().min(1).max(12).required(),
    isHost: Joi.boolean().required(),
  }),
  registerPlayerMatchParams: Joi.object<RegisterPlayerMatchParams>({
    matchId: Joi.string().alphanum().min(1).required(),
    playerName: Joi.string().alphanum().min(1).max(12).required(),
  }),
    matchStartInitiationParams: Joi.object<MatchStartInitiationParams>({
    matchId: Joi.string().alphanum().min(1).required()
  }),
};

function sanitizeValue(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === 'string') return xss(value);
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item));
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    Object.keys(value as Record<string, unknown>).forEach((k) => {
      out[k] = sanitizeValue((value as Record<string, unknown>)[k]);
    });
    return out;
  }
  return value;
}

function sanitize<T>(obj: T): T {
  return sanitizeValue(obj) as T;
}

type RequestSource = 'body' | 'params' | 'query';

type ValidationErrorDetails = { message: string; path: (string | number)[] };
type ValidationResult<T> =
  | { valid: true; value: T }
  | { valid: false; errors: ValidationErrorDetails[] };

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

export function validateSocketPayload<T>(
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

export default { schemas, validate, validateSocketPayload };
