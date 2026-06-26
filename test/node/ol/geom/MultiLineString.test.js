import {assert} from 'chai';
import {isEmpty} from '../../../../src/ol/extent.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import MultiLineString from '../../../../src/ol/geom/MultiLineString.js';

describe('ol/geom/MultiLineString.js', function () {
  it('cannot be constructed with a null geometry', function () {
    assert.throws(function () {
      return new MultiLineString(null);
    });
  });

  describe('construct empty', function () {
    let multiLineString;
    beforeEach(function () {
      multiLineString = new MultiLineString([]);
    });

    it('defaults to layout XY', function () {
      assert.strictEqual(multiLineString.getLayout(), 'XY');
    });

    it('has empty coordinates', function () {
      assert.isEmpty(multiLineString.getCoordinates());
    });

    it('has an empty extent', function () {
      assert.strictEqual(isEmpty(multiLineString.getExtent()), true);
    });

    it('has empty flat coordinates', function () {
      assert.isEmpty(multiLineString.getFlatCoordinates());
    });

    it('has stride the expected stride', function () {
      assert.strictEqual(multiLineString.getStride(), 2);
    });

    it('can append line strings', function () {
      multiLineString.appendLineString(
        new LineString([
          [1, 2],
          [3, 4],
        ]),
      );
      assert.deepEqual(multiLineString.getCoordinates(), [
        [
          [1, 2],
          [3, 4],
        ],
      ]);
      multiLineString.appendLineString(
        new LineString([
          [5, 6],
          [7, 8],
        ]),
      );
      assert.deepEqual(multiLineString.getCoordinates(), [
        [
          [1, 2],
          [3, 4],
        ],
        [
          [5, 6],
          [7, 8],
        ],
      ]);
    });
  });

  describe('construct with 2D coordinates', function () {
    let multiLineString;
    beforeEach(function () {
      multiLineString = new MultiLineString([
        [
          [1, 2],
          [3, 4],
        ],
        [
          [5, 6],
          [7, 8],
        ],
      ]);
    });

    it('has the expected layout', function () {
      assert.strictEqual(multiLineString.getLayout(), 'XY');
    });

    it('has the expected coordinates', function () {
      assert.deepEqual(multiLineString.getCoordinates(), [
        [
          [1, 2],
          [3, 4],
        ],
        [
          [5, 6],
          [7, 8],
        ],
      ]);
    });

    it('has the expected extent', function () {
      assert.deepEqual(multiLineString.getExtent(), [1, 2, 7, 8]);
    });

    it('has the expected flat coordinates', function () {
      assert.deepEqual(
        multiLineString.getFlatCoordinates(),
        [1, 2, 3, 4, 5, 6, 7, 8],
      );
    });

    it('has stride the expected stride', function () {
      assert.strictEqual(multiLineString.getStride(), 2);
    });

    describe('#getFlatMidpoints', function () {
      it('returns the expected result', function () {
        assert.deepEqual(multiLineString.getFlatMidpoints(), [2, 3, 6, 7]);
      });
    });

    describe('#intersectsExtent()', function () {
      it('returns true for intersecting part of lineString', function () {
        assert.strictEqual(
          multiLineString.intersectsExtent([1, 2, 2, 3]),
          true,
        );
      });

      it('returns false for non-matching extent within own extent', function () {
        assert.strictEqual(
          multiLineString.intersectsExtent([1, 7, 2, 8]),
          false,
        );
      });
    });
  });

  describe('construct with 3D coordinates', function () {
    let multiLineString;
    beforeEach(function () {
      multiLineString = new MultiLineString([
        [
          [1, 2, 3],
          [4, 5, 6],
        ],
        [
          [7, 8, 9],
          [10, 11, 12],
        ],
      ]);
    });

    it('has the expected layout', function () {
      assert.strictEqual(multiLineString.getLayout(), 'XYZ');
    });

    it('has the expected coordinates', function () {
      assert.deepEqual(multiLineString.getCoordinates(), [
        [
          [1, 2, 3],
          [4, 5, 6],
        ],
        [
          [7, 8, 9],
          [10, 11, 12],
        ],
      ]);
    });

    it('has the expected extent', function () {
      assert.deepEqual(multiLineString.getExtent(), [1, 2, 10, 11]);
    });

    it('has the expected flat coordinates', function () {
      assert.deepEqual(
        multiLineString.getFlatCoordinates(),
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      );
    });

    it('has stride the expected stride', function () {
      assert.strictEqual(multiLineString.getStride(), 3);
    });
  });

  describe('construct with 3D coordinates and layout XYM', function () {
    let multiLineString;
    beforeEach(function () {
      multiLineString = new MultiLineString(
        [
          [
            [1, 2, 3],
            [4, 5, 6],
          ],
          [
            [7, 8, 9],
            [10, 11, 12],
          ],
        ],
        'XYM',
      );
    });

    it('has the expected layout', function () {
      assert.strictEqual(multiLineString.getLayout(), 'XYM');
    });

    it('has the expected coordinates', function () {
      assert.deepEqual(multiLineString.getCoordinates(), [
        [
          [1, 2, 3],
          [4, 5, 6],
        ],
        [
          [7, 8, 9],
          [10, 11, 12],
        ],
      ]);
    });

    it('has the expected extent', function () {
      assert.deepEqual(multiLineString.getExtent(), [1, 2, 10, 11]);
    });

    it('has the expected flat coordinates', function () {
      assert.deepEqual(
        multiLineString.getFlatCoordinates(),
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      );
    });

    it('has stride the expected stride', function () {
      assert.strictEqual(multiLineString.getStride(), 3);
    });

    it('can return individual line strings', function () {
      const lineString0 = multiLineString.getLineString(0);
      assert.instanceOf(lineString0, LineString);
      assert.strictEqual(lineString0.getLayout(), 'XYM');
      assert.deepEqual(lineString0.getCoordinates(), [
        [1, 2, 3],
        [4, 5, 6],
      ]);
      const lineString1 = multiLineString.getLineString(1);
      assert.instanceOf(lineString1, LineString);
      assert.strictEqual(lineString1.getLayout(), 'XYM');
      assert.deepEqual(lineString1.getCoordinates(), [
        [7, 8, 9],
        [10, 11, 12],
      ]);
    });

    describe('#getCoordinateAtM', function () {
      describe('with extrapolation and interpolation', function () {
        it('returns the expected value', function () {
          assert.deepEqual(
            multiLineString.getCoordinateAtM(0, true, true),
            [1, 2, 0],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(3, true, true),
            [1, 2, 3],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(4.5, true, true),
            [2.5, 3.5, 4.5],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(6, true, true),
            [4, 5, 6],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(7.5, true, true),
            [5.5, 6.5, 7.5],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(9, true, true),
            [7, 8, 9],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(10.5, true, true),
            [8.5, 9.5, 10.5],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(12, true, true),
            [10, 11, 12],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(15, true, true),
            [10, 11, 15],
          );
        });
      });

      describe('with extrapolation and no interpolation', function () {
        it('returns the expected value', function () {
          assert.deepEqual(
            multiLineString.getCoordinateAtM(0, true, false),
            [1, 2, 0],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(3, true, false),
            [1, 2, 3],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(4.5, true, false),
            [2.5, 3.5, 4.5],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(6, true, false),
            [4, 5, 6],
          );
          assert.strictEqual(
            multiLineString.getCoordinateAtM(7.5, true, false),
            null,
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(9, true, false),
            [7, 8, 9],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(10.5, true, false),
            [8.5, 9.5, 10.5],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(12, true, false),
            [10, 11, 12],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(15, true, false),
            [10, 11, 15],
          );
        });
      });

      describe('with no extrapolation and interpolation', function () {
        it('returns the expected value', function () {
          assert.deepEqual(
            multiLineString.getCoordinateAtM(0, false, true),
            null,
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(3, false, true),
            [1, 2, 3],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(4.5, false, true),
            [2.5, 3.5, 4.5],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(6, false, true),
            [4, 5, 6],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(7.5, false, true),
            [5.5, 6.5, 7.5],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(9, false, true),
            [7, 8, 9],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(10.5, false, true),
            [8.5, 9.5, 10.5],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(12, false, true),
            [10, 11, 12],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(15, false, true),
            null,
          );
        });
      });

      describe('with no extrapolation or interpolation', function () {
        it('returns the expected value', function () {
          assert.deepEqual(
            multiLineString.getCoordinateAtM(0, false, false),
            null,
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(3, false, false),
            [1, 2, 3],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(4.5, false, false),
            [2.5, 3.5, 4.5],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(6, false, false),
            [4, 5, 6],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(7.5, false, false),
            null,
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(9, false, false),
            [7, 8, 9],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(10.5, false, false),
            [8.5, 9.5, 10.5],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(12, false, false),
            [10, 11, 12],
          );
          assert.deepEqual(
            multiLineString.getCoordinateAtM(15, false, false),
            null,
          );
        });
      });
    });
  });

  describe('construct with 4D coordinates', function () {
    let multiLineString;
    beforeEach(function () {
      multiLineString = new MultiLineString([
        [
          [1, 2, 3, 4],
          [5, 6, 7, 8],
        ],
        [
          [9, 10, 11, 12],
          [13, 14, 15, 16],
        ],
      ]);
    });

    it('has the expected layout', function () {
      assert.strictEqual(multiLineString.getLayout(), 'XYZM');
    });

    it('has the expected coordinates', function () {
      assert.deepEqual(multiLineString.getCoordinates(), [
        [
          [1, 2, 3, 4],
          [5, 6, 7, 8],
        ],
        [
          [9, 10, 11, 12],
          [13, 14, 15, 16],
        ],
      ]);
    });

    it('has the expected extent', function () {
      assert.deepEqual(multiLineString.getExtent(), [1, 2, 13, 14]);
    });

    it('has the expected flat coordinates', function () {
      assert.deepEqual(
        multiLineString.getFlatCoordinates(),
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      );
    });

    it('has stride the expected stride', function () {
      assert.strictEqual(multiLineString.getStride(), 4);
    });
  });

  describe('#scale()', function () {
    it('scales a multi-linestring', function () {
      const geom = new MultiLineString([
        [
          [-10, -20],
          [10, 20],
        ],
        [
          [5, -10],
          [-5, 10],
        ],
      ]);
      geom.scale(10);
      const coordinates = geom.getCoordinates();
      assert.deepEqual(coordinates, [
        [
          [-100, -200],
          [100, 200],
        ],
        [
          [50, -100],
          [-50, 100],
        ],
      ]);
    });

    it('accepts sx and sy', function () {
      const geom = new MultiLineString([
        [
          [-10, -20],
          [10, 20],
        ],
        [
          [5, -10],
          [-5, 10],
        ],
      ]);
      geom.scale(2, 3);
      const coordinates = geom.getCoordinates();
      assert.deepEqual(coordinates, [
        [
          [-20, -60],
          [20, 60],
        ],
        [
          [10, -30],
          [-10, 30],
        ],
      ]);
    });

    it('accepts an anchor', function () {
      const geom = new MultiLineString([
        [
          [-10, -20],
          [10, 20],
        ],
        [
          [5, -10],
          [-5, 10],
        ],
      ]);
      geom.scale(3, 2, [10, 20]);
      const coordinates = geom.getCoordinates();
      assert.deepEqual(coordinates, [
        [
          [-50, -60],
          [10, 20],
        ],
        [
          [-5, -40],
          [-35, 0],
        ],
      ]);
    });
  });

  describe('#setLineStrings', function () {
    it('sets the line strings', function () {
      const lineString1 = new LineString([
        [1, 2],
        [3, 4],
      ]);
      const lineString2 = new LineString([
        [5, 6],
        [7, 8],
      ]);
      const multiLineString = new MultiLineString([lineString1, lineString2]);
      assert.deepEqual(
        multiLineString.getFlatCoordinates(),
        [1, 2, 3, 4, 5, 6, 7, 8],
      );
      assert.deepEqual(multiLineString.getEnds(), [4, 8]);
      const coordinates = multiLineString.getCoordinates();
      assert.deepEqual(coordinates[0], lineString1.getCoordinates());
      assert.deepEqual(coordinates[1], lineString2.getCoordinates());
    });
  });

  describe('#containsXY()', function () {
    let multiLineString;
    beforeEach(function () {
      multiLineString = new MultiLineString([
        [
          [1, 2, 3],
          [4, 5, 6],
        ],
        [
          [-1, -1, 9],
          [2, 2, 12],
        ],
      ]);
    });

    it('does contain XY', function () {
      assert.strictEqual(multiLineString.containsXY(1, 2), true);
      assert.strictEqual(multiLineString.containsXY(4, 5), true);
      assert.strictEqual(multiLineString.containsXY(3, 4), true);

      assert.strictEqual(multiLineString.containsXY(-1, -1), true);
      assert.strictEqual(multiLineString.containsXY(2, 2), true);
      assert.strictEqual(multiLineString.containsXY(0, 0), true);
    });

    it('does not contain XY', function () {
      assert.strictEqual(multiLineString.containsXY(1, 3), false);
      assert.strictEqual(multiLineString.containsXY(2, 11), false);
      assert.strictEqual(multiLineString.containsXY(-2, 3), false);
    });
  });

  describe('#getLength', function () {
    it('sums up the length of all linestrings', function () {
      const multiLineString = new MultiLineString([
        [
          [0, 0],
          [1, 0],
          [1, 1],
        ],
        [
          [0.5, 0.5],
          [0, 0.5],
          [0, 0],
        ],
      ]);
      const length = multiLineString.getLength();
      assert.strictEqual(length, 3);
    });
  });
});
