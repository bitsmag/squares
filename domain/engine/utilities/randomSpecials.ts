import type { Match } from '../../models/match';

// Probabilities for spawning specials per tick.
const DOUBLE_SPEED_PROBABILITY = 0.02; // 2%
const GET_POINTS_PROBABILITY = 0.028; // 2.8%

export function getSpecials(match: Match): { doubleSpeed: number[]; getPoints: number[] } {
  const specials = { doubleSpeed: [] as number[], getPoints: [] as number[] };

  const maxIndex = match.board.squares.length;
  if (maxIndex === 0) return specials;

  let randomDoubleSpeedSquare = 0;
  let randomGetPointsSquare = 0;
  while (randomDoubleSpeedSquare === randomGetPointsSquare) {
    randomDoubleSpeedSquare = Math.floor(Math.random() * maxIndex);
    randomGetPointsSquare = Math.floor(Math.random() * maxIndex);
  }

  const doubleSpeedChance = Math.random();
  if (doubleSpeedChance < DOUBLE_SPEED_PROBABILITY) {
    specials.doubleSpeed.push(randomDoubleSpeedSquare);
  }

  const getPointsChance = Math.random();
  if (getPointsChance < GET_POINTS_PROBABILITY) {
    specials.getPoints.push(randomGetPointsSquare);
  }

  return specials;
}
