import {assert} from 'chai';
import {
  boundingExtent,
  createEmpty,
  isEmpty,
} from '../../../../src/ol/extent.js';
import Circle from '../../../../src/ol/geom/Circle.js';
import LinearRing from '../../../../src/ol/geom/LinearRing.js';
import Polygon, {
  fromCircle,
  fromExtent,
} from '../../../../src/ol/geom/Polygon.js';

describe('ol/geom/Polygon.js', function () {
  it('cannot be constructed with a null geometry', function () {
    assert.throws(function () {
      return new Polygon(null);
    });
  });

  describe('construct empty', function () {
    let polygon;
    beforeEach(function () {
      polygon = new Polygon([]);
    });

    it('defaults to layout XY', function () {
      assert.strictEqual(polygon.getLayout(), 'XY');
    });

    it('has empty coordinates', function () {
      assert.isEmpty(polygon.getCoordinates());
    });

    it('has an empty extent', function () {
      assert.strictEqual(isEmpty(polygon.getExtent()), true);
    });

    it('has empty flat coordinates', function () {
      assert.isEmpty(polygon.getFlatCoordinates());
    });

    it('has stride the expected stride', function () {
      assert.strictEqual(polygon.getStride(), 2);
    });

    it('can append linear rings', function () {
      polygon.appendLinearRing(
        new LinearRing([
          [1, 2],
          [3, 4],
          [5, 6],
        ]),
      );
      assert.deepEqual(polygon.getCoordinates(), [
        [
          [1, 2],
          [3, 4],
          [5, 6],
        ],
      ]);
      polygon.appendLinearRing(
        new LinearRing([
          [7, 8],
          [9, 10],
          [11, 12],
        ]),
      );
      assert.deepEqual(polygon.getCoordinates(), [
        [
          [1, 2],
          [3, 4],
          [5, 6],
        ],
        [
          [7, 8],
          [9, 10],
          [11, 12],
        ],
      ]);
    });
  });

  describe('construct with 2D coordinates', function () {
    let outerRing, innerRing, polygon, flatCoordinates;
    let outsideOuter, inside, insideInner;
    beforeEach(function () {
      outerRing = [
        [0, 1],
        [1, 4],
        [4, 3],
        [3, 0],
      ];
      innerRing = [
        [2, 2],
        [3, 2],
        [3, 3],
        [2, 3],
      ];
      polygon = new Polygon([outerRing, innerRing]);
      flatCoordinates = [0, 1, 1, 4, 4, 3, 3, 0, 2, 2, 3, 2, 3, 3, 2, 3];
      outsideOuter = [0, 4];
      inside = [1.5, 1.5];
      insideInner = [2.5, 3.5];
    });

    it('has the expected layout', function () {
      assert.strictEqual(polygon.getLayout(), 'XY');
    });

    it('has the expected coordinates', function () {
      assert.deepEqual(polygon.getCoordinates(), [outerRing, innerRing]);
    });

    it('has the expected extent', function () {
      assert.deepEqual(polygon.getExtent(), [0, 0, 4, 4]);
    });

    it('has the expected flat coordinates', function () {
      assert.deepEqual(polygon.getFlatCoordinates(), flatCoordinates);
    });

    it('has stride the expected stride', function () {
      assert.strictEqual(polygon.getStride(), 2);
    });

    it('can return individual rings', function () {
      assert.deepEqual(polygon.getLinearRing(0).getCoordinates(), outerRing);
      assert.deepEqual(polygon.getLinearRing(1).getCoordinates(), innerRing);
    });

    it('has the expected rings', function () {
      const linearRings = polygon.getLinearRings();
      assert.instanceOf(linearRings, Array);
      assert.lengthOf(linearRings, 2);
      assert.instanceOf(linearRings[0], LinearRing);
      assert.deepEqual(linearRings[0].getCoordinates(), outerRing);
      assert.instanceOf(linearRings[1], LinearRing);
      assert.deepEqual(linearRings[1].getCoordinates(), innerRing);
    });

    it('does not reverse any rings', function () {
      outerRing.reverse();
      innerRing.reverse();
      polygon = new Polygon([outerRing, innerRing]);
      const coordinates = polygon.getCoordinates();
      assert.deepEqual(coordinates[0], outerRing);
      assert.deepEqual(coordinates[1], innerRing);
    });

    it('does not contain outside coordinates', function () {
      assert.strictEqual(polygon.intersectsCoordinate(outsideOuter), false);
    });

    it('does contain inside coordinates', function () {
      assert.strictEqual(polygon.intersectsCoordinate(inside), true);
    });

    it('does not contain inside inner coordinates', function () {
      assert.strictEqual(polygon.intersectsCoordinate(insideInner), false);
    });

    describe('#getCoordinates()', function () {
      const cw = [
        [-180, -90],
        [-180, 90],
        [180, 90],
        [180, -90],
        [-180, -90],
      ];
      const ccw = [
        [-180, -90],
        [180, -90],
        [180, 90],
        [-180, 90],
        [-180, -90],
      ];
      const right = new Polygon([ccw, cw]);
      const left = new Polygon([cw, ccw]);

      it('returns coordinates as they were constructed', function () {
        assert.deepEqual(right.getCoordinates(), [ccw, cw]);
        assert.deepEqual(left.getCoordinates(), [cw, ccw]);
      });

      it('can return coordinates with right-hand orientation', function () {
        assert.deepEqual(right.getCoordinates(true), [ccw, cw]);
        assert.deepEqual(left.getCoordinates(true), [ccw, cw]);
      });

      it('can return coordinates with left-hand orientation', function () {
        assert.deepEqual(right.getCoordinates(false), [cw, ccw]);
        assert.deepEqual(left.getCoordinates(false), [cw, ccw]);
      });
    });

    describe('#getOrientedFlatCoordinates', function () {
      it('reverses the outer ring if necessary', function () {
        outerRing.reverse();
        polygon = new Polygon([outerRing, innerRing]);
        assert.deepEqual(polygon.getOrientedFlatCoordinates(), flatCoordinates);
      });

      it('reverses inner rings if necessary', function () {
        innerRing.reverse();
        polygon = new Polygon([outerRing, innerRing]);
        assert.deepEqual(polygon.getOrientedFlatCoordinates(), flatCoordinates);
      });

      it('reverses all rings if necessary', function () {
        outerRing.reverse();
        innerRing.reverse();
        polygon = new Polygon([outerRing, innerRing]);
        assert.deepEqual(polygon.getOrientedFlatCoordinates(), flatCoordinates);
      });
    });
  });

  describe('construct with 3D coordinates', function () {
    let outerRing, innerRing, polygon, flatCoordinates;
    let outsideOuter, inside, insideInner;
    beforeEach(function () {
      outerRing = [
        [0, 0, 1],
        [4, 4, 2],
        [4, 0, 3],
      ];
      innerRing = [
        [2, 1, 4],
        [3, 1, 5],
        [3, 2, 6],
      ];
      polygon = new Polygon([outerRing, innerRing]);
      flatCoordinates = [0, 0, 1, 4, 4, 2, 4, 0, 3, 2, 1, 4, 3, 1, 5, 3, 2, 6];
      outsideOuter = [1, 3];
      inside = [3.5, 0.5];
      insideInner = [2.9, 1.1];
    });

    it('has the expected layout', function () {
      assert.strictEqual(polygon.getLayout(), 'XYZ');
    });

    it('has the expected coordinates', function () {
      assert.deepEqual(polygon.getCoordinates(), [outerRing, innerRing]);
    });

    it('has the expected extent', function () {
      assert.deepEqual(polygon.getExtent(), [0, 0, 4, 4]);
    });

    it('has the expected flat coordinates', function () {
      assert.deepEqual(polygon.getFlatCoordinates(), flatCoordinates);
    });

    it('has stride the expected stride', function () {
      assert.strictEqual(polygon.getStride(), 3);
    });

    it('does not contain outside coordinates', function () {
      assert.strictEqual(polygon.intersectsCoordinate(outsideOuter), false);
    });

    it('does contain inside coordinates', function () {
      assert.strictEqual(polygon.intersectsCoordinate(inside), true);
    });

    it('does not contain inside inner coordinates', function () {
      assert.strictEqual(polygon.intersectsCoordinate(insideInner), false);
    });

    describe('#intersectsExtent', function () {
      it('does not intersect outside extent', function () {
        assert.strictEqual(
          polygon.intersectsExtent(boundingExtent([outsideOuter])),
          false,
        );
      });

      it('does intersect inside extent', function () {
        assert.strictEqual(
          polygon.intersectsExtent(boundingExtent([inside])),
          true,
        );
      });

      it('does intersect boundary extent', function () {
        const firstMidX = (outerRing[0][0] + outerRing[1][0]) / 2;
        const firstMidY = (outerRing[0][1] + outerRing[1][1]) / 2;

        assert.strictEqual(
          polygon.intersectsExtent(boundingExtent([[firstMidX, firstMidY]])),
          true,
        );
      });

      it('does not intersect extent fully contained by inner ring', function () {
        assert.strictEqual(
          polygon.intersectsExtent(boundingExtent([insideInner])),
          false,
        );
      });
    });

    describe('#getOrientedFlatCoordinates', function () {
      it('reverses the outer ring if necessary', function () {
        outerRing.reverse();
        polygon = new Polygon([outerRing, innerRing]);
        assert.deepEqual(polygon.getOrientedFlatCoordinates(), flatCoordinates);
      });

      it('reverses inner rings if necessary', function () {
        innerRing.reverse();
        polygon = new Polygon([outerRing, innerRing]);
        assert.deepEqual(polygon.getOrientedFlatCoordinates(), flatCoordinates);
      });

      it('reverses all rings if necessary', function () {
        outerRing.reverse();
        innerRing.reverse();
        polygon = new Polygon([outerRing, innerRing]);
        assert.deepEqual(polygon.getOrientedFlatCoordinates(), flatCoordinates);
      });
    });
  });

  describe('construct with 3D coordinates and layout XYM', function () {
    let outerRing, innerRing, polygon, flatCoordinates;
    let outsideOuter, inside, insideInner;
    beforeEach(function () {
      outerRing = [
        [0, 0, 1],
        [4, 4, 2],
        [4, 0, 3],
      ];
      innerRing = [
        [2, 1, 4],
        [3, 1, 5],
        [3, 2, 6],
      ];
      polygon = new Polygon([outerRing, innerRing], 'XYM');
      flatCoordinates = [0, 0, 1, 4, 4, 2, 4, 0, 3, 2, 1, 4, 3, 1, 5, 3, 2, 6];
      outsideOuter = [1, 3];
      inside = [3.5, 0.5];
      insideInner = [2.9, 1.1];
    });

    it('has the expected layout', function () {
      assert.strictEqual(polygon.getLayout(), 'XYM');
    });

    it('has the expected coordinates', function () {
      assert.deepEqual(polygon.getCoordinates(), [outerRing, innerRing]);
    });

    it('has the expected extent', function () {
      assert.deepEqual(polygon.getExtent(), [0, 0, 4, 4]);
    });

    it('has the expected flat coordinates', function () {
      assert.deepEqual(polygon.getFlatCoordinates(), flatCoordinates);
    });

    it('has stride the expected stride', function () {
      assert.strictEqual(polygon.getStride(), 3);
    });

    it('does not contain outside coordinates', function () {
      assert.strictEqual(polygon.intersectsCoordinate(outsideOuter), false);
    });

    it('does contain inside coordinates', function () {
      assert.strictEqual(polygon.intersectsCoordinate(inside), true);
    });

    it('does not contain inside inner coordinates', function () {
      assert.strictEqual(polygon.intersectsCoordinate(insideInner), false);
    });

    describe('#intersectsExtent', function () {
      it('does not intersect outside extent', function () {
        assert.strictEqual(
          polygon.intersectsExtent(boundingExtent([outsideOuter])),
          false,
        );
      });

      it('does intersect inside extent', function () {
        assert.strictEqual(
          polygon.intersectsExtent(boundingExtent([inside])),
          true,
        );
      });

      it('does intersect boundary extent', function () {
        const firstMidX = (outerRing[0][0] + outerRing[1][0]) / 2;
        const firstMidY = (outerRing[0][1] + outerRing[1][1]) / 2;

        assert.strictEqual(
          polygon.intersectsExtent(boundingExtent([[firstMidX, firstMidY]])),
          true,
        );
      });

      it('does not intersect extent fully contained by inner ring', function () {
        assert.strictEqual(
          polygon.intersectsExtent(boundingExtent([insideInner])),
          false,
        );
      });
    });

    describe('#getOrientedFlatCoordinates', function () {
      it('reverses the outer ring if necessary', function () {
        outerRing.reverse();
        polygon = new Polygon([outerRing, innerRing]);
        assert.deepEqual(polygon.getOrientedFlatCoordinates(), flatCoordinates);
      });

      it('reverses inner rings if necessary', function () {
        innerRing.reverse();
        polygon = new Polygon([outerRing, innerRing]);
        assert.deepEqual(polygon.getOrientedFlatCoordinates(), flatCoordinates);
      });

      it('reverses all rings if necessary', function () {
        outerRing.reverse();
        innerRing.reverse();
        polygon = new Polygon([outerRing, innerRing]);
        assert.deepEqual(polygon.getOrientedFlatCoordinates(), flatCoordinates);
      });
    });
  });

  describe('construct with 4D coordinates', function () {
    let outerRing, innerRing1, innerRing2, polygon, flatCoordinates;
    let outsideOuter, inside, insideInner1, insideInner2;
    beforeEach(function () {
      outerRing = [
        [0, 6, 1, 2],
        [6, 6, 3, 4],
        [3, 0, 5, 6],
      ];
      innerRing1 = [
        [2, 4, 7, 8],
        [4, 4, 9, 10],
        [4, 5, 11, 12],
        [2, 5, 13, 14],
      ];
      innerRing2 = [
        [3, 2, 15, 16],
        [4, 3, 17, 18],
        [2, 3, 19, 20],
      ];
      polygon = new Polygon([outerRing, innerRing1, innerRing2]);
      flatCoordinates = [
        0, 6, 1, 2, 6, 6, 3, 4, 3, 0, 5, 6, 2, 4, 7, 8, 4, 4, 9, 10, 4, 5, 11,
        12, 2, 5, 13, 14, 3, 2, 15, 16, 4, 3, 17, 18, 2, 3, 19, 20,
      ];
      outsideOuter = [1, 1];
      inside = [3, 1];
      insideInner1 = [2.5, 4.5];
      insideInner2 = [3, 2.5];
    });

    it('has the expected layout', function () {
      assert.strictEqual(polygon.getLayout(), 'XYZM');
    });

    it('has the expected coordinates', function () {
      assert.deepEqual(polygon.getCoordinates(), [
        outerRing,
        innerRing1,
        innerRing2,
      ]);
    });

    it('has the expected extent', function () {
      assert.deepEqual(polygon.getExtent(), [0, 0, 6, 6]);
    });

    it('has the expected flat coordinates', function () {
      assert.deepEqual(polygon.getFlatCoordinates(), flatCoordinates);
    });

    it('has stride the expected stride', function () {
      assert.strictEqual(polygon.getStride(), 4);
    });

    it('does not contain outside coordinates', function () {
      assert.strictEqual(polygon.intersectsCoordinate(outsideOuter), false);
    });

    it('does contain inside coordinates', function () {
      assert.strictEqual(polygon.intersectsCoordinate(inside), true);
    });

    it('does not contain inside inner coordinates', function () {
      assert.strictEqual(polygon.intersectsCoordinate(insideInner1), false);
      assert.strictEqual(polygon.intersectsCoordinate(insideInner2), false);
    });

    describe('#intersectsExtent', function () {
      it('does not intersect outside extent', function () {
        assert.strictEqual(
          polygon.intersectsExtent(boundingExtent([outsideOuter])),
          false,
        );
      });

      it('does intersect inside extent', function () {
        assert.strictEqual(
          polygon.intersectsExtent(boundingExtent([inside])),
          true,
        );
      });

      it('does intersect boundary extent', function () {
        const firstMidX = (outerRing[0][0] + outerRing[1][0]) / 2;
        const firstMidY = (outerRing[0][1] + outerRing[1][1]) / 2;

        assert.strictEqual(
          polygon.intersectsExtent(boundingExtent([[firstMidX, firstMidY]])),
          true,
        );
      });

      it('does not intersect extent fully contained by inner ring', function () {
        assert.strictEqual(
          polygon.intersectsExtent(boundingExtent([insideInner1])),
          false,
        );
        assert.strictEqual(
          polygon.intersectsExtent(boundingExtent([insideInner2])),
          false,
        );
      });
    });

    describe('#getOrientedFlatCoordinates', function () {
      it('reverses the outer ring if necessary', function () {
        outerRing.reverse();
        polygon = new Polygon([outerRing, innerRing1, innerRing2]);
        assert.deepEqual(polygon.getOrientedFlatCoordinates(), flatCoordinates);
      });

      it('reverses inner rings if necessary', function () {
        innerRing1.reverse();
        innerRing2.reverse();
        polygon = new Polygon([outerRing, innerRing1, innerRing2]);
        assert.deepEqual(polygon.getOrientedFlatCoordinates(), flatCoordinates);
      });

      it('reverses all rings if necessary', function () {
        outerRing.reverse();
        innerRing1.reverse();
        innerRing2.reverse();
        polygon = new Polygon([outerRing, innerRing1, innerRing2]);
        assert.deepEqual(polygon.getOrientedFlatCoordinates(), flatCoordinates);
      });
    });
  });

  describe('with a simple polygon', function () {
    let polygon;
    beforeEach(function () {
      polygon = new Polygon([
        [
          [3, 0],
          [1, 3],
          [0, 6],
          [2, 6],
          [3, 7],
          [4, 6],
          [6, 6],
          [4, 3],
        ],
      ]);
    });

    describe('#getSimplifiedGeometry', function () {
      it('returns the expected result', function () {
        const simplifiedGeometry = polygon.getSimplifiedGeometry(9);
        assert.instanceOf(simplifiedGeometry, Polygon);
        assert.deepEqual(simplifiedGeometry.getCoordinates(), [
          [
            [3, 0],
            [0, 3],
            [0, 6],
            [6, 6],
            [3, 3],
          ],
        ]);
      });
    });
  });

  describe('#scale()', function () {
    it('scales a polygon', function () {
      const geom = new Polygon([
        [
          [-1, -2],
          [1, -2],
          [1, 2],
          [-1, 2],
          [-1, -2],
        ],
      ]);
      geom.scale(10);
      const coordinates = geom.getCoordinates();
      assert.deepEqual(coordinates, [
        [
          [-10, -20],
          [10, -20],
          [10, 20],
          [-10, 20],
          [-10, -20],
        ],
      ]);
    });

    it('accepts sx and sy', function () {
      const geom = new Polygon([
        [
          [-1, -2],
          [1, -2],
          [1, 2],
          [-1, 2],
          [-1, -2],
        ],
      ]);
      geom.scale(2, 3);
      const coordinates = geom.getCoordinates();
      assert.deepEqual(coordinates, [
        [
          [-2, -6],
          [2, -6],
          [2, 6],
          [-2, 6],
          [-2, -6],
        ],
      ]);
    });

    it('accepts an anchor', function () {
      const geom = new Polygon([
        [
          [-1, -2],
          [1, -2],
          [1, 2],
          [-1, 2],
          [-1, -2],
        ],
      ]);
      geom.scale(3, 2, [-1, -2]);
      const coordinates = geom.getCoordinates();
      assert.deepEqual(coordinates, [
        [
          [-1, -2],
          [5, -2],
          [5, 6],
          [-1, 6],
          [-1, -2],
        ],
      ]);
    });
  });

  describe('#getInteriorPoint', function () {
    it('returns XYM point with intersection width as M', function () {
      const geom = new Polygon([
        [
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
          [0, 0],
        ],
      ]);
      const interiorPoint = geom.getInteriorPoint();
      assert.strictEqual(interiorPoint.getType(), 'Point');
      assert.strictEqual(interiorPoint.layout, 'XYM');
      assert.deepEqual(interiorPoint.getCoordinates(), [0.5, 0.5, 1]);
    });

    it('returns XYM point for donut polygons', function () {
      const geom = new Polygon([
        [
          [0.5, 0.5],
          [0.5, 2.5],
          [2.5, 2.5],
          [2.5, 0.5],
          [0.5, 0.5],
        ],
        [
          [1, 1],
          [2, 1],
          [2, 2],
          [1, 2],
          [1, 1],
        ],
      ]);
      const interiorPoint = geom.getInteriorPoint();
      assert.strictEqual(interiorPoint.getType(), 'Point');
      assert.strictEqual(interiorPoint.layout, 'XYM');
      assert.deepEqual(interiorPoint.getCoordinates(), [0.75, 1.5, 0.5]);
    });
  });

  describe('fromExtent()', function () {
    it('creates the correct polygon', function () {
      const extent = [1, 2, 3, 5];
      const polygon = fromExtent(extent);
      const flatCoordinates = polygon.getFlatCoordinates();
      assert.deepEqual(flatCoordinates, [1, 2, 1, 5, 3, 5, 3, 2, 1, 2]);
      const orientedFlatCoordinates = polygon.getOrientedFlatCoordinates();
      assert.deepEqual(orientedFlatCoordinates, [1, 2, 1, 5, 3, 5, 3, 2, 1, 2]);
    });

    it('throws on empty extent', function () {
      assert.throws(function () {
        fromExtent(createEmpty());
      });
    });
  });

  describe('fromCircle()', function () {
    it('creates a regular polygon', function () {
      const circle = new Circle([0, 0, 0], 1, 'XYZ');
      const polygon = fromCircle(circle);
      const coordinates = polygon.getLinearRing(0).getCoordinates();
      assert.deepEqual(coordinates[0].length, 3);
      assert.deepEqual(coordinates[0][2], 0);
      assert.deepEqual(coordinates[32], coordinates[0]);
      assert.approximately(coordinates[0][0], 1, 1e-9);
      assert.approximately(coordinates[0][1], 0, 1e-9);
      assert.approximately(coordinates[8][0], 0, 1e-9);
      assert.approximately(coordinates[8][1], 1, 1e-9);
      assert.approximately(coordinates[16][0], -1, 1e-9);
      assert.approximately(coordinates[16][1], 0, 1e-9);
      assert.approximately(coordinates[24][0], 0, 1e-9);
      assert.approximately(coordinates[24][1], -1, 1e-9);
    });

    it('creates a regular polygon with custom sides and angle', function () {
      const circle = new Circle([0, 0], 1);
      const polygon = fromCircle(circle, 4, Math.PI / 2);
      const coordinates = polygon.getLinearRing(0).getCoordinates();
      assert.deepEqual(coordinates[4], coordinates[0]);
      assert.approximately(coordinates[0][0], 0, 1e-9);
      assert.approximately(coordinates[0][1], 1, 1e-9);
    });

    it('creates a regular polygon, maintaining ZM values', () => {
      const circle = new Circle([0, 0, 1, 1], 1, 'XYZM');
      const polygon = fromCircle(circle);
      const coordinates = polygon.getLinearRing(0).getCoordinates();
      assert.deepEqual(coordinates[0][2], 1);
      assert.deepEqual(coordinates[0][3], 1);
    });
  });
});
