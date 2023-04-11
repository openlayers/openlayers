import MultiPolygon from '../../../../src/ol/geom/MultiPolygon.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import expect from '../../expect.js';

describe('ol/geom/MultiPolygon.js', function () {
  it('cannot be constructed with a null geometry', function () {
    expect(function () {
      return new MultiPolygon(null);
    }).to.throwException();
  });

  describe('with a null MultiPolygon', function () {
    it('can append polygons', function () {
      const multiPolygon = new MultiPolygon([
        new Polygon([
          [
            [0, 0],
            [0, 2],
            [1, 1],
            [2, 0],
          ],
        ]),
      ]);
      expect(multiPolygon.getCoordinates()).to.eql([
        [
          [
            [0, 0],
            [0, 2],
            [1, 1],
            [2, 0],
          ],
        ],
      ]);
      multiPolygon.appendPolygon(
        new Polygon([
          [
            [3, 0],
            [4, 1],
            [5, 2],
            [5, 0],
          ],
        ])
      );
      expect(multiPolygon.getCoordinates()).to.eql([
        [
          [
            [0, 0],
            [0, 2],
            [1, 1],
            [2, 0],
          ],
        ],
        [
          [
            [3, 0],
            [4, 1],
            [5, 2],
            [5, 0],
          ],
        ],
      ]);
      expect(multiPolygon.getPolygons().length).to.eql(2);
    });
  });

  describe('with an empty MultiPolygon', function () {
    let multiPolygon;
    beforeEach(function () {
      multiPolygon = new MultiPolygon([]);
    });

    it('can append polygons', function () {
      multiPolygon.appendPolygon(
        new Polygon([
          [
            [0, 0],
            [0, 2],
            [1, 1],
            [2, 0],
          ],
        ])
      );
      expect(multiPolygon.getCoordinates()).to.eql([
        [
          [
            [0, 0],
            [0, 2],
            [1, 1],
            [2, 0],
          ],
        ],
      ]);
      multiPolygon.appendPolygon(
        new Polygon([
          [
            [3, 0],
            [4, 1],
            [5, 2],
            [5, 0],
          ],
        ])
      );
      expect(multiPolygon.getCoordinates()).to.eql([
        [
          [
            [0, 0],
            [0, 2],
            [1, 1],
            [2, 0],
          ],
        ],
        [
          [
            [3, 0],
            [4, 1],
            [5, 2],
            [5, 0],
          ],
        ],
      ]);
      expect(multiPolygon.getPolygons().length).to.eql(2);
    });
  });

  describe('#scale()', function () {
    it('scales a multi-polygon', function () {
      const geom = new MultiPolygon([
        [
          [
            [-1, -2],
            [1, -2],
            [1, 2],
            [-1, 2],
            [-1, -2],
          ],
        ],
      ]);
      geom.scale(10);
      const coordinates = geom.getCoordinates();
      expect(coordinates).to.eql([
        [
          [
            [-10, -20],
            [10, -20],
            [10, 20],
            [-10, 20],
            [-10, -20],
          ],
        ],
      ]);
    });

    it('accepts sx and sy', function () {
      const geom = new MultiPolygon([
        [
          [
            [-1, -2],
            [1, -2],
            [1, 2],
            [-1, 2],
            [-1, -2],
          ],
        ],
      ]);
      geom.scale(2, 3);
      const coordinates = geom.getCoordinates();
      expect(coordinates).to.eql([
        [
          [
            [-2, -6],
            [2, -6],
            [2, 6],
            [-2, 6],
            [-2, -6],
          ],
        ],
      ]);
    });

    it('accepts an anchor', function () {
      const geom = new MultiPolygon([
        [
          [
            [-1, -2],
            [1, -2],
            [1, 2],
            [-1, 2],
            [-1, -2],
          ],
        ],
      ]);
      geom.scale(3, 2, [-1, -2]);
      const coordinates = geom.getCoordinates();
      expect(coordinates).to.eql([
        [
          [
            [-1, -2],
            [5, -2],
            [5, 6],
            [-1, 6],
            [-1, -2],
          ],
        ],
      ]);
    });
  });

  describe('with a simple MultiPolygon', function () {
    let multiPolygon;
    beforeEach(function () {
      multiPolygon = new MultiPolygon([
        [
          [
            [0, 0],
            [0, 2],
            [1, 1],
            [2, 0],
          ],
        ],
        [
          [
            [3, 0],
            [4, 1],
            [5, 2],
            [5, 0],
          ],
        ],
      ]);
    });

    it('can return individual polygons', function () {
      const polygon0 = multiPolygon.getPolygon(0);
      expect(polygon0).to.be.an(Polygon);
      expect(polygon0.getCoordinates()).to.eql([
        [
          [0, 0],
          [0, 2],
          [1, 1],
          [2, 0],
        ],
      ]);
      const polygon1 = multiPolygon.getPolygon(1);
      expect(polygon1).to.be.an(Polygon);
      expect(polygon1.getCoordinates()).to.eql([
        [
          [3, 0],
          [4, 1],
          [5, 2],
          [5, 0],
        ],
      ]);
    });

    it('can return all polygons', function () {
      const polygons = multiPolygon.getPolygons();
      expect(polygons).to.be.an(Array);
      expect(polygons).to.have.length(2);
      expect(polygons[0]).to.be.an(Polygon);
      expect(polygons[0].getCoordinates()).to.eql([
        [
          [0, 0],
          [0, 2],
          [1, 1],
          [2, 0],
        ],
      ]);
      expect(polygons[1]).to.be.an(Polygon);
      expect(polygons[1].getCoordinates()).to.eql([
        [
          [3, 0],
          [4, 1],
          [5, 2],
          [5, 0],
        ],
      ]);
    });

    describe('#clone()', function () {
      it('has the expected endss_', function () {
        multiPolygon.setProperties({foo: 'bar', baz: null});

        const clone = multiPolygon.clone();
        expect(multiPolygon.endss_).to.eql(clone.endss_);
        expect(clone.getProperties()).to.eql({foo: 'bar', baz: null});
      });
    });

    describe('#getCoordinates()', function () {
      const cw = [
        [-180, -90],
        [-180, 90],
        [180, 90],
        [180, -90],
        [-180, -90],
      ];
      const cw2 = [
        [-140, -60],
        [-140, 60],
        [140, 60],
        [140, -60],
        [-140, -60],
      ];
      const ccw = [
        [-180, -90],
        [180, -90],
        [180, 90],
        [-180, 90],
        [-180, -90],
      ];
      const ccw2 = [
        [-140, -60],
        [140, -60],
        [140, 60],
        [-140, 60],
        [-140, -60],
      ];
      const right = new MultiPolygon([
        [ccw, cw],
        [ccw2, cw2],
      ]);
      const left = new MultiPolygon([
        [cw, ccw],
        [cw2, ccw2],
      ]);
      const withEmptyPolygon = new MultiPolygon([[ccw], []]);

      it('returns coordinates as they were constructed', function () {
        expect(right.getCoordinates()).to.eql([
          [ccw, cw],
          [ccw2, cw2],
        ]);
        expect(left.getCoordinates()).to.eql([
          [cw, ccw],
          [cw2, ccw2],
        ]);
        expect(withEmptyPolygon.getCoordinates()).to.eql([[ccw], []]);
      });

      it('can return coordinates with right-hand orientation', function () {
        expect(right.getCoordinates(true)).to.eql([
          [ccw, cw],
          [ccw2, cw2],
        ]);
        expect(left.getCoordinates(true)).to.eql([
          [ccw, cw],
          [ccw2, cw2],
        ]);
      });

      it('can return coordinates with left-hand orientation', function () {
        expect(right.getCoordinates(false)).to.eql([
          [cw, ccw],
          [cw2, ccw2],
        ]);
        expect(left.getCoordinates(false)).to.eql([
          [cw, ccw],
          [cw2, ccw2],
        ]);
      });
    });

    describe('#getExtent()', function () {
      it('returns expected result', function () {
        expect(multiPolygon.getExtent()).to.eql([0, 0, 5, 2]);
      });
    });

    describe('#getSimplifiedGeometry', function () {
      it('returns the expected result', function () {
        const simplifiedGeometry = multiPolygon.getSimplifiedGeometry(1);
        expect(simplifiedGeometry).to.be.an(MultiPolygon);
        expect(simplifiedGeometry.getCoordinates()).to.eql([
          [
            [
              [0, 0],
              [0, 2],
              [2, 0],
            ],
          ],
          [
            [
              [3, 0],
              [5, 2],
              [5, 0],
            ],
          ],
        ]);
      });
    });

    describe('#intersectsExtent()', function () {
      it('returns true for extent of of each polygon', function () {
        const polygons = multiPolygon.getPolygons();
        for (let i = 0; i < polygons.length; i++) {
          expect(multiPolygon.intersectsExtent(polygons[i].getExtent())).to.be(
            true
          );
        }
      });

      it('returns false for non-matching extent within own extent', function () {
        expect(multiPolygon.intersectsExtent([2.1, 0, 2.9, 2])).to.be(false);
      });
    });
  });

  describe('#getArea', function () {
    it('works with a clockwise and a counterclockwise Polygon', function () {
      const multiPolygon = new MultiPolygon([
        [
          [
            [1, 3],
            [1, 2],
            [0, 2],
            [1, 3],
          ],
        ], // clockwise polygon with area 0.5
        [
          [
            [2, 1],
            [2, 0.5],
            [3, 1],
            [2, 1],
          ],
        ], // counterclockwise polygon with area 0.25
      ]);
      expect(multiPolygon.getArea()).to.be(0.75);
    });
  });

  describe('#getInteriorPoints', function () {
    it('returns XYM multipoint with intersection width as M', function () {
      const geom = new MultiPolygon([
        [
          [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0],
          ],
        ],
        [
          [
            [1, 1],
            [1, 2],
            [2, 2],
            [2, 1],
            [1, 1],
          ],
        ],
      ]);
      const interiorPoints = geom.getInteriorPoints();
      expect(interiorPoints.getType()).to.be('MultiPoint');
      expect(interiorPoints.layout).to.be('XYM');
      expect(interiorPoints.getCoordinates()).to.eql([
        [0.5, 0.5, 1],
        [1.5, 1.5, 1],
      ]);
    });
  });
});
