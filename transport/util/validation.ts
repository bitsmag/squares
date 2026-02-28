import Joi from 'joi';
import xss from 'xss';
import type { CreateMatchLobbyHostRequestDTO, CreateMatchLobbyGuestRequestDTO } from '../../shared/dto/http/createMatchLobbyHttpDtos';
import type { GetMatchRequestDTO } from '../../shared/dto/http/matchHttpDtos';
import type { RegisterPlayerLobbyDTO } from '../../shared/dto/socket/incoming/createMatchLobbySocketDtos';
import type { RegisterPlayerAndStartMatchWhenReadyDTO } from '../../shared/dto/socket/incoming/matchSocketDtos';

export type CreateMatchLobbyHostParams = CreateMatchLobbyHostRequestDTO;
export type CreateMatchLobbyGuestParams = CreateMatchLobbyGuestRequestDTO;
export type MatchRouteParams = GetMatchRequestDTO;
export type RegisterPlayerLobbyParams = RegisterPlayerLobbyDTO;
export type RegisterPlayerAndStartMatchWhenReadyParams = RegisterPlayerAndStartMatchWhenReadyDTO;
export type MatchStartInitiationParams = { matchId: string };

// Shared schemas
export const schemas = {
  createMatchLobbyHostParams: Joi.object<CreateMatchLobbyHostParams>({
    playerName: Joi.string().alphanum().min(1).max(12).required(),
  }),
  createMatchLobbyGuestParams: Joi.object<CreateMatchLobbyGuestParams>({
    playerName: Joi.string().alphanum().min(1).max(12).required(),
    matchId: Joi.string().alphanum().min(1).required(),
  }),
  matchRouteParams: Joi.object<MatchRouteParams>({
    matchId: Joi.string().alphanum().min(1).required(),
    playerId: Joi.string().min(1).max(64).required(),
  }),
  registerPlayerLobbyParams: Joi.object<RegisterPlayerLobbyParams>({
    matchId: Joi.string().alphanum().min(1).required(),
    playerId: Joi.string().min(1).max(64).required(),
    playerName: Joi.string().alphanum().min(1).max(12).required(),
    isHost: Joi.boolean().required(),
  }),
  registerPlayerAndStartMatchWhenReadyParams: Joi.object<RegisterPlayerAndStartMatchWhenReadyParams>({
    matchId: Joi.string().alphanum().min(1).required(),
    playerId: Joi.string().min(1).max(64).required(),
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
export type ValidationResult<T> = { valid: true; value: T } | { valid: false; errors: ValidationErrorDetails[] };
