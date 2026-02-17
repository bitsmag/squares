"use strict";
const Joi = require('joi');
const xss = require('xss');

// Shared schemas
const schemas = {
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

function validate(source, schema) {
  // source: 'body' | 'params' | 'query'
  return function (req, res, next) {
    const target = req[source] || {};
    const { error, value } = schema.validate(target, { abortEarly: false, stripUnknown: true });
    if (error) {
      const details = error.details.map((d) => ({ message: d.message, path: d.path }));
      return res.status(400).render('error.html', {
        errorMessage: 'Invalid request parameters.',
        errorDetails: details,
      });
    }
    // Sanitize any string fields in the validated payload to prevent XSS
    function sanitize(obj) {
      if (obj == null) return obj;
      if (typeof obj === 'string') return xss(obj);
      if (Array.isArray(obj)) return obj.map(sanitize);
      if (typeof obj === 'object') {
        const out = {};
        Object.keys(obj).forEach((k) => {
          out[k] = sanitize(obj[k]);
        });
        return out;
      }
      return obj;
    }

    req[source] = sanitize(value);
    return next();
  };
}

function validateSocketPayload(schema, payload) {
  const { error, value } = schema.validate(payload, { abortEarly: false, stripUnknown: true });
  if (error) {
    return { valid: false, errors: error.details.map((d) => ({ message: d.message, path: d.path })) };
  }
  // sanitize the validated payload before returning
  function sanitize(obj) {
    if (obj == null) return obj;
    if (typeof obj === 'string') return xss(obj);
    if (Array.isArray(obj)) return obj.map(sanitize);
    if (typeof obj === 'object') {
      const out = {};
      Object.keys(obj).forEach((k) => {
        out[k] = sanitize(obj[k]);
      });
      return out;
    }
    return obj;
  }

  return { valid: true, value: sanitize(value) };
}

module.exports = { schemas, validate, validateSocketPayload };
