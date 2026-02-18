import type { NextFunction, Request, Response } from 'express';
import { manager } from '../models/matchesManager';
import { Player } from '../models/player';

export type MatchRouteParams = { matchCreatorFlag: 't' | 'f'; matchId: string; playerName: string };

export function handleGetMatch(
  req: Request<MatchRouteParams>,
  res: Response,
  next: NextFunction
): void {
  const { matchCreatorFlag, matchId, playerName } = req.params;

  let matchObj;
  try {
    matchObj = manager.getMatch(matchId);
  } catch (err) {
    return next(err);
  }
  if (!matchObj) return next(new Error('matchNotFound'));

  if (matchCreatorFlag === 't') {
    if (!matchObj.isActive() && playerName === matchObj.getMatchCreator().getName()) {
      matchObj.setActive(true);
      res.render('match.html', { matchId: matchId, playerName: playerName });
      return;
    }
    const e: UserError = Object.assign(new Error('unknown'), {
      userMessage: 'There was an unknown issue - please try again.',
    });
    return next(e);
  }

  if (matchCreatorFlag === 'f') {
    try {
      new Player(playerName, matchObj, false);
      return res.render('match.html', { matchId: matchId, playerName: playerName });
    } catch (err) {
      const error = err as UserError;
      if (error && error.message === 'matchIsFull')
        error.userMessage = "Sorry, you're too late. The match is full already.";
      else if (error && error.message === 'matchIsActive')
        error.userMessage = "Sorry, you're too late. The match has already started.";
      else if (error && error.message === 'nameInUse')
        error.userMessage =
          'Sorry, it seems that your name is already used by another player. Please choose a diffrent name.';
      return next(error);
    }
  }

  const e: UserError = Object.assign(new Error('unknown'), {
    userMessage: 'There was an unknown issue - please try again.',
  });
  return next(e);
}

type UserError = Error & { userMessage?: string };
