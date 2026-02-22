import Joi from 'joi';
import xss from 'xss';

export type CreateMatchParams = { playerName: string };
export type CreateMatchLobbyGuestParams = { playerName: string; matchId: string };
export type MatchRouteParams = {
  matchCreatorFlag: 't' | 'f';
  matchId: string;
  playerName: string;
};
export type RegisterPlayerLobbyParams = { matchId: string; playerName: string; isHost: boolean };
export type RegisterPlayerMatchParams = { matchId: string; playerName: string };
export type MatchStartInitiationParams = { matchId: string };

// Shared schemas
export const schemas = {
  createMatchParams: Joi.object<CreateMatchParams>({
    playerName: Joi.string().alphanum().min(1).max(12).required(),
  }),
  createMatchLobbyGuestParams: Joi.object<CreateMatchLobbyGuestParams>({
    playerName: Joi.string().alphanum().min(1).max(12).required(),
    matchId: Joi.string().alphanum().min(1).required(),
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
  registerPlayerAndStartMatchWhenReadyParams: Joi.object<RegisterPlayerMatchParams>({
    matchId: Joi.string().alphanum().min(1).required(),
    playerName: Joi.string().alphanum().min(1).max(12).required(),
  }),
  matchStartInitiationParams: Joi.object<MatchStartInitiationParams>({
    matchId: Joi.string().alphanum().min(1).required(),
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

export function sanitize<T>(obj: T): T {
  return sanitizeValue(obj) as T;
}

export type ValidationErrorDetails = { message: string; path: (string | number)[] };
export type ValidationResult<T> =
  | { valid: true; value: T }
  | { valid: false; errors: ValidationErrorDetails[] };
