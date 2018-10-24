import Collection from '../../../../src/ol/Collection.js';
import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Circle from '../../../../src/ol/geom/Circle.js';
import Point from '../../../../src/ol/geom/Point.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import Snap from '../../../../src/ol/interaction/Snap.js';


describe('ol.interaction.Snap', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      const instance = new Snap();
      expect(instance).to.be.an(Snap);
    });

  });

  describe('handleEvent', function() {
    let target, map;

    const width = 360;
    const height = 180;

    beforeEach(function(done) {
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
          resolution: 1
        })
      });

      map.once('postrender', function() {
        done();
      });
    });

    afterEach(function() {
      map.dispose();
      document.body.removeChild(target);
    });

    it('can handle XYZ coordinates', function() {
      const point = new Feature(new Point([0, 0, 123]));
      const snapInteraction = new Snap({
        features: new Collection([point])
      });
      snapInteraction.setMap(map);

      const event = {
        pixel: [width / 2, height / 2],
        coordinate: [0, 0],
        map: map
      };
      snapInteraction.handleEvent(event);
      // check that the coordinate is in XY and not XYZ
      expect(event.coordinate).to.eql([0, 0]);
    });

    it('snaps to edges only', function() {
      const point = new Feature(new LineString([[-10, 0], [10, 0]]));
      const snapInteraction = new Snap({
        features: new Collection([point]),
        pixelTolerance: 5,
        vertex: false
      });
      snapInteraction.setMap(map);

      const event = {
        pixel: [7 + width / 2, height / 2 - 4],
        coordinate: [7, 4],
        map: map
      };
      snapInteraction.handleEvent(event);
      expect(event.coordinate).to.eql([7, 0]);
    });

    it('snaps to vertices only', function() {
      const point = new Feature(new LineString([[-10, 0], [10, 0]]));
      const snapInteraction = new Snap({
        features: new Collection([point]),
        pixelTolerance: 5,
        edge: false
      });
      snapInteraction.setMap(map);

      const event = {
        pixel: [7 + width / 2, height / 2 - 4],
        coordinate: [7, 4],
        map: map
      };
      snapInteraction.handleEvent(event);
      expect(event.coordinate).to.eql([10, 0]);
    });

    it('snaps to circle', function() {
      const circle = new Feature(new Circle([0, 0], 10));
      const snapInteraction = new Snap({
        features: new Collection([circle]),
        pixelTolerance: 5
      });
      snapInteraction.setMap(map);

      const event = {
        pixel: [5 + width / 2, height / 2 - 5],
        coordinate: [5, 5],
        map: map
      };
      snapInteraction.handleEvent(event);

      expect(event.coordinate[0]).to.roughlyEqual(Math.sin(Math.PI / 4) * 10, 1e-10);
      expect(event.coordinate[1]).to.roughlyEqual(Math.sin(Math.PI / 4) * 10, 1e-10);
    });

    it('handle feature without geometry', function() {
      const feature = new Feature();
      const snapInteraction = new Snap({
        features: new Collection([feature]),
        pixelTolerance: 5,
        edge: false
      });
      snapInteraction.setMap(map);

      feature.setGeometry(new LineString([[-10, 0], [10, 0]]));

      const event = {
        pixel: [7 + width / 2, height / 2 - 4],
        coordinate: [7, 4],
        map: map
      };
      snapInteraction.handleEvent(event);
      expect(event.coordinate).to.eql([10, 0]);
    });

    it('handle geometry changes', function() {
      const line = new Feature(new LineString([[-10, 0], [0, 0]]));
      const snapInteraction = new Snap({
        features: new Collection([line]),
        pixelTolerance: 5,
        edge: false
      });
      snapInteraction.setMap(map);

      line.getGeometry().setCoordinates([[-10, 0], [10, 0]]);

      const event = {
        pixel: [7 + width / 2, height / 2 - 4],
        coordinate: [7, 4],
        map: map
      };
      snapInteraction.handleEvent(event);
      expect(event.coordinate).to.eql([10, 0]);
    });

    it('handle geometry name changes', function() {
      const line = new Feature({
        geometry: new LineString([[-10, 0], [0, 0]]),
        alt_geometry: new LineString([[-10, 0], [10, 0]])
      });
      const snapInteraction = new Snap({
        features: new Collection([line]),
        pixelTolerance: 5,
        edge: false
      });
      snapInteraction.setMap(map);

      line.setGeometryName('alt_geometry');

      const event = {
        pixel: [7 + width / 2, height / 2 - 4],
        coordinate: [7, 4],
        map: map
      };
      snapInteraction.handleEvent(event);
      expect(event.coordinate).to.eql([10, 0]);
    });


  });

});
