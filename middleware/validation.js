"use strict";
const Joi = require('joi');

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
      return res.status(400).render(__dirname + '/../views/error.html', {
        errorMessage: 'Invalid request parameters.',
        errorDetails: details,
      });
    }
    req[source] = value;
    return next();
  };
}

function validateSocketPayload(schema, payload) {
  const { error, value } = schema.validate(payload, { abortEarly: false, stripUnknown: true });
  if (error) {
    return { valid: false, errors: error.details.map((d) => ({ message: d.message, path: d.path })) };
  }
  return { valid: true, value: value };
}

module.exports = { schemas, validate, validateSocketPayload };
