import Feature from '../../../src/ol/Feature.js';
import ImageState from '../../../src/ol/ImageState.js';
import Map from '../../../src/ol/Map.js';
import MapEvent from '../../../src/ol/MapEvent.js';
import Overlay from '../../../src/ol/Overlay.js';
import View from '../../../src/ol/View.js';
import {LineString, Point} from '../../../src/ol/geom';
import {TOUCH} from '../../../src/ol/has.js';
import {focus} from '../../../src/ol/events/condition.js';
import {defaults as defaultInteractions} from '../../../src/ol/interaction.js';
import {get as getProjection} from '../../../src/ol/proj.js';
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

describe('ol.Map', function() {

  describe('constructor', function() {
    it('creates a new map', function() {
      const map = new Map({});
      expect(map).to.be.a(Map);
    });

    it('creates a set of default interactions', function() {
      const map = new Map({});
      const interactions = map.getInteractions();
      const length = interactions.getLength();
      expect(length).to.be.greaterThan(0);

      for (let i = 0; i < length; ++i) {
        expect(interactions.item(i).getMap()).to.be(map);
      }
    });

    it('creates the viewport', function() {
      const map = new Map({});
      const viewport = map.getViewport();
      const className = 'ol-viewport' + (TOUCH ? ' ol-touch' : '');
      expect(viewport.className).to.be(className);
    });

    it('creates the overlay containers', function() {
      const map = new Map({});
      const container = map.getOverlayContainer();
      expect(container.className).to.be('ol-overlaycontainer');

      const containerStop = map.getOverlayContainerStopEvent();
      expect(containerStop.className).to.be('ol-overlaycontainer-stopevent');
    });

  });

  describe('#addLayer()', function() {
    it('adds a layer to the map', function() {
      const map = new Map({});
      const layer = new TileLayer();
      map.addLayer(layer);

      expect(map.getLayers().item(0)).to.be(layer);
    });

    it('throws if a layer is added twice', function() {
      const map = new Map({});
      const layer = new TileLayer();
      map.addLayer(layer);

      const call = function() {
        map.addLayer(layer);
      };
      expect(call).to.throwException();
    });
  });

  describe('#addInteraction()', function() {
    it('adds an interaction to the map', function() {
      const map = new Map({});
      const interaction = new Interaction({});

      const before = map.getInteractions().getLength();
      map.addInteraction(interaction);
      const after = map.getInteractions().getLength();
      expect(after).to.be(before + 1);
      expect(interaction.getMap()).to.be(map);
    });
  });

  describe('#removeInteraction()', function() {
    it('removes an interaction from the map', function() {
      const map = new Map({});
      const interaction = new Interaction({});

      const before = map.getInteractions().getLength();
      map.addInteraction(interaction);

      map.removeInteraction(interaction);
      expect(map.getInteractions().getLength()).to.be(before);

      expect(interaction.getMap()).to.be(null);
    });
  });

  describe('movestart/moveend event', function() {

    let target, view, map;

    beforeEach(function() {
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

    afterEach(function() {
      map.dispose();
      document.body.removeChild(target);
    });

    it('are fired only once after view changes', function(done) {
      const center = [10, 20];
      const zoom = 3;
      let startCalls = 0;
      let endCalls = 0;
      map.on('movestart', function() {
        ++startCalls;
        expect(startCalls).to.be(1);
      });
      map.on('moveend', function() {
        ++endCalls;
        expect(endCalls).to.be(1);
        expect(view.getCenter()).to.eql(center);
        expect(view.getZoom()).to.be(zoom);
        window.setTimeout(done, 1000);
      });

      view.setCenter(center);
      view.setZoom(zoom);
    });

    it('are fired in sequence', function(done) {
      view.setCenter([0, 0]);
      view.setResolution(0.703125);
      map.renderSync();
      const center = [10, 20];
      const zoom = 3;
      const calls = [];
      map.on('movestart', function(e) {
        calls.push('start');
        expect(calls).to.eql(['start']);
        expect(e.frameState.viewState.center).to.eql([0, 0]);
        expect(e.frameState.viewState.resolution).to.be(0.703125);
      });
      map.on('moveend', function() {
        calls.push('end');
        expect(calls).to.eql(['start', 'end']);
        expect(view.getCenter()).to.eql(center);
        expect(view.getZoom()).to.be(zoom);
        done();
      });

      view.setCenter(center);
      view.setZoom(zoom);
    });

  });

  describe('rendercomplete event', function() {

    let map;
    beforeEach(function() {
      const target = document.createElement('div');
      target.style.width = target.style.height = '100px';
      document.body.appendChild(target);
      map = new Map({
        target: target,
        layers: [
          new TileLayer({
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

    afterEach(function() {
      document.body.removeChild(map.getTargetElement());
      map.setTarget(null);
      map.dispose();
    });

    it('triggers when all tiles and sources are loaded and faded in', function(done) {
      map.once('rendercomplete', function() {
        const layers = map.getLayers().getArray();
        expect(map.tileQueue_.getTilesLoading()).to.be(0);
        expect(layers[1].getSource().image_.getState()).to.be(ImageState.LOADED);
        expect(layers[2].getSource().getFeatures().length).to.be(1);
        done();
      });
      map.setView(new View({
        center: [0, 0],
        zoom: 0
      }));
    });

  });

  describe('#getFeaturesAtPixel', function() {

    let target, map;
    beforeEach(function() {
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
    afterEach(function() {
      document.body.removeChild(target);
    });

    it('returns null if no feature was found', function() {
      const features = map.getFeaturesAtPixel([0, 0]);
      expect(features).to.be(null);
    });

    it('returns an array of found features', function() {
      const features = map.getFeaturesAtPixel([50, 50]);
      expect(features).to.be.an(Array);
      expect(features[0]).to.be.an(Feature);
    });

    it('returns an array of found features with declutter: true', function() {
      const layer = map.getLayers().item(0);
      map.removeLayer(layer);
      const otherLayer = new VectorLayer({
        declutter: true,
        source: layer.getSource()
      });
      map.addLayer(otherLayer);
      map.renderSync();
      const features = map.getFeaturesAtPixel([50, 50]);
      expect(features).to.be.an(Array);
      expect(features[0]).to.be.a(Feature);
    });

    it('respects options', function() {
      const otherLayer = new VectorLayer({
        source: new VectorSource
      });
      map.addLayer(otherLayer);
      const features = map.getFeaturesAtPixel([50, 50], {
        layerFilter: function(layer) {
          return layer == otherLayer;
        }
      });
      expect(features).to.be(null);
    });

  });

  describe('#forEachLayerAtPixel()', function() {

    let target, map, original, log;

    beforeEach(function(done) {
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

    afterEach(function() {
      TileLayerRenderer.prototype.getDataAtPixel = original;
      map.dispose();
      document.body.removeChild(target);
      log = null;
    });

    it('calls each layer renderer with the same pixel', function() {
      const pixel = [10, 20];
      map.forEachLayerAtPixel(pixel, function() {});
      expect(log.length).to.equal(3);
      expect(log[0].length).to.equal(2);
      expect(log[0]).to.eql(log[1]);
      expect(log[1]).to.eql(log[2]);
    });

  });

  describe('#render()', function() {

    let target, map;

    beforeEach(function() {
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

    afterEach(function() {
      map.dispose();
      document.body.removeChild(target);
    });

    it('is called when the view.changed() is called', function() {
      const view = map.getView();

      const spy = sinon.spy(map, 'render');
      view.changed();
      expect(spy.callCount).to.be(1);
    });

    it('is not called on view changes after the view has been removed', function() {
      const view = map.getView();
      map.setView(null);

      const spy = sinon.spy(map, 'render');
      view.changed();
      expect(spy.callCount).to.be(0);
    });

    it('calls renderFrame_ and results in an postrender event', function(done) {

      const spy = sinon.spy(map, 'renderFrame_');
      map.render();
      map.once('postrender', function(event) {
        expect(event).to.be.a(MapEvent);
        expect(typeof spy.firstCall.args[0]).to.be('number');
        spy.restore();
        const frameState = event.frameState;
        expect(frameState).not.to.be(null);
        done();
      });

    });

    it('uses the same render frame for subsequent calls', function(done) {
      map.render();
      const id1 = map.animationDelayKey_;
      let id2 = null;
      map.once('postrender', function() {
        expect(id2).to.be(id1);
        done();
      });
      map.render();
      id2 = map.animationDelayKey_;
    });

    it('creates a new render frame after renderSync()', function(done) {
      let id2 = null;
      map.render();
      const id1 = map.animationDelayKey_;
      map.once('postrender', function() {
        expect(id2).to.not.be(id1);
        done();
      });
      map.renderSync();
      id2 = map.animationDelayKey_;
    });

    it('results in an postrender event (for zero height map)', function(done) {
      target.style.height = '0px';
      map.updateSize();

      map.render();
      map.once('postrender', function(event) {
        expect(event).to.be.a(MapEvent);
        const frameState = event.frameState;
        expect(frameState).to.be(null);
        done();
      });

    });

    it('results in an postrender event (for zero width map)', function(done) {
      target.style.width = '0px';
      map.updateSize();

      map.render();
      map.once('postrender', function(event) {
        expect(event).to.be.a(MapEvent);
        const frameState = event.frameState;
        expect(frameState).to.be(null);
        done();
      });

    });

  });

  describe('dispose', function() {
    let map;

    beforeEach(function() {
      map = new Map({
        target: document.createElement('div')
      });
    });

    it('removes the viewport from its parent', function() {
      map.dispose();
      expect(map.getViewport().parentNode).to.be(null);
    });

    it('removes window listeners', function() {
      map.dispose();
      expect(map.handleResize_).to.be(undefined);
    });
  });

  describe('#setTarget', function() {
    let map;

    beforeEach(function() {
      map = new Map({
        target: document.createElement('div')
      });
      expect(map.handleResize_).to.be.ok();
    });

    describe('call setTarget with null', function() {
      it('unregisters the viewport resize listener', function() {
        map.setTarget(null);
        expect(map.handleResize_).to.be(undefined);
      });
    });

    describe('call setTarget with an element', function() {
      it('registers a viewport resize listener', function() {
        map.setTarget(null);
        map.setTarget(document.createElement('div'));
        expect(map.handleResize_).to.be.ok();
      });
    });

  });

  describe('create interactions', function() {

    let options;

    beforeEach(function() {
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

    describe('create mousewheel interaction', function() {
      it('creates mousewheel interaction', function() {
        options.mouseWheelZoom = true;
        const interactions = defaultInteractions(options);
        expect(interactions.getLength()).to.eql(1);
        expect(interactions.item(0)).to.be.a(MouseWheelZoom);
        expect(interactions.item(0).useAnchor_).to.eql(true);
        interactions.item(0).setMouseAnchor(false);
        expect(interactions.item(0).useAnchor_).to.eql(false);
        expect(interactions.item(0).condition_).to.not.be(focus);
      });
      it('uses the focus condition when onFocusOnly option is set', function() {
        options.onFocusOnly = true;
        options.mouseWheelZoom = true;
        const interactions = defaultInteractions(options);
        expect(interactions.item(0).condition_).to.be(focus);
      });
    });

    describe('create dragpan interaction', function() {
      it('creates dragpan interaction', function() {
        options.dragPan = true;
        const interactions = defaultInteractions(options);
        expect(interactions.getLength()).to.eql(1);
        expect(interactions.item(0)).to.be.a(DragPan);
        expect(interactions.item(0).condition_).to.not.be(focus);
      });
      it('uses the focus condition when onFocusOnly option is set', function() {
        options.onFocusOnly = true;
        options.dragPan = true;
        const interactions = defaultInteractions(options);
        expect(interactions.item(0).condition_).to.be(focus);
      });
    });

    describe('create pinchZoom interaction', function() {
      it('creates pinchZoom interaction', function() {
        options.pinchZoom = true;
        const interactions = defaultInteractions(options);
        expect(interactions.getLength()).to.eql(1);
        expect(interactions.item(0)).to.be.a(PinchZoom);
      });
    });

    describe('create double click interaction', function() {

      beforeEach(function() {
        options.doubleClickZoom = true;
      });

      describe('default zoomDelta', function() {
        it('create double click interaction with default delta', function() {
          const interactions = defaultInteractions(options);
          expect(interactions.getLength()).to.eql(1);
          expect(interactions.item(0)).to.be.a(DoubleClickZoom);
          expect(interactions.item(0).delta_).to.eql(1);
        });
      });

      describe('set zoomDelta', function() {
        it('create double click interaction with set delta', function() {
          options.zoomDelta = 7;
          const interactions = defaultInteractions(options);
          expect(interactions.getLength()).to.eql(1);
          expect(interactions.item(0)).to.be.a(DoubleClickZoom);
          expect(interactions.item(0).delta_).to.eql(7);
        });
      });
    });

    describe('#getEventPixel', function() {

      let target;

      beforeEach(function() {
        target = document.createElement('div');
        target.style.position = 'absolute';
        target.style.top = '10px';
        target.style.left = '20px';
        target.style.width = '800px';
        target.style.height = '400px';

        document.body.appendChild(target);
      });
      afterEach(function() {
        document.body.removeChild(target);
      });

      it('works with touchend events', function() {

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
        // 80 = clientX - target.style.left
        expect(position[0]).to.eql(80);
        // 190 = clientY - target.style.top
        expect(position[1]).to.eql(190);
      });
    });

    describe('#getOverlayById()', function() {
      let target, map, overlay, overlay_target;

      beforeEach(function() {
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

      afterEach(function() {
        map.removeOverlay(overlay);
        map.dispose();
        document.body.removeChild(target);
      });

      it('returns an overlay by id', function() {
        overlay = new Overlay({
          id: 'foo',
          element: overlay_target,
          position: [0, 0]
        });
        map.addOverlay(overlay);
        expect(map.getOverlayById('foo')).to.be(overlay);
      });

      it('returns null when no overlay is found', function() {
        overlay = new Overlay({
          id: 'foo',
          element: overlay_target,
          position: [0, 0]
        });
        map.addOverlay(overlay);
        expect(map.getOverlayById('bar')).to.be(null);
      });

      it('returns null after removing overlay', function() {
        overlay = new Overlay({
          id: 'foo',
          element: overlay_target,
          position: [0, 0]
        });
        map.addOverlay(overlay);
        expect(map.getOverlayById('foo')).to.be(overlay);
        map.removeOverlay(overlay);
        expect(map.getOverlayById('foo')).to.be(null);
      });

    });

  });

});
