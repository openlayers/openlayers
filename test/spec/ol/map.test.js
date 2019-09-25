import Feature from '../../../src/ol/Feature.js';
import ImageState from '../../../src/ol/ImageState.js';
import Map from '../../../src/ol/Map.js';
import MapEvent from '../../../src/ol/MapEvent.js';
import Overlay from '../../../src/ol/Overlay.js';
import View from '../../../src/ol/View.js';
import {LineString, Point} from '../../../src/ol/geom.js';
import {focus} from '../../../src/ol/events/condition.js';
import {defaults as defaultInteractions} from '../../../src/ol/interaction.js';
import {get as getProjection, useGeographic, transform, clearUserProjection} from '../../../src/ol/proj.js';
import GeoJSON from '../../../src/ol/format/GeoJSON.js';
import DragPan from '../../../src/ol/interaction/DragPan.js';
import DoubleClickZoom from '../../../src/ol/interaction/DoubleClickZoom.js';
import Interaction from '../../../src/ol/interaction/Interaction.js';
import MouseWheelZoom from '../../../src/ol/interaction/MouseWheelZoom.js';
import PinchZoom from '../../../src/ol/interaction/PinchZoom.js';
import ImageLayer from '../../../src/ol/layer/Image.js';
import TileLayer from '../../../src/ol/layer/Tile.js';
import VectorLayer from '../../../src/ol/layer/Vector.js';
import TileLayerRenderer from '../../../src/ol/renderer/canvas/TileLayer.js';
import ImageStatic from '../../../src/ol/source/ImageStatic.js';
import VectorSource from '../../../src/ol/source/Vector.js';
import XYZ from '../../../src/ol/source/XYZ.js';

