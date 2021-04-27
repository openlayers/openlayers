import GeometryCollection from '../../../../src/ol/geom/GeometryCollection.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import MultiLineString from '../../../../src/ol/geom/MultiLineString.js';
import MultiPoint from '../../../../src/ol/geom/MultiPoint.js';
import Point from '../../../../src/ol/geom/Point.js';
import WKT from '../../../../src/ol/format/WKT.js';
import {getArea, getDistance, getLength} from '../../../../src/ol/sphere.js';

describe('ol/sphere', function () {
  describe('getDistance()', function () {
    const expected = [
      {
        c1: [0, 0],
        c2: [0, 0],
        distance: 0,
      },
      {
        c1: [0, 0],
        c2: [45, 45],
        distance: 6671704.814011975,
      },
      {
        c1: [0, 0],
        c2: [-45, 45],
        distance: 6671704.814011975,
      },
      {
        c1: [0, 0],
        c2: [-45, -45],
        distance: 6671704.814011975,
      },
      {
        c1: [0, 0],
        c2: [45, -45],
        distance: 6671704.814011975,
      },
      {
        c1: [45, 45],
        c2: [45, 45],
        distance: 0,
      },
      {
        c1: [45, 45],
        c2: [-45, 45],
        distance: 6671704.814011975,
      },
      {
        c1: [45, 45],
        c2: [-45, -45],
        distance: 13343409.628023949,
      },
      {
        c1: [45, 45],
        c2: [45, -45],
        distance: 10007557.221017962,
      },
      {
        c1: [-45, 45],
        c2: [-45, 45],
        distance: 0,
      },
      {
        c1: [-45, 45],
        c2: [-45, -45],
        distance: 10007557.221017962,
      },
      {
        c1: [-45, 45],
        c2: [45, -45],
        distance: 13343409.628023949,
      },
      {
        c1: [-45, -45],
        c2: [-45, -45],
        distance: 0,
      },
      {
        c1: [-45, -45],
        c2: [45, -45],
        distance: 6671704.814011975,
      },
      {
        c1: [45, -45],
        c2: [45, -45],
        distance: 0,
      },
    ];

    expected.forEach(function (e, i) {
      it('calculates the distance between two points: ' + i, function () {
        expect(getDistance(e.c1, e.c2)).to.roughlyEqual(e.distance, 1e-6);
      });
    });
  });

  describe('getLength()', function () {
    const cases = [
      {
        geometry: new Point([0, 0]),
        length: 0,
      },
      {
        geometry: new MultiPoint([
          [0, 0],
          [1, 1],
        ]),
        length: 0,
      },
      {
        geometry: new LineString([
          [12801741.441226462, -3763310.627144653],
          [14582853.293918837, -2511525.2348457114],
          [15918687.18343812, -2875744.624352243],
          [16697923.618991036, -4028802.0261344076],
        ]),
        length: 4407939.124914191,
      },
      {
        geometry: new GeometryCollection([
          new LineString([
            [12801741.441226462, -3763310.627144653],
            [14582853.293918837, -2511525.2348457114],
            [15918687.18343812, -2875744.624352243],
            [16697923.618991036, -4028802.0261344076],
          ]),
          new LineString([
            [12801741.441226462, -3763310.627144653],
            [14582853.293918837, -2511525.2348457114],
            [15918687.18343812, -2875744.624352243],
            [16697923.618991036, -4028802.0261344076],
          ]),
        ]),
        length: 2 * 4407939.124914191,
      },
      {
        geometry: new LineString([
          [115, -32],
          [131, -22],
          [143, -25],
          [150, -34],
        ]),
        options: {projection: 'EPSG:4326'},
        length: 4407939.124914191,
      },
      {
        geometry: new MultiLineString([
          [
            [115, -32],
            [131, -22],
            [143, -25],
            [150, -34],
          ],
          [
            [115, -32],
            [131, -22],
            [143, -25],
            [150, -34],
          ],
        ]),
        options: {projection: 'EPSG:4326'},
        length: 2 * 4407939.124914191,
      },
      {
        geometry: new GeometryCollection([
          new LineString([
            [115, -32],
            [131, -22],
            [143, -25],
            [150, -34],
          ]),
          new LineString([
            [115, -32],
            [131, -22],
            [143, -25],
            [150, -34],
          ]),
        ]),
        options: {projection: 'EPSG:4326'},
        length: 2 * 4407939.124914191,
      },
    ];

    cases.forEach(function (c, i) {
      it('works for case ' + i, function () {
        const c = cases[i];
        const length = getLength(c.geometry, c.options);
        expect(length).to.roughlyEqual(c.length, 1e-8);
      });
    });
  });

  describe('getArea()', function () {
    let geometry;
    const expectedArea = 145652224192.4434;
    before(function (done) {
      afterLoadText('spec/ol/format/wkt/illinois.wkt', function (wkt) {
        try {
          const format = new WKT();
          geometry = format.readGeometry(wkt);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('calculates the area of Ilinois', function () {
      const area = getArea(geometry, {projection: 'EPSG:4326'});
      expect(area).to.equal(expectedArea);
    });

    it('calculates the area of a projected geometry', function () {
      const projected = geometry.clone().transform('EPSG:4326', 'EPSG:3857');
      const area = getArea(projected);
      expect(area).to.roughlyEqual(expectedArea, 1e-3);
    });

    it('calculates the area of a projected geometry collection', function () {
      const part = geometry.clone().transform('EPSG:4326', 'EPSG:3857');
      const collection = new GeometryCollection([part, part.clone()]);
      const area = getArea(collection);
      expect(area).to.roughlyEqual(2 * expectedArea, 1e-3);
    });
  });
});
