/**
 * Computes and returns the angle at a specific point wrt. the given origin.
 * The angle is returned in radians and ranges from 0 to +2PI.
 * @param {Point} origin The given origin.
 * @param {Point} at The point for which to compute the angle.
 * @return {number} The computed angle.
 */
function angleFromOrigin(origin, at) {
  let angle = Math.atan2(at.y - origin.y, at.x - origin.x);

  if (angle < 0) {
    angle = 2 * Math.PI + angle;
  }

  return angle;
}

export class Point {
  /**
   * Constructs a new Point given an X and Y coordinate.
   * @param {number} x The X coordinate.
   * @param {number} y The Y coordinate.
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * Adds a given other point and returns the result.
   * @param {Point} other The given other point.
   * @return {Point} The resulting point.
   */
  add = (other) => new Point(this.x + other.x, this.y + other.y);

  /**
   * Subtracts a given other point and returns the result.
   * @param {Point} other The given other point.
   * @return {Point} The resulting point.
   */
  subtract = (other) => new Point(this.x - other.x, this.y - other.y);

  /**
   * Multiplies this point with the given multiplier and returns the result.
   * @param {number} multiplier The multiplication factor.
   * @return {Point} The resulting point.
   */
  times = (multiplier) => new Point(this.x * multiplier, this.y * multiplier);

  /**
   * Computes and returns the point's magnitude.
   * @return {number} The computed magnitude.
   */
  magnitude = () => Math.sqrt(this.x * this.x + this.y * this.y);

  /**
   * Rotates the point 90 degrees in clockwise direction and returns the
   * result.
   * @return {Point} The resulting point.
   */
  rotated90ClockWise = () => new Point(-this.y, this.x);

  /**
   * Tests if this point and the given other point are equal in terms of
   * coordinates. Note that they are required to be exactly equal in order
   * for them to be considered equal.
   * @param {Point} other The given other point.
   * @return {boolean} True if equal, false otherwise.
   */
  equals = (other) => this.x === other.x && this.y === other.y;

  /**
   * Computes and returns the normalized version of this point.
   * @return {Point} The normalized point.
   */
  normalized = () => {
    const magnitude = this.magnitude();
    return new Point(this.x / magnitude, this.y / magnitude);
  };
}

export class Line {
  /**
   * Constructs a new Line given a begin and end point.
   * @param {Point} begin The given begin point.
   * @param {Point} end The given end point.
   */
  constructor(begin, end) {
    this.begin = begin;
    this.end = end;
  }

  /**
   * Computes and returns the center point of the line.
   * @return {Point} The center point.
   */
  center = () => {
    return this.begin.add(
      this.end
        .subtract(this.begin)
        .normalized()
        .times(0.5 * this.length())
    );
  };

  /**
   * Computes and returns the length of the line.
   * @return {number} The length.
   */
  length = () => this.end.subtract(this.begin).magnitude();

  /**
   * Computes and returns a unit vector (point) in direction of the line's end
   * point.
   * @return {Point} The computed unit vector (point).
   */
  unit = () => this.end.subtract(this.begin).normalized();

  /**
   * Computes and returns the point at which this line and a given other line
   * would intersect, if any. If no such intersection can be computed an
   * exception is thrown. The returned point is the point where they would
   * intersect if they don't actually intersect as of right now.
   * @param {Line} other The given other line.
   * @return {Point} The point of intersection.
   */
  intersection = (other) => {
    // source:
    // https://dirask.com/posts/JavaScript-how-to-calculate-intersection-point-of-two-lines-for-given-4-points-VjvnAj

    const p1 = this.begin;
    const p2 = this.end;
    const p3 = other.begin;
    const p4 = other.end;

    // down part of intersection point formula
    const d1 = (p1.x - p2.x) * (p3.y - p4.y); // (x1 - x2) * (y3 - y4)
    const d2 = (p1.y - p2.y) * (p3.x - p4.x); // (y1 - y2) * (x3 - x4)
    const d = d1 - d2;

    if (d === 0) {
      throw new Error('Number of intersection points is zero or infinity.');
    }

    // upper part of intersection point formula
    const u1 = p1.x * p2.y - p1.y * p2.x; // (x1 * y2 - y1 * x2)
    const u4 = p3.x * p4.y - p3.y * p4.x; // (x3 * y4 - y3 * x4)

    const u2x = p3.x - p4.x; // (x3 - x4)
    const u3x = p1.x - p2.x; // (x1 - x2)
    const u2y = p3.y - p4.y; // (y3 - y4)
    const u3y = p1.y - p2.y; // (y1 - y2)

    // intersection point formula
    const px = (u1 * u2x - u3x * u4) / d;
    const py = (u1 * u2y - u3y * u4) / d;

    return new Point(px, py);
  };
}

