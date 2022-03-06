import Circle from '../../../../../src/ol/geom/Circle.js';
import Collection from '../../../../../src/ol/Collection.js';
import Feature from '../../../../../src/ol/Feature.js';
import LineString from '../../../../../src/ol/geom/LineString.js';
import Map from '../../../../../src/ol/Map.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Snap from '../../../../../src/ol/interaction/Snap.js';
import View from '../../../../../src/ol/View.js';
import {
  clearUserProjection,
  setUserProjection,
  transform,
  useGeographic,
} from '../../../../../src/ol/proj.js';
import {overrideRAF} from '../../util.js';

describe('ol.interaction.Snap', function () {
  describe('constructor', function () {
    it('can be constructed without arguments', function () {
      const instance = new Snap();
      expect(instance).to.be.an(Snap);
    });
  });

  describe('handleEvent', function () {
    let target, map;

    const width = 360;
    const height = 180;

    beforeEach(function (done) {
      target = document.createElement('div');

      const style = target.style;
      style.position = 'absolute';
      style.left = '-1000px';
      style.top = '-1000px';
      style.width = width + 'px';
      style.height = height + 'px';
      document.body.appendChild(target);

      map = new Map({
        target: target,
        view: new View({
          projection: 'EPSG:4326',
          center: [0, 0],
          resolution: 1,
        }),
      });

      map.once('postrender', function () {
        done();
      });
    });

    afterEach(function () {
      map.dispose();
      document.body.removeChild(target);
      clearUserProjection();
    });

    it('can handle XYZ coordinates', function () {
      const point = new Feature(new Point([0, 0, 123]));
      const snapInteraction = new Snap({
        features: new Collection([point]),
      });
      snapInteraction.setMap(map);

      const event = {
        pixel: [width / 2, height / 2],
        coordinate: [0, 0],
        map: map,
      };
      snapInteraction.handleEvent(event);
      // check that the coordinate is in XY and not XYZ
      expect(event.coordinate).to.eql([0, 0]);
    });

    it('snaps to edges only', function () {
      const point = new Feature(
        new LineString([
          [-10, 0],
          [10, 0],
        ])
      );
      const snapInteraction = new Snap({
        features: new Collection([point]),
        pixelTolerance: 5,
        vertex: false,
      });
      snapInteraction.setMap(map);

      const event = {
        pixel: [7 + width / 2, height / 2 - 4],
        coordinate: [7, 4],
        map: map,
      };
      snapInteraction.handleEvent(event);
      expect(event.coordinate).to.eql([7, 0]);
    });

    it('snaps to vertices only', function () {
      const point = new Feature(
        new LineString([
          [-10, 0],
          [10, 0],
        ])
      );
      const snapInteraction = new Snap({
        features: new Collection([point]),
        pixelTolerance: 5,
        edge: false,
      });
      snapInteraction.setMap(map);

      const event = {
        pixel: [7 + width / 2, height / 2 - 4],
        coordinate: [7, 4],
        map: map,
      };
      snapInteraction.handleEvent(event);
      expect(event.coordinate).to.eql([10, 0]);
    });

    it('snaps to vertex on line', function () {
      const line = new Feature(
        new LineString([
          [0, 0],
          [50, 0],
        ])
      );
      const point = new Feature(new Point([5, 0]));
      const snap = new Snap({
        features: new Collection([line, point]),
      });
      snap.setMap(map);
      const event = {
        pixel: [3 + width / 2, height / 2],
        coordinate: [3, 0],
        map: map,
      };
      snap.handleEvent(event);
      expect(event.coordinate).to.eql([5, 0]);
    });

    it('snaps to circle', function () {
      const circle = new Feature(new Circle([0, 0], 10));
      const snapInteraction = new Snap({
        features: new Collection([circle]),
        pixelTolerance: 5,
      });
      snapInteraction.setMap(map);

      const event = {
        pixel: [5 + width / 2, height / 2 - 5],
        coordinate: [5, 5],
        map: map,
      };
      snapInteraction.handleEvent(event);

      expect(event.coordinate[0]).to.roughlyEqual(
        Math.sin(Math.PI / 4) * 10,
        1e-10
      );
      expect(event.coordinate[1]).to.roughlyEqual(
        Math.sin(Math.PI / 4) * 10,
        1e-10
      );
    });

    it('snaps to circle in a user projection', function () {
      const userProjection = 'EPSG:3857';
      setUserProjection(userProjection);
      const viewProjection = map.getView().getProjection();

      const circle = new Feature(
        new Circle([0, 0], 10).transform(viewProjection, userProjection)
      );
      const snapInteraction = new Snap({
        features: new Collection([circle]),
        pixelTolerance: 5,
      });
      snapInteraction.setMap(map);

      const event = {
        pixel: [5 + width / 2, height / 2 - 5],
        coordinate: transform([5, 5], viewProjection, userProjection),
        map: map,
      };
      snapInteraction.handleEvent(event);

      const coordinate = transform(
        [Math.sin(Math.PI / 4) * 10, Math.sin(Math.PI / 4) * 10],
        viewProjection,
        userProjection
      );
      expect(event.coordinate[0]).to.roughlyEqual(coordinate[0], 1e-10);
      expect(event.coordinate[1]).to.roughlyEqual(coordinate[1], 1e-10);
    });

    it('handle feature without geometry', function () {
      const feature = new Feature();
      const snapInteraction = new Snap({
        features: new Collection([feature]),
        pixelTolerance: 5,
        edge: false,
      });
      snapInteraction.setMap(map);

      feature.setGeometry(
        new LineString([
          [-10, 0],
          [10, 0],
        ])
      );

      const event = {
        pixel: [7 + width / 2, height / 2 - 4],
        coordinate: [7, 4],
        map: map,
      };
      snapInteraction.handleEvent(event);
      expect(event.coordinate).to.eql([10, 0]);
    });

    it('handle geometry changes', function () {
      const line = new Feature(
        new LineString([
          [-10, 0],
          [0, 0],
        ])
      );
      const snapInteraction = new Snap({
        features: new Collection([line]),
        pixelTolerance: 5,
        edge: false,
      });
      snapInteraction.setMap(map);

      line.getGeometry().setCoordinates([
        [-10, 0],
        [10, 0],
      ]);

      const event = {
        pixel: [7 + width / 2, height / 2 - 4],
        coordinate: [7, 4],
        map: map,
      };
      snapInteraction.handleEvent(event);
      expect(event.coordinate).to.eql([10, 0]);
    });

    it('handle geometry name changes', function () {
      const line = new Feature({
        geometry: new LineString([
          [-10, 0],
          [0, 0],
        ]),
        alt_geometry: new LineString([
          [-10, 0],
          [10, 0],
        ]),
      });
      const snapInteraction = new Snap({
        features: new Collection([line]),
        pixelTolerance: 5,
        edge: false,
      });
      snapInteraction.setMap(map);

      line.setGeometryName('alt_geometry');

      const event = {
        pixel: [7 + width / 2, height / 2 - 4],
        coordinate: [7, 4],
        map: map,
      };
      snapInteraction.handleEvent(event);
      expect(event.coordinate).to.eql([10, 0]);
    });
  });

  describe('handleEvent - useGeographic', () => {
    let target, map;
    const size = 256;

    let restoreRAF;

    beforeEach((done) => {
      restoreRAF = overrideRAF();

      useGeographic();
      target = document.createElement('div');

      Object.assign(target.style, {
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${size}px`,
        height: `${size}px`,
      });
      document.body.appendChild(target);

      map = new Map({
        target: target,
        view: new View({
          center: [0, 0],
          zoom: 0,
        }),
      });

      map.once('postrender', () => {
        done();
      });
    });

    afterEach(() => {
      map.dispose();
      document.body.removeChild(target);
      clearUserProjection();
      restoreRAF();
    });

    it('snaps to user coordinates', () => {
      const lon = -90;
      const lat = 45;
      const point = new Feature(new Point([lon, lat]));

      const snap = new Snap({
        features: new Collection([point]),
      });
      snap.setMap(map);

      const expectedPixel = map
        .getPixelFromCoordinate([lon, lat])
        .map((value) => Math.round(value));

      const delta = 5;
      const pixel = expectedPixel.slice();
      pixel[0] += delta;
      pixel[1] += delta;

      const coordinate = map.getCoordinateFromPixel(pixel);

      const event = {
        pixel: pixel,
        coordinate: coordinate,
        map: map,
      };
      snap.handleEvent(event);

      expect(event.coordinate).to.eql([lon, lat]);
      expect(event.pixel).to.eql(expectedPixel);
    });
  });
});
