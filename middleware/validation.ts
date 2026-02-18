import Joi from 'joi';
import xss from 'xss';

// Shared schemas
export const schemas = {
  createMatchParams: Joi.object({
    playerName: Joi.string().alphanum().min(1).max(12).required(),
  }),
  matchRouteParams: Joi.object({
    matchCreatorFlag: Joi.string().valid('t', 'f').required(),
    matchId: Joi.string().alphanum().min(1).required(),
    playerName: Joi.string().alphanum().min(1).max(12).required(),
  }),
  socketConnectionInfoCreate: Joi.object({
    matchId: Joi.string().alphanum().min(1).required(),
  }),
  socketConnectionInfoMatch: Joi.object({
    matchId: Joi.string().alphanum().min(1).required(),
    playerName: Joi.string().alphanum().min(1).max(12).required(),
  }),
};

function sanitize(obj: any): any {
  if (obj == null) return obj;
  if (typeof obj === 'string') return xss(obj);
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (typeof obj === 'object') {
    const out: any = {};
    Object.keys(obj).forEach((k) => {
      out[k] = sanitize(obj[k]);
    });
    return out;
  }
  return obj;
}

export function validate(source: 'body' | 'params' | 'query', schema: Joi.ObjectSchema<any>) {
  return function (req: any, _res: any, next: any) {
    const target = req[source] || {};
    const { error, value } = schema.validate(target, { abortEarly: false, stripUnknown: true });
    if (error) {
      const details = error.details.map((d) => ({ message: d.message, path: d.path }));
      const e: any = new Error('invalidRequestParameters');
      e.status = 400;
      e.userMessage = 'Invalid request parameters.';
      e.details = details;
      return next(e);
    }
    req[source] = sanitize(value);
    return next();
  };
}

export function validateSocketPayload(schema: Joi.ObjectSchema<any>, payload: any) {
  const { error, value } = schema.validate(payload, { abortEarly: false, stripUnknown: true });
  if (error) {
    return {
      valid: false,
      errors: error.details.map((d) => ({ message: d.message, path: d.path })),
    };
  }
  return { valid: true, value: sanitize(value) };
}

export default { schemas, validate, validateSocketPayload };
