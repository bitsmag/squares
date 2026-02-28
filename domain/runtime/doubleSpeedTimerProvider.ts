export interface DoubleSpeedTimerProvider {
  scheduleDisable(callback: () => void, durationMs: number): void;
}

export const DefaultDoubleSpeedTimerProvider: DoubleSpeedTimerProvider = {
  scheduleDisable(callback: () => void, durationMs: number): void {
    setTimeout(callback, durationMs);
  },
};
