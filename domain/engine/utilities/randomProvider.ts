export interface RandomProvider {
  next(): number;
}

export const DefaultRandomProvider: RandomProvider = {
  next: () => Math.random(),
};