export class CircularArc {
  /**
   * Constructs a circular arc given a begin, middle and end point.
   * @param {Point} begin The given begin point.
   * @param {Point} middle The given middle point.
   * @param {Point} end The given end point.
   */
  constructor(begin, middle, end) {
    this.begin = begin;
    this.middle = middle;
    this.end = end;
  }

  /**
   * Computes and returns everything necessary in order to draw this arc.
   * @return {{middle: Point, startAngle: number, centerOfCircle: Point, clockwise: boolean, endAngle: number, end: Point, radius: number, begin: Point}}
   */
  drawable = () => {
    const center = this.centerOfCircle();
    const angles = this.angles();

    return {
      begin: this.begin,
      middle: this.middle,
      end: this.end,
      centerOfCircle: center,
      radius: this.begin.subtract(center).magnitude(),
      startAngle: angles.startAngle,
      endAngle: angles.endAngle,
      clockwise: this.clockwise(angles),
    };
  };

  /**
   * Returns if the arc concerns a full circle.
   * @return {boolean} True if so, false otherwise.
   */
  fullCircle = () => this.begin.equals(this.end);

  /**
   * Computes and returns if the arc moves in clockwise direction.
   * @param {{startAngle: number, endAngle: number, middleAngle: number}} angles The begin, middle and end angles.
   * @return {boolean} True if clockwise, false otherwise.
   */
  clockwise = (angles) => {
    // compute the clockwise distance from start to middle and from start to end
    const startToMiddle =
      (angles.middleAngle - angles.startAngle + 2 * Math.PI) % (2 * Math.PI);
    const startToEnd =
      (angles.endAngle - angles.startAngle + 2 * Math.PI) % (2 * Math.PI);

    // clockwise if in clockwise direction we reach middle before we reach end
    return startToMiddle < startToEnd;
  };

  /**
   * Computes and returns the angles at all three positions with the center
   * of the circle as their origin.
   * @return {{startAngle: number, endAngle: number, middleAngle: number}} The computed angles.
   */
  angles = () => {
    if (this.fullCircle()) {
      return {
        startAngle: 0,
        middleAngle: Math.PI,
        endAngle: 2 * Math.PI,
      };
    }

    const center = this.centerOfCircle();

    return {
      startAngle: angleFromOrigin(center, this.begin),
      middleAngle: angleFromOrigin(center, this.middle),
      endAngle: angleFromOrigin(center, this.end),
    };
  };

  /**
   * Computes and returns the center of the circle.
   * @return {Point} The center of the circle.
   */
  centerOfCircle = () => {
    if (this.fullCircle()) {
      // three points represent a full circle
      return new Line(this.begin, this.middle).center();
    }

    // no full circle
    const l1 = new Line(this.begin, this.middle);
    const l2 = new Line(this.middle, this.end);

    const perpendicularL1 = new Line(
      l1.center(),
      l1.center().add(l1.unit().rotated90ClockWise())
    );

    const perpendicularL2 = new Line(
      l2.center(),
      l2.center().add(l2.unit().rotated90ClockWise())
    );

    return perpendicularL1.intersection(perpendicularL2);
  };
}
