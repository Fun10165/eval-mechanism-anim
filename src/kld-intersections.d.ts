declare module 'kld-intersections' {
  export interface Point {
    x: number
    y: number
  }

  export interface IntersectionResult {
    points: Point[]
  }

  export class ShapeInfo {
    static path(d: string): unknown
    static rectangle(x: number, y: number, w: number, h: number): unknown
  }

  export class Intersection {
    static intersect(a: unknown, b: unknown): IntersectionResult
  }
}
