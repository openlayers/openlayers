import Collection from '../../../../../src/ol/Collection.js';
import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import Circle from '../../../../../src/ol/geom/Circle.js';
import LineString from '../../../../../src/ol/geom/LineString.js';
import MultiPoint from '../../../../../src/ol/geom/MultiPoint.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Snap from '../../../../../src/ol/interaction/Snap.js';
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
      disposeMap(map);
      clearUserProjection();
    });

    it('can handle XYZ coordinates', function (done) {
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
      snapInteraction.on('snap', function (snapEvent) {
        expect(snapEvent.type).to.be('snap');
        expect(snapEvent.vertex).to.be(event.coordinate);
        expect(snapEvent.vertexPixel).to.be(event.pixel);
        expect(snapEvent.feature).to.eql(point);
        expect(snapEvent.segment).to.be(null);

        // check that the coordinate is in XY and not XYZ
        expect(event.coordinate).to.eql([0, 0]);

        done();
      });

      snapInteraction.handleEvent(event);
    });

    it('can handle view rotation', function (done) {
      map.getView().setRotation(Math.PI / 4);
      map.renderSync();

      const point = new Feature(new Point([0, 0]));
      const snapInteraction = new Snap({
        features: new Collection([point]),
      });
      snapInteraction.setMap(map);

      const event = {
        pixel: [6 + width / 2, height / 2 - 3],
        coordinate: [1, 3],
        map: map,
      };
      snapInteraction.on('snap', function (snapEvent) {
        expect(snapEvent.vertex).to.be(event.coordinate);
        expect(snapEvent.vertexPixel).to.be(event.pixel);
        expect(snapEvent.feature).to.be(point);
        expect(snapEvent.segment).to.be(null);

        expect(event.coordinate).to.eql([0, 0]);
        expect(event.pixel).to.eql([width / 2, height / 2]);

        done();
      });
      snapInteraction.handleEvent(event);
    });

    it('snaps to edges only', function (done) {
      const line = new Feature(
        new LineString([
          [-10, 0],
          [10, 0],
        ]),
      );
      const snapInteraction = new Snap({
        features: new Collection([line]),
        pixelTolerance: 5,
        vertex: false,
      });
      snapInteraction.setMap(map);
      const event = {
        pixel: [7 + width / 2, height / 2 - 4],
        coordinate: [7, 4],
        map: map,
      };

      snapInteraction.on('snap', function (snapEvent) {
        expect(snapEvent.feature).to.eql(line);
        expect(snapEvent.segment).to.eql([
          [-10, 0],
          [10, 0],
        ]);

        expect(event.coordinate).to.eql([7, 0]);

        done();
      });

      snapInteraction.handleEvent(event);
    });

    it('snaps to edges in a user projection', function (done) {
      const userProjection = 'EPSG:3857';
      setUserProjection(userProjection);
      const viewProjection = map.getView().getProjection();
      const line = new Feature(
        new LineString([
          [-10, 0],
          [10, 0],
        ]).transform(viewProjection, userProjection),
      );
      const snapInteraction = new Snap({
        features: new Collection([line]),
        pixelTolerance: 5,
        vertex: false,
      });
      snapInteraction.setMap(map);

      const event = {
        pixel: [7 + width / 2, height / 2 - 4],
        coordinate: transform([7, 4], viewProjection, userProjection),
        map: map,
      };

      const coordinate = transform([7, 0], viewProjection, userProjection);

      snapInteraction.on('snap', function (snapEvent) {
        expect(snapEvent.feature).to.eql(line);
        expect(snapEvent.segment).to.eql([
          transform([-10, 0], viewProjection, userProjection),
          transform([10, 0], viewProjection, userProjection),
        ]);

        expect(event.coordinate[0]).to.roughlyEqual(coordinate[0], 1e-10);
        expect(event.coordinate[1]).to.roughlyEqual(coordinate[1], 1e-10);

        done();
      });
      snapInteraction.handleEvent(event);
    });

    it('snaps to vertices only', function (done) {
      const point = new Feature(
        new LineString([
          [-10, 0],
          [10, 0],
        ]),
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
      snapInteraction.on('snap', function (snapEvent) {
        expect(snapEvent.feature).to.be(point);
        expect(snapEvent.segment).to.be(null);

        expect(event.coordinate).to.eql([10, 0]);

        done();
      });
      snapInteraction.handleEvent(event);
    });

    it('snaps to point', function (done) {
      const line = new Feature(
        new LineString([
          [0, 0],
          [50, 0],
        ]),
      );
      const point = new Feature(new Point([5, 0]));
      const snapInteraction = new Snap({
        features: new Collection([line, point]),
      });
      snapInteraction.setMap(map);
      const event = {
        pixel: [3 + width / 2, height / 2],
        coordinate: [3, 0],
        map: map,
      };
      snapInteraction.on('snap', function (snapEvent) {
        expect(snapEvent.feature).to.be(point);
        expect(snapEvent.segment).to.be(null);

        expect(event.coordinate).to.eql([5, 0]);

        done();
      });
      snapInteraction.handleEvent(event);
    });

    it('snaps to multi point', function (done) {
      const multiPoint = new Feature(
        new MultiPoint([
          [0, 0],
          [50, 0],
        ]),
      );
      const snapInteraction = new Snap({
        features: new Collection([multiPoint]),
        pixelTolerance: 5,
      });
      snapInteraction.setMap(map);

      const event1 = {
        pixel: [3 + width / 2, height / 2],
        coordinate: [3, 0],
        map: map,
      };
      const event2 = {
        pixel: [53 + width / 2, height / 2],
        coordinate: [53, 0],
        map: map,
      };
      const snapEvents = [];
      snapInteraction.on('snap', function (snapEvent) {
        snapEvents.push(snapEvent);
        if (snapEvents.length != 2) {
          return;
        }
        expect(snapEvent.feature).to.be(multiPoint);
        expect(snapEvent.segment).to.be(null);
        expect(event1.coordinate).to.eql([0, 0]);
        expect(event2.coordinate).to.eql([50, 0]);
        done();
      });
      snapInteraction.handleEvent(event1);
      snapInteraction.handleEvent(event2);
    });

    it('snaps to intersection only', function (done) {
      const line = new Feature(
        new LineString([
          [0, 0],
          [100, 100],
          [0, 100],
          [100, 0],
        ]),
      );
      const snapInteraction = new Snap({
        features: new Collection([line]),
        intersection: true,
        vertex: false,
        edge: false,
      });
      snapInteraction.setMap(map);
      const event = {
        pixel: [48 + width / 2, height / 2 - 48],
        coordinate: [48, 48],
        map: map,
      };
      snapInteraction.on('snap', function (snapEvent) {
        try {
          expect(snapEvent.feature).to.be(line);
          expect(snapEvent.segment).to.be(null);
          expect(event.coordinate).to.eql([50, 50]);
          done();
        } catch (error) {
          done(error);
        }
      });
      snapInteraction.handleEvent(event);
    });

    it('snaps to point along line', function (done) {
      const line = new Feature(
        new LineString([
          [0, 0],
          [50, 0],
        ]),
      );
      const point = new Feature(new Point([5, 0]));
      const snapInteraction = new Snap({
        features: new Collection([line, point]),
      });
      snapInteraction.setMap(map);
      const event = {
        pixel: [16 + width / 2, 5 + height / 2],
        coordinate: [16, 5],
        map: map,
      };
      snapInteraction.on('snap', function (snapEvent) {
        expect(snapEvent.feature).to.be(line);
        expect(snapEvent.segment).to.eql([
          [0, 0],
          [50, 0],
        ]);

        expect(event.coordinate).to.eql([16, 0]);

        done();
      });
      snapInteraction.handleEvent(event);
    });

    it('snaps to circle', function (done) {
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
      snapInteraction.on('snap', function (snapEvent) {
        expect(snapEvent.feature).to.eql(circle);
        expect(snapEvent.segment).to.be(null);

        expect(event.coordinate[0]).to.roughlyEqual(
          Math.sin(Math.PI / 4) * 10,
          1e-10,
        );
        expect(event.coordinate[1]).to.roughlyEqual(
          Math.sin(Math.PI / 4) * 10,
          1e-10,
        );

        done();
      });
      snapInteraction.handleEvent(event);
    });

    it('snaps to circle in a user projection', function (done) {
      const userProjection = 'EPSG:3857';
      setUserProjection(userProjection);
      const viewProjection = map.getView().getProjection();

      const circle = new Feature(
        new Circle([0, 0], 10).transform(viewProjection, userProjection),
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

      const coordinate = transform(
        [Math.sin(Math.PI / 4) * 10, Math.sin(Math.PI / 4) * 10],
        viewProjection,
        userProjection,
      );

      snapInteraction.on('snap', function (snapEvent) {
        expect(snapEvent.feature).to.eql(circle);
        expect(snapEvent.segment).to.be(null);

        expect(event.coordinate[0]).to.roughlyEqual(coordinate[0], 1e-10);
        expect(event.coordinate[1]).to.roughlyEqual(coordinate[1], 1e-10);

        done();
      });
      snapInteraction.handleEvent(event);
    });

    it('handle feature without geometry', function (done) {
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
        ]),
      );

      const event = {
        pixel: [7 + width / 2, height / 2 - 4],
        coordinate: [7, 4],
        map: map,
      };
      snapInteraction.on('snap', function (snapEvent) {
        expect(snapEvent.feature).to.be(feature);
        expect(snapEvent.segment).to.be(null);

        expect(event.coordinate).to.eql([10, 0]);

        done();
      });
      snapInteraction.handleEvent(event);
    });

    it('handle geometry changes', function (done) {
      const line = new Feature(
        new LineString([
          [-10, 0],
          [0, 0],
        ]),
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
      snapInteraction.on('snap', function (snapEvent) {
        expect(snapEvent.feature).to.be(line);
        expect(snapEvent.segment).to.be(null);

        expect(event.coordinate).to.eql([10, 0]);

        done();
      });
      snapInteraction.handleEvent(event);
    });

    it('handle geometry name changes', function (done) {
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

      snapInteraction.on('snap', function (snapEvent) {
        expect(snapEvent.feature).to.be(line);
        expect(snapEvent.segment).to.be(null);

        expect(event.coordinate).to.eql([10, 0]);

        done();
      });

      snapInteraction.handleEvent(event);
    });

    it('unsnaps not snapped to anything', function (done) {
      const point = new Feature(new Point([10, 10]));

      const snapInteraction = new Snap({
        features: new Collection([point]),
      });
      snapInteraction.setMap(map);

      snapInteraction.snapped_ = {
        vertex: [10, 10],
        vertexPixel: [10, 10],
        feature: point,
        segment: null,
      };

      const event = {
        pixel: [50, 50],
        coordinate: [50, 50],
        map: map,
      };

      snapInteraction.on('unsnap', function (snapEvent) {
        expect(snapEvent.feature).to.be(point);
        expect(snapEvent.segment).to.be(null);
        done();
      });

      snapInteraction.handleEvent(event);
    });

    it('unsnaps if snapped to other feature', function (done) {
      const point1 = new Feature(new Point([10, 10]));
      const point2 = new Feature(new Point([30, 30]));

      const snapInteraction = new Snap({
        features: new Collection([point1, point2]),
      });
      snapInteraction.setMap(map);

      snapInteraction.snapped_ = {
        vertex: [10, 10],
        vertexPixel: [10, 10],
        feature: point1,
        segment: null,
      };

      const event = {
        pixel: [30 + width / 2, height / 2 - 30],
        coordinate: [30, 30],
        map: map,
      };

      const snapEvents = [];
      const snapEventHandler = (e) => {
        snapEvents.push(e);
        if (snapEvents.length !== 2) {
          return;
        }
        expect(snapEvents.map((e) => e.type)).to.eql(['unsnap', 'snap']);
        expect(snapEvents.map((e) => e.feature)).to.eql([point1, point2]);
        done();
      };
      snapInteraction.on('unsnap', snapEventHandler);
      snapInteraction.on('snap', snapEventHandler);

      snapInteraction.handleEvent(event);
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
      disposeMap(map);
      clearUserProjection();
      restoreRAF();
    });

    it('snaps to user coordinates', (done) => {
      const lon = -90;
      const lat = 45;
      const point = new Feature(new Point([lon, lat]));

      const snapInteraction = new Snap({
        features: new Collection([point]),
      });
      snapInteraction.setMap(map);

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
      snapInteraction.on('snap', function (snapEvent) {
        expect(snapEvent.feature).to.be(point);
        expect(snapEvent.segment).to.be(null);

        expect(event.coordinate).to.eql([lon, lat]);
        expect(event.pixel).to.eql(expectedPixel);

        done();
      });
      snapInteraction.handleEvent(event);
    });
  });

  describe('setMap', function () {
    let map, featureCollection;

    beforeEach(function () {
      setUserProjection();
      map = new Map({
        target: createMapDiv(),
        view: new View({
          center: [0, 0],
          zoom: 0,
        }),
      });
      featureCollection = new Collection();
      featureCollection.push(new Feature(new Point([0, 0])));
    });

    afterEach(function () {
      disposeMap(map);
      clearUserProjection();
    });

    it('adds and removes feature listeners', function () {
      const feature = featureCollection.item(0);
      const snapInteraction = new Snap({
        features: featureCollection,
      });
      expect(feature.getListeners('change')).to.be(undefined);
      snapInteraction.setMap(map);
      expect(snapInteraction.getMap()).to.eql(map);
      expect(feature.getListeners('change').length).to.be(1);
      snapInteraction.setMap(null);
      expect(snapInteraction.getMap()).to.be(null);
      expect(feature.getListeners('change')).to.be(undefined);
    });
  });

  describe('intersection', () => {
    const cases = [false, true];

    for (const intersection of cases) {
      it('adds intersection point segmentData to rBush_', function () {
        const line1 = new Feature(
          new LineString([
            [0, 0],
            [10, 10],
          ]),
        );
        const line2 = new Feature(
          new LineString([
            [0, 10],
            [10, 0],
          ]),
        );

        const snapInteraction = new Snap({
          features: new Collection([line1, line2]),
          intersection,
        });

        snapInteraction.setMap(new Map({}));

        const rBushItems = snapInteraction.rBush_.getAll();
        const intersectionPoint = [5, 5];
        const intersectionSegmentData = rBushItems.find((item) => {
          return (
            item.segment[0][0] === intersectionPoint[0] &&
            item.segment[0][1] === intersectionPoint[1]
          );
        });

        expect(!!intersectionSegmentData).to.be(intersection);
        if (intersection) {
          expect(intersectionSegmentData.segment[0]).to.eql(intersectionPoint);
          expect(intersectionSegmentData.isIntersection).to.be(true);
        }
      });
    }
  });

  describe('Custom segmenters', () => {
    it('calls custom segmenters and uses their results', function (done) {
      const customSegmenters = {
        Point(geometry) {
          const coordinates = geometry.getCoordinates();
          return [
            [
              [coordinates[0] - 1, coordinates[1]],
              [coordinates[0] + 1, coordinates[1]],
            ],
          ];
        },
      };

      const point = new Feature(new Point([0, 0]));
      const snapInteraction = new Snap({
        features: new Collection([point]),
        segmenters: customSegmenters,
      });
      snapInteraction.setMap(new Map({}));

      const rBushItems = snapInteraction.rBush_.getAll();
      const customSegment = rBushItems.find((item) => {
        return (
          item.segment[0][0] === -1 &&
          item.segment[0][1] === 0 &&
          item.segment[1][0] === 1 &&
          item.segment[1][1] === 0
        );
      });

      expect(!!customSegment).to.be(true);
      done();
    });
  });
});
