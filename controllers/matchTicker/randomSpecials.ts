export function getSpecials(match: any): { doubleSpeed: number[]; getPoints: number[] } {
  const specials = { doubleSpeed: [] as number[], getPoints: [] as number[] };

  let randomDoubleSpeedSquare = 0;
  let randomGetPointsSquare = 0;
  while (randomDoubleSpeedSquare === randomGetPointsSquare) {
    randomDoubleSpeedSquare = Math.floor(Math.random() * match.getBoard().getSquares().length - 1 + 1);
    randomGetPointsSquare = Math.floor(Math.random() * match.getBoard().getSquares().length - 1 + 1);
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

// CommonJS compatibility
module.exports = { getSpecials } as any;
