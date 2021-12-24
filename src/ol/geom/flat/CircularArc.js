/**
 * Computes and returns the angle at a specific vector wrt. the given origin.
 * The angle is returned in radians and ranges from 0 to +2PI.
 * @param {Vector2} origin The given origin.
 * @param {Vector2} at The vector for which to compute the angle.
 * @return {number} The computed angle.
 */
function angleFromOrigin(origin, at) {
  let angle = Math.atan2(at.y - origin.y, at.x - origin.x);

  if (angle < 0) {
    angle = 2 * Math.PI + angle;
  }

  return angle;
}

export class Vector2 {
  /**
   * Constructs a new Vector2 given an X and Y coordinate.
   * @param {number} x The X coordinate.
   * @param {number} y The Y coordinate.
   */
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * Adds a given other vector and returns the result.
   * @param {Vector2} other The given other vector.
   * @return {Vector2} The resulting vector.
   */
  add = (other) => new Vector2(this.x + other.x, this.y + other.y);

  /**
   * Subtracts a given other vector and returns the result.
   * @param {Vector2} other The given other vector.
   * @return {Vector2} The resulting vector.
   */
  subtract = (other) => new Vector2(this.x - other.x, this.y - other.y);

  /**
   * Multiplies this vector with the given multiplier and returns the result.
   * @param {number} multiplier The multiplication factor.
   * @return {Vector2} The resulting vector.
   */
  times = (multiplier) => new Vector2(this.x * multiplier, this.y * multiplier);

  /**
   * Computes and returns the vector's magnitude.
   * @return {number} The computed magnitude.
   */
  magnitude = () => Math.sqrt(this.x * this.x + this.y * this.y);

  /**
   * Rotates the vector 90 degrees around the origin in clockwise direction
   * and returns the result.
   * @return {Vector2} The resulting vector.
   */
  rotated90ClockWise = () => new Vector2(-this.y, this.x);

  /**
   * Computes and returns the distance from this vector to a given other.
   * @param {Vector2} other The given other vector.
   * @return {number} The computed distance.
   */
  distance = (other) => this.subtract(other).magnitude();

  /**
   * Tests if this vector and the given other vector are equal. They are
   * considered equal if the distance between them is smaller than 1e-6.
   * @param {Vector2} other The given other vector.
   * @return {boolean} True if equal, false otherwise.
   */
  equals = (other) => this.distance(other) < 1e-6;

  /**
   * Computes and returns the normalized version of this vector.
   * @return {Vector2} The normalized vector.
   */
  normalized = () => {
    const magnitude = this.magnitude();
    return new Vector2(this.x / magnitude, this.y / magnitude);
  };
}

export class Line {
  /**
   * Constructs a new Line given a begin and end vector.
   * @param {Vector2} begin The given begin vector.
   * @param {Vector2} end The given end vector.
   */
  constructor(begin, end) {
    this.begin = begin;
    this.end = end;
  }

  /**
   * Computes and returns the center of the line.
   * @return {Vector2} The center.
   */
  center = () =>
    new Vector2(
      (this.begin.x + this.end.x) / 2.0,
      (this.begin.y + this.end.y) / 2.0
    );

  /**
   * Computes and returns the length of the line.
   * @return {number} The length.
   */
  length = () => this.end.subtract(this.begin).magnitude();

  /**
   * Computes and returns a unit vector in direction of the line's end.
   * @return {Vector2} The computed unit vector.
   */
  unit = () => this.end.subtract(this.begin).normalized();

  /**
   * Computes and returns the vector at which this line and a given other line
   * would intersect, if any. If no such intersection can be computed an
   * exception is thrown. The returned vector is the vector where they would
   * intersect if they don't actually intersect as of right now.
   * @param {Line} other The given other line.
   * @return {Vector2} The vector of intersection.
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

    return new Vector2(px, py);
  };
}

export class CircularArc {
  /**
   * Constructs a circular arc given a begin, middle and end point.
   * @param {Vector2} begin The given begin point.
   * @param {Vector2} middle The given middle point.
   * @param {Vector2} end The given end point.
   */
  constructor(
    begin = new Vector2(),
    middle = new Vector2(),
    end = new Vector2()
  ) {
    this.begin = begin;
    this.middle = middle;
    this.end = end;
  }

  /**
   * Computes and returns everything necessary in order to draw this arc.
   * @return {{middle: Vector2, startAngle: number, centerOfCircle: Vector2, clockwise: boolean, endAngle: number, end: Vector2, radius: number, begin: Vector2}}
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
   * @return {Vector2} The center of the circle.
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
