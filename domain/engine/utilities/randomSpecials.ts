import type { Match } from '../../models/match';

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
  if (doubleSpeedChance < 0.02) {
    specials.doubleSpeed.push(randomDoubleSpeedSquare);
  }

  const getPointsChance = Math.random();
  if (getPointsChance < 0.028) {
    specials.getPoints.push(randomGetPointsSquare);
  }

  return specials;
}