describe('ol.Map', () => {

  describe('constructor', () => {
    test('creates a new map', () => {
      const map = new Map({});
      expect(map).toBeInstanceOf(Map);
    });

    test('creates a set of default interactions', () => {
      const map = new Map({});
      const interactions = map.getInteractions();
      const length = interactions.getLength();
      expect(length).toBeGreaterThan(0);

      for (let i = 0; i < length; ++i) {
        expect(interactions.item(i).getMap()).toBe(map);
      }
    });

    test('creates the viewport', () => {
      const map = new Map({});
      const viewport = map.getViewport();
      const className = 'ol-viewport' + ('ontouchstart' in window ? ' ol-touch' : '');
      expect(viewport.className).toBe(className);
    });

    test('creates the overlay containers', () => {
      const map = new Map({});
      const container = map.getOverlayContainer();
      expect(container.className).toBe('ol-overlaycontainer');

      const containerStop = map.getOverlayContainerStopEvent();
      expect(containerStop.className).toBe('ol-overlaycontainer-stopevent');
    });

  });

  describe('#addLayer()', () => {
    test('adds a layer to the map', () => {
      const map = new Map({});
      const layer = new TileLayer();
      map.addLayer(layer);

      expect(map.getLayers().item(0)).toBe(layer);
    });

    test('throws if a layer is added twice', () => {
      const map = new Map({});
      const layer = new TileLayer();
      map.addLayer(layer);

      const call = function() {
        map.addLayer(layer);
      };
      expect(call).toThrow();
    });
  });

  describe('#addInteraction()', () => {
    test('adds an interaction to the map', () => {
      const map = new Map({});
      const interaction = new Interaction({});

      const before = map.getInteractions().getLength();
      map.addInteraction(interaction);
      const after = map.getInteractions().getLength();
      expect(after).toBe(before + 1);
      expect(interaction.getMap()).toBe(map);
    });
  });

  describe('#removeInteraction()', () => {
    test('removes an interaction from the map', () => {
      const map = new Map({});
      const interaction = new Interaction({});

      const before = map.getInteractions().getLength();
      map.addInteraction(interaction);

      map.removeInteraction(interaction);
      expect(map.getInteractions().getLength()).toBe(before);

      expect(interaction.getMap()).toBe(null);
    });
  });

  describe('movestart/moveend event', () => {

    let target, view, map;

    beforeEach(() => {
      target = document.createElement('div');

      const style = target.style;
      style.position = 'absolute';
      style.left = '-1000px';
      style.top = '-1000px';
      style.width = '360px';
      style.height = '180px';
      document.body.appendChild(target);

      view = new View({
        projection: 'EPSG:4326'
      });
      map = new Map({
        target: target,
        view: view,
        layers: [
          new TileLayer({
            source: new XYZ({
              url: '#{x}/{y}/{z}'
            })
          })
        ]
      });
    });

    afterEach(() => {
      map.dispose();
      document.body.removeChild(target);
    });

    test('are fired only once after view changes', done => {
      const center = [10, 20];
      const zoom = 3;
      let startCalls = 0;
      let endCalls = 0;
      map.on('movestart', function() {
        ++startCalls;
        expect(startCalls).toBe(1);
      });
      map.on('moveend', function() {
        ++endCalls;
        expect(endCalls).toBe(1);
        expect(view.getCenter()).toEqual(center);
        expect(view.getZoom()).toBe(zoom);
        window.setTimeout(done, 1000);
      });

      view.setCenter(center);
      view.setZoom(zoom);
    });

    test('are fired in sequence', done => {
      view.setCenter([0, 0]);
      view.setResolution(0.703125);
      map.renderSync();
      const center = [10, 20];
      const zoom = 3;
      const calls = [];
      map.on('movestart', function(e) {
        calls.push('start');
        expect(calls).toEqual(['start']);
        expect(e.frameState.viewState.center).toEqual([0, 0]);
        expect(e.frameState.viewState.resolution).toBe(0.703125);
      });
      map.on('moveend', function() {
        calls.push('end');
        expect(calls).toEqual(['start', 'end']);
        expect(view.getCenter()).toEqual(center);
        expect(view.getZoom()).toBe(zoom);
        done();
      });

      view.setCenter(center);
      view.setZoom(zoom);
    });

  });

  describe('rendercomplete event', () => {

    let map;
    beforeEach(() => {
      const target = document.createElement('div');
      target.style.width = target.style.height = '100px';
      document.body.appendChild(target);
      map = new Map({
        target: target,
        layers: [
          new TileLayer({
            opacity: 0.5,
            source: new XYZ({
              url: 'spec/ol/data/osm-{z}-{x}-{y}.png'
            })
          }),
          new ImageLayer({
            source: new ImageStatic({
              url: 'spec/ol/data/osm-0-0-0.png',
              imageExtent: getProjection('EPSG:3857').getExtent(),
              projection: 'EPSG:3857'
            })
          }),
          new VectorLayer({
            source: new VectorSource({
              url: 'spec/ol/data/point.json',
              format: new GeoJSON()
            })
          }),
          new VectorLayer({
            source: new VectorSource({
              features: [
                new Feature(new Point([0, 0]))
              ]
            })
          })
        ]
      });
    });

    afterEach(() => {
      document.body.removeChild(map.getTargetElement());
      map.setTarget(null);
      map.dispose();
    });

    test(
      'triggers when all tiles and sources are loaded and faded in',
      done => {
        map.once('rendercomplete', function() {
          const layers = map.getLayers().getArray();
          expect(map.tileQueue_.getTilesLoading()).toBe(0);
          expect(layers[1].getSource().image_.getState()).toBe(ImageState.LOADED);
          expect(layers[2].getSource().getFeatures().length).toBe(1);
          done();
        });
        map.setView(new View({
          center: [0, 0],
          zoom: 0
        }));
      }
    );

  });

  describe('#getFeaturesAtPixel', () => {

    let target, map;
    beforeEach(() => {
      target = document.createElement('div');
      target.style.width = target.style.height = '100px';
      document.body.appendChild(target);
      map = new Map({
        target: target,
        layers: [new VectorLayer({
          source: new VectorSource({
            features: [new Feature(new LineString([[-50, 0], [50, 0]]))]
          })
        })],
        view: new View({
          center: [0, 0],
          zoom: 17
        })
      });
      map.renderSync();
    });
    afterEach(() => {
      document.body.removeChild(target);
    });

    test('returns an empty array if no feature was found', () => {
      const features = map.getFeaturesAtPixel([0, 0]);
      expect(features).toBeInstanceOf(Array);
      expect(features).toHaveLength(0);
    });

    test('returns an array of found features', () => {
      const features = map.getFeaturesAtPixel([50, 50]);
      expect(features).toBeInstanceOf(Array);
      expect(features[0]).toBeInstanceOf(Feature);
    });

    test('returns an array of found features with declutter: true', () => {
      const layer = map.getLayers().item(0);
      map.removeLayer(layer);
      const otherLayer = new VectorLayer({
        declutter: true,
        source: layer.getSource()
      });
      map.addLayer(otherLayer);
      map.renderSync();
      const features = map.getFeaturesAtPixel([50, 50]);
      expect(features).toBeInstanceOf(Array);
      expect(features[0]).toBeInstanceOf(Feature);
    });

    test('respects options', () => {
      const otherLayer = new VectorLayer({
        source: new VectorSource
      });
      map.addLayer(otherLayer);
      const features = map.getFeaturesAtPixel([50, 50], {
        layerFilter: function(layer) {
          return layer === otherLayer;
        }
      });
      expect(features).toBeInstanceOf(Array);
      expect(features).toHaveLength(0);
    });

  });

  describe('#forEachLayerAtPixel()', () => {

    let target, map, original, log;

    beforeEach(done => {
      log = [];
      original = TileLayerRenderer.prototype.getDataAtPixel;
      TileLayerRenderer.prototype.getDataAtPixel = function(pixel) {
        log.push(pixel.slice());
      };

      target = document.createElement('div');
      const style = target.style;
      style.position = 'absolute';
      style.left = '-1000px';
      style.top = '-1000px';
      style.width = '360px';
      style.height = '180px';
      document.body.appendChild(target);

      map = new Map({
        target: target,
        view: new View({
          center: [0, 0],
          zoom: 1
        }),
        layers: [
          new TileLayer({
            source: new XYZ()
          }),
          new TileLayer({
            source: new XYZ()
          }),
          new TileLayer({
            source: new XYZ()
          })
        ]
      });

      map.once('postrender', function() {
        done();
      });
    });

    afterEach(() => {
      TileLayerRenderer.prototype.getDataAtPixel = original;
      map.dispose();
      document.body.removeChild(target);
      log = null;
    });

    test('calls each layer renderer with the same pixel', () => {
      const pixel = [10, 20];
      map.forEachLayerAtPixel(pixel, function() {});
      expect(log.length).toBe(3);
      expect(log[0].length).toBe(2);
      expect(log[0]).toEqual(log[1]);
      expect(log[1]).toEqual(log[2]);
    });

  });

  describe('#render()', () => {

    let target, map;

    beforeEach(() => {
      target = document.createElement('div');
      const style = target.style;
      style.position = 'absolute';
      style.left = '-1000px';
      style.top = '-1000px';
      style.width = '360px';
      style.height = '180px';
      document.body.appendChild(target);
      map = new Map({
        target: target,
        view: new View({
          projection: 'EPSG:4326',
          center: [0, 0],
          resolution: 1
        })
      });
    });

    afterEach(() => {
      map.dispose();
      document.body.removeChild(target);
    });

    test('is called when the view.changed() is called', () => {
      const view = map.getView();

      const spy = sinon.spy(map, 'render');
      view.changed();
      expect(spy.callCount).toBe(1);
    });

    test(
      'is not called on view changes after the view has been removed',
      () => {
        const view = map.getView();
        map.setView(null);

        const spy = sinon.spy(map, 'render');
        view.changed();
        expect(spy.callCount).toBe(0);
      }
    );

    test('calls renderFrame_ and results in an postrender event', done => {

      const spy = sinon.spy(map, 'renderFrame_');
      map.render();
      map.once('postrender', function(event) {
        expect(event).toBeInstanceOf(MapEvent);
        expect(typeof spy.firstCall.args[0]).toBe('number');
        spy.restore();
        const frameState = event.frameState;
        expect(frameState).not.toBe(null);
        done();
      });

    });

    test('uses the same render frame for subsequent calls', done => {
      map.render();
      const id1 = map.animationDelayKey_;
      let id2 = null;
      map.once('postrender', function() {
        expect(id2).toBe(id1);
        done();
      });
      map.render();
      id2 = map.animationDelayKey_;
    });

    test('creates a new render frame after renderSync()', done => {
      let id2 = null;
      map.render();
      const id1 = map.animationDelayKey_;
      map.once('postrender', function() {
        expect(id2).not.toBe(id1);
        done();
      });
      map.renderSync();
      id2 = map.animationDelayKey_;
    });

    test('results in an postrender event (for zero height map)', done => {
      target.style.height = '0px';
      map.updateSize();

      map.render();
      map.once('postrender', function(event) {
        expect(event).toBeInstanceOf(MapEvent);
        const frameState = event.frameState;
        expect(frameState).toBe(null);
        done();
      });

    });

    test('results in an postrender event (for zero width map)', done => {
      target.style.width = '0px';
      map.updateSize();

      map.render();
      map.once('postrender', function(event) {
        expect(event).toBeInstanceOf(MapEvent);
        const frameState = event.frameState;
        expect(frameState).toBe(null);
        done();
      });

    });

  });

  describe('dispose', () => {
    let map;

    beforeEach(() => {
      map = new Map({
        target: document.createElement('div')
      });
    });

    test('removes the viewport from its parent', () => {
      map.dispose();
      expect(map.getViewport().parentNode).toBe(null);
    });

    test('removes window listeners', () => {
      map.dispose();
      expect(map.handleResize_).toBe(undefined);
    });
  });

  describe('#setTarget', () => {
    let map;

    beforeEach(() => {
      map = new Map({
        target: document.createElement('div')
      });
      expect(map.handleResize_).toBeTruthy();
    });

    describe('call setTarget with null', () => {
      test('unregisters the viewport resize listener', () => {
        map.setTarget(null);
        expect(map.handleResize_).toBe(undefined);
      });
    });

    describe('call setTarget with an element', () => {
      test('registers a viewport resize listener', () => {
        map.setTarget(null);
        map.setTarget(document.createElement('div'));
        expect(map.handleResize_).toBeTruthy();
      });
    });

  });

  describe('create interactions', () => {

    let options;

    beforeEach(() => {
      options = {
        altShiftDragRotate: false,
        doubleClickZoom: false,
        keyboard: false,
        mouseWheelZoom: false,
        shiftDragZoom: false,
        dragPan: false,
        pinchRotate: false,
        pinchZoom: false
      };
    });

    describe('create mousewheel interaction', () => {
      test('creates mousewheel interaction', () => {
        options.mouseWheelZoom = true;
        const interactions = defaultInteractions(options);
        expect(interactions.getLength()).toEqual(1);
        expect(interactions.item(0)).toBeInstanceOf(MouseWheelZoom);
        expect(interactions.item(0).useAnchor_).toEqual(true);
        interactions.item(0).setMouseAnchor(false);
        expect(interactions.item(0).useAnchor_).toEqual(false);
        expect(interactions.item(0).condition_).not.toBe(focus);
      });
      test('uses the focus condition when onFocusOnly option is set', () => {
        options.onFocusOnly = true;
        options.mouseWheelZoom = true;
        const interactions = defaultInteractions(options);
        expect(interactions.item(0).condition_).toBe(focus);
      });
    });

    describe('create dragpan interaction', () => {
      test('creates dragpan interaction', () => {
        options.dragPan = true;
        const interactions = defaultInteractions(options);
        expect(interactions.getLength()).toEqual(1);
        expect(interactions.item(0)).toBeInstanceOf(DragPan);
        expect(interactions.item(0).condition_).not.toBe(focus);
      });
      test('uses the focus condition when onFocusOnly option is set', () => {
        options.onFocusOnly = true;
        options.dragPan = true;
        const interactions = defaultInteractions(options);
        expect(interactions.item(0).condition_).toBe(focus);
      });
    });

    describe('create pinchZoom interaction', () => {
      test('creates pinchZoom interaction', () => {
        options.pinchZoom = true;
        const interactions = defaultInteractions(options);
        expect(interactions.getLength()).toEqual(1);
        expect(interactions.item(0)).toBeInstanceOf(PinchZoom);
      });
    });

    describe('create double click interaction', () => {

      beforeEach(() => {
        options.doubleClickZoom = true;
      });

      describe('default zoomDelta', () => {
        test('create double click interaction with default delta', () => {
          const interactions = defaultInteractions(options);
          expect(interactions.getLength()).toEqual(1);
          expect(interactions.item(0)).toBeInstanceOf(DoubleClickZoom);
          expect(interactions.item(0).delta_).toEqual(1);
        });
      });

      describe('set zoomDelta', () => {
        test('create double click interaction with set delta', () => {
          options.zoomDelta = 7;
          const interactions = defaultInteractions(options);
          expect(interactions.getLength()).toEqual(1);
          expect(interactions.item(0)).toBeInstanceOf(DoubleClickZoom);
          expect(interactions.item(0).delta_).toEqual(7);
        });
      });
    });

    describe('#getEventPixel', () => {

      let target;

      beforeEach(() => {
        target = document.createElement('div');
        target.style.position = 'absolute';
        target.style.top = '10px';
        target.style.left = '20px';
        target.style.width = '800px';
        target.style.height = '400px';

        document.body.appendChild(target);
      });
      afterEach(() => {
        document.body.removeChild(target);
      });

      test('works with touchend events', () => {

        const map = new Map({
          target: target
        });

        const browserEvent = {
          type: 'touchend',
          target: target,
          changedTouches: [{
            clientX: 100,
            clientY: 200
          }]
        };
        const position = map.getEventPixel(browserEvent);
        expect(position[0]).toEqual(80);
        expect(position[1]).toEqual(190);
      });
    });

    describe('#getOverlayById()', () => {
      let target, map, overlay, overlay_target;

      beforeEach(() => {
        target = document.createElement('div');
        const style = target.style;
        style.position = 'absolute';
        style.left = '-1000px';
        style.top = '-1000px';
        style.width = '360px';
        style.height = '180px';
        document.body.appendChild(target);
        map = new Map({
          target: target,
          view: new View({
            projection: 'EPSG:4326',
            center: [0, 0],
            resolution: 1
          })
        });
        overlay_target = document.createElement('div');
      });

      afterEach(() => {
        map.removeOverlay(overlay);
        map.dispose();
        document.body.removeChild(target);
      });

      test('returns an overlay by id', () => {
        overlay = new Overlay({
          id: 'foo',
          element: overlay_target,
          position: [0, 0]
        });
        map.addOverlay(overlay);
        expect(map.getOverlayById('foo')).toBe(overlay);
      });

      test('returns null when no overlay is found', () => {
        overlay = new Overlay({
          id: 'foo',
          element: overlay_target,
          position: [0, 0]
        });
        map.addOverlay(overlay);
        expect(map.getOverlayById('bar')).toBe(null);
      });

      test('returns null after removing overlay', () => {
        overlay = new Overlay({
          id: 'foo',
          element: overlay_target,
          position: [0, 0]
        });
        map.addOverlay(overlay);
        expect(map.getOverlayById('foo')).toBe(overlay);
        map.removeOverlay(overlay);
        expect(map.getOverlayById('foo')).toBe(null);
      });

    });

    describe('getCoordinateFromPixel() and getPixelFromCoordinate()', () => {

      let target, view, map;
      const centerGeographic = [2.460938, 48.850258];
      const centerMercator = transform(centerGeographic, getProjection('EPSG:4326'), getProjection('EPSG:3857'));
      const screenCenter = [500, 500];

      beforeEach(() => {
        target = document.createElement('div');

        const style = target.style;
        style.position = 'absolute';
        style.left = '-1000px';
        style.top = '-1000px';
        style.width = `${screenCenter[0] * 2}px`;
        style.height = `${screenCenter[1] * 2}px`;
        document.body.appendChild(target);

        useGeographic();

        view = new View({
          center: centerGeographic,
          zoom: 3
        });
        map = new Map({
          target: target,
          view: view,
          layers: [
            new TileLayer({
              source: new XYZ({
                url: '#{x}/{y}/{z}'
              })
            })
          ]
        });
      });

      afterEach(() => {
        map.dispose();
        document.body.removeChild(target);
        clearUserProjection();
      });

      test('gets coordinates in user projection', done => {
        map.renderSync();
        const coordinateGeographic = map.getCoordinateFromPixel(screenCenter);
        expect(coordinateGeographic[0]).to.roughlyEqual(centerGeographic[0], 1e-5);
        expect(coordinateGeographic[1]).to.roughlyEqual(centerGeographic[1], 1e-5);
        done();
      });

      test('gets coordinates in view projection', done => {
        map.renderSync();
        const coordinateMercator = map.getCoordinateFromPixelInternal(screenCenter);
        expect(coordinateMercator[0]).to.roughlyEqual(centerMercator[0], 1e-5);
        expect(coordinateMercator[1]).to.roughlyEqual(centerMercator[1], 1e-5);
        done();
      });

      test('gets pixel from coordinates in user projection', done => {
        map.renderSync();
        const pixel = map.getPixelFromCoordinate(centerGeographic);
        expect(pixel).toEqual(screenCenter);
        done();
      });

      test('gets pixel from coordinates in view projection', done => {
        map.renderSync();
        const pixel = map.getPixelFromCoordinateInternal(centerMercator);
        expect(pixel).toEqual(screenCenter);
        done();
      });
    });
  });
});
