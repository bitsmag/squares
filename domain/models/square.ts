export class Square {
  id: number;
  edgesTo: number[];
  position: { x: number; y: number };
  color: string;
  doubleSpeedSpecial: boolean;
  getPointsSpecial: boolean;
  dfsVisited: boolean;

  constructor(squareId: number, edgesTo: number[], position: { x: number; y: number }) {
    this.id = squareId;
    this.edgesTo = edgesTo;
    this.position = position;
    this.color = '';
    this.doubleSpeedSpecial = false;
    this.getPointsSpecial = false;
    this.dfsVisited = false;
  }

  getId(): number {
    return this.id;
  }

  getEdgesTo(): number[] {
    return this.edgesTo;
  }

  getPosition(): { x: number; y: number } {
    return this.position;
  }

  getColor(): string {
    return this.color;
  }

  getDoubleSpeedSpecial(): boolean {
    return this.doubleSpeedSpecial;
  }

  getGetPointsSpecial(): boolean {
    return this.getPointsSpecial;
  }

  isDfsVisited(): boolean {
    return this.dfsVisited;
  }

  setColor(color: string): void {
    this.color = color;
  }

  setDoubleSpeedSpecial(doubleSpeedSpecial: boolean): void {
    this.doubleSpeedSpecial = doubleSpeedSpecial;
  }

  setGetPointsSpecial(getPointsSpecial: boolean): void {
    this.getPointsSpecial = getPointsSpecial;
  }

  setDfsVisited(visited: boolean): void {
    this.dfsVisited = visited;
  }
}
