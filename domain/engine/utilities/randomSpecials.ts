import type { Match } from '../../entities/match';
import type { RandomProvider } from './randomProvider';
import { DefaultRandomProvider } from './randomProvider';

// Probabilities for spawning specials per tick.
const DOUBLE_SPEED_PROBABILITY = 0.02; // 2%
const GET_POINTS_PROBABILITY = 0.0; // 0%

export function getSpecials(
  match: Match,
  random: RandomProvider = DefaultRandomProvider
): { doubleSpeed: number[]; getPoints: number[] } {
  const specials = { doubleSpeed: [] as number[], getPoints: [] as number[] };

  const maxIndex = match.board.squares.length;
  if (maxIndex === 0) return specials;

  let randomDoubleSpeedSquare = 0;
  let randomGetPointsSquare = 0;
  while (randomDoubleSpeedSquare === randomGetPointsSquare) {
    randomDoubleSpeedSquare = Math.floor(random.next() * maxIndex);
    randomGetPointsSquare = Math.floor(random.next() * maxIndex);
  }

  const doubleSpeedChance = random.next();
  if (doubleSpeedChance < DOUBLE_SPEED_PROBABILITY) {
    specials.doubleSpeed.push(randomDoubleSpeedSquare);
  }

  const getPointsChance = random.next();
  if (getPointsChance < GET_POINTS_PROBABILITY) {
    specials.getPoints.push(randomGetPointsSquare);
  }

  return specials;
}
