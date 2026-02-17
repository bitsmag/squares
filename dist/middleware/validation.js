"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemas = void 0;
exports.validate = validate;
exports.validateSocketPayload = validateSocketPayload;
const joi_1 = __importDefault(require("joi"));
const xss_1 = __importDefault(require("xss"));
// Shared schemas
exports.schemas = {
    createMatchParams: joi_1.default.object({
        playerName: joi_1.default.string().alphanum().min(1).max(12).required(),
    }),
    matchRouteParams: joi_1.default.object({
        matchCreatorFlag: joi_1.default.string().valid('t', 'f').required(),
        matchId: joi_1.default.string().alphanum().min(1).required(),
        playerName: joi_1.default.string().alphanum().min(1).max(12).required(),
    }),
    socketConnectionInfoCreate: joi_1.default.object({
        matchId: joi_1.default.string().alphanum().min(1).required(),
    }),
    socketConnectionInfoMatch: joi_1.default.object({
        matchId: joi_1.default.string().alphanum().min(1).required(),
        playerName: joi_1.default.string().alphanum().min(1).max(12).required(),
    }),
};
function sanitize(obj) {
    if (obj == null)
        return obj;
    if (typeof obj === 'string')
        return (0, xss_1.default)(obj);
    if (Array.isArray(obj))
        return obj.map(sanitize);
    if (typeof obj === 'object') {
        const out = {};
        Object.keys(obj).forEach((k) => {
            out[k] = sanitize(obj[k]);
        });
        return out;
    }
    return obj;
}
function validate(source, schema) {
    return function (req, _res, next) {
        const target = req[source] || {};
        const { error, value } = schema.validate(target, { abortEarly: false, stripUnknown: true });
        if (error) {
            const details = error.details.map((d) => ({ message: d.message, path: d.path }));
            const e = new Error('invalidRequestParameters');
            e.status = 400;
            e.userMessage = 'Invalid request parameters.';
            e.details = details;
            return next(e);
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
    return { valid: true, value: sanitize(value) };
}
module.exports = { schemas: exports.schemas, validate, validateSocketPayload };
