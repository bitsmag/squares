export interface ClockHandle {
  clear(): void;
}

export interface ClockProvider {
  setInterval(callback: () => void, ms: number): ClockHandle;
}

class SystemClockHandle implements ClockHandle {
  private readonly id: ReturnType<typeof setInterval>;

  constructor(id: ReturnType<typeof setInterval>) {
    this.id = id;
  }

  clear(): void {
    clearInterval(this.id);
  }
}

export const DefaultClockProvider: ClockProvider = {
  setInterval(callback: () => void, ms: number): ClockHandle {
    const id = setInterval(callback, ms);
    return new SystemClockHandle(id);
  },
};
