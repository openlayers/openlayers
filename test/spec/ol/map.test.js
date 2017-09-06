

import _ol_Feature_ from '../../../src/ol/feature';
import _ol_Map_ from '../../../src/ol/map';
import _ol_MapEvent_ from '../../../src/ol/mapevent';
import _ol_Overlay_ from '../../../src/ol/overlay';
import _ol_View_ from '../../../src/ol/view';
import _ol_geom_Point_ from '../../../src/ol/geom/point';
import _ol_has_ from '../../../src/ol/has';
import _ol_interaction_ from '../../../src/ol/interaction';
import _ol_interaction_DoubleClickZoom_ from '../../../src/ol/interaction/doubleclickzoom';
import _ol_interaction_Interaction_ from '../../../src/ol/interaction/interaction';
import _ol_interaction_MouseWheelZoom_ from '../../../src/ol/interaction/mousewheelzoom';
import _ol_interaction_PinchZoom_ from '../../../src/ol/interaction/pinchzoom';
import _ol_layer_Tile_ from '../../../src/ol/layer/tile';
import _ol_layer_Vector_ from '../../../src/ol/layer/vector';
import _ol_renderer_canvas_IntermediateCanvas_ from '../../../src/ol/renderer/canvas/intermediatecanvas';
import _ol_source_Vector_ from '../../../src/ol/source/vector';
import _ol_source_XYZ_ from '../../../src/ol/source/xyz';

describe('ol.Map', function() {

  describe('constructor', function() {
    it('creates a new map', function() {
      var map = new _ol_Map_({});
      expect(map).to.be.a(_ol_Map_);
    });

    it('creates a set of default interactions', function() {
      var map = new _ol_Map_({});
      var interactions = map.getInteractions();
      var length = interactions.getLength();
      expect(length).to.be.greaterThan(0);

      for (var i = 0; i < length; ++i) {
        expect(interactions.item(i).getMap()).to.be(map);
      }
    });

    it('creates the viewport', function() {
      var map = new _ol_Map_({});
      var viewport = map.getViewport();
      var className = 'ol-viewport' + (_ol_has_.TOUCH ? ' ol-touch' : '');
      expect(viewport.className).to.be(className);
    });

    it('creates the overlay containers', function() {
      var map = new _ol_Map_({});
      var container = map.getOverlayContainer();
      expect(container.className).to.be('ol-overlaycontainer');

      var containerStop = map.getOverlayContainerStopEvent();
      expect(containerStop.className).to.be('ol-overlaycontainer-stopevent');
    });

  });

  describe('#addLayer()', function() {
    it('adds a layer to the map', function() {
      var map = new _ol_Map_({});
      var layer = new _ol_layer_Tile_();
      map.addLayer(layer);

      expect(map.getLayers().item(0)).to.be(layer);
    });

    it('throws if a layer is added twice', function() {
      var map = new _ol_Map_({});
      var layer = new _ol_layer_Tile_();
      map.addLayer(layer);

      var call = function() {
        map.addLayer(layer);
      };
      expect(call).to.throwException();
    });
  });

  describe('#addInteraction()', function() {
    it('adds an interaction to the map', function() {
      var map = new _ol_Map_({});
      var interaction = new _ol_interaction_Interaction_({});

      var before = map.getInteractions().getLength();
      map.addInteraction(interaction);
      var after = map.getInteractions().getLength();
      expect(after).to.be(before + 1);
      expect(interaction.getMap()).to.be(map);
    });
  });

  describe('#removeInteraction()', function() {
    it('removes an interaction from the map', function() {
      var map = new _ol_Map_({});
      var interaction = new _ol_interaction_Interaction_({});

      var before = map.getInteractions().getLength();
      map.addInteraction(interaction);

      map.removeInteraction(interaction);
      expect(map.getInteractions().getLength()).to.be(before);

      expect(interaction.getMap()).to.be(null);
    });
  });

  describe('movestart/moveend event', function() {

    var target, view, map;

    beforeEach(function() {
      target = document.createElement('div');

      var style = target.style;
      style.position = 'absolute';
      style.left = '-1000px';
      style.top = '-1000px';
      style.width = '360px';
      style.height = '180px';
      document.body.appendChild(target);

      view = new _ol_View_({
        projection: 'EPSG:4326'
      });
      map = new _ol_Map_({
        target: target,
        view: view,
        layers: [
          new _ol_layer_Tile_({
            source: new _ol_source_XYZ_({
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
      var center = [10, 20];
      var zoom = 3;
      var startCalls = 0;
      var endCalls = 0;
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
      var center = [10, 20];
      var zoom = 3;
      var calls = [];
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

  describe('#getFeaturesAtPixel', function() {

    var target, map;
    beforeEach(function() {
      target = document.createElement('div');
      target.style.width = target.style.height = '100px';
      document.body.appendChild(target);
      map = new _ol_Map_({
        target: target,
        layers: [new _ol_layer_Vector_({
          source: new _ol_source_Vector_({
            features: [new _ol_Feature_(new _ol_geom_Point_([0, 0]))]
          })
        })],
        view: new _ol_View_({
          center: [0, 0],
          zoom: 2
        })
      });
      map.renderSync();
    });
    afterEach(function() {
      document.body.removeChild(target);
    });

    it('returns null if no feature was found', function() {
      var features = map.getFeaturesAtPixel([0, 0]);
      expect(features).to.be(null);
    });

    it('returns an array of found features', function() {
      var features = map.getFeaturesAtPixel([50, 50]);
      expect(features).to.be.an(Array);
      expect(features[0]).to.be.an(_ol_Feature_);
    });

    it('respects options', function() {
      var otherLayer = new _ol_layer_Vector_({
        source: new _ol_source_Vector_
      });
      map.addLayer(otherLayer);
      var features = map.getFeaturesAtPixel([50, 50], {
        layerFilter: function(layer) {
          return layer == otherLayer;
        }
      });
      expect(features).to.be(null);
    });

  });

  describe('#forEachLayerAtPixel()', function()  {

    var target, map, original, log;

    beforeEach(function(done) {
      log = [];
      original = _ol_renderer_canvas_IntermediateCanvas_.prototype.forEachLayerAtCoordinate;
      _ol_renderer_canvas_IntermediateCanvas_.prototype.forEachLayerAtCoordinate = function(coordinate) {
        log.push(coordinate.slice());
      };

      target = document.createElement('div');
      var style = target.style;
      style.position = 'absolute';
      style.left = '-1000px';
      style.top = '-1000px';
      style.width = '360px';
      style.height = '180px';
      document.body.appendChild(target);

      map = new _ol_Map_({
        target: target,
        view: new _ol_View_({
          center: [0, 0],
          zoom: 1
        }),
        layers: [
          new _ol_layer_Tile_({
            source: new _ol_source_XYZ_()
          }),
          new _ol_layer_Tile_({
            source: new _ol_source_XYZ_()
          }),
          new _ol_layer_Tile_({
            source: new _ol_source_XYZ_()
          })
        ]
      });

      map.once('postrender', function() {
        done();
      });
    });

    afterEach(function() {
      _ol_renderer_canvas_IntermediateCanvas_.prototype.forEachLayerAtCoordinate = original;
      map.dispose();
      document.body.removeChild(target);
      log = null;
    });

    it('calls each layer renderer with the same coordinate', function() {
      var pixel = [10, 20];
      map.forEachLayerAtPixel(pixel, function() {});
      expect(log.length).to.equal(3);
      expect(log[0].length).to.equal(2);
      expect(log[0]).to.eql(log[1]);
      expect(log[1]).to.eql(log[2]);
    });

  });

  describe('#render()', function() {

    var target, map;

    beforeEach(function() {
      target = document.createElement('div');
      var style = target.style;
      style.position = 'absolute';
      style.left = '-1000px';
      style.top = '-1000px';
      style.width = '360px';
      style.height = '180px';
      document.body.appendChild(target);
      map = new _ol_Map_({
        target: target,
        view: new _ol_View_({
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
      var view = map.getView();

      var spy = sinon.spy(map, 'render');
      view.changed();
      expect(spy.callCount).to.be(1);
    });

    it('is not called on view changes after the view has been removed', function() {
      var view = map.getView();
      map.setView(null);

      var spy = sinon.spy(map, 'render');
      view.changed();
      expect(spy.callCount).to.be(0);
    });

    it('calls renderFrame_ and results in an postrender event', function(done) {

      var spy = sinon.spy(map, 'renderFrame_');
      map.render();
      map.once('postrender', function(event) {
        expect(event).to.be.a(_ol_MapEvent_);
        expect(typeof spy.firstCall.args[0]).to.be('number');
        spy.restore();
        var frameState = event.frameState;
        expect(frameState).not.to.be(null);
        done();
      });

    });

    it('uses the same render frame for subsequent calls', function(done) {
      var id1, id2;
      map.render();
      id1 = map.animationDelayKey_;
      map.once('postrender', function() {
        expect(id2).to.be(id1);
        done();
      });
      map.render();
      id2 = map.animationDelayKey_;
    });

    it('creates a new render frame after renderSync()', function(done) {
      var id1, id2;
      map.render();
      id1 = map.animationDelayKey_;
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
        expect(event).to.be.a(_ol_MapEvent_);
        var frameState = event.frameState;
        expect(frameState).to.be(null);
        done();
      });

    });

    it('results in an postrender event (for zero width map)', function(done) {
      target.style.width = '0px';
      map.updateSize();

      map.render();
      map.once('postrender', function(event) {
        expect(event).to.be.a(_ol_MapEvent_);
        var frameState = event.frameState;
        expect(frameState).to.be(null);
        done();
      });

    });

  });

  describe('dispose', function() {
    var map;

    beforeEach(function() {
      map = new _ol_Map_({
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
    var map;

    beforeEach(function() {
      map = new _ol_Map_({
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

    var options;

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
        var interactions = _ol_interaction_.defaults(options);
        expect(interactions.getLength()).to.eql(1);
        expect(interactions.item(0)).to.be.a(_ol_interaction_MouseWheelZoom_);
        expect(interactions.item(0).constrainResolution_).to.eql(false);
        expect(interactions.item(0).useAnchor_).to.eql(true);
        interactions.item(0).setMouseAnchor(false);
        expect(interactions.item(0).useAnchor_).to.eql(false);
      });
    });

    describe('create pinchZoom interaction', function() {
      it('creates pinchZoom interaction', function() {
        options.pinchZoom = true;
        var interactions = _ol_interaction_.defaults(options);
        expect(interactions.getLength()).to.eql(1);
        expect(interactions.item(0)).to.be.a(_ol_interaction_PinchZoom_);
        expect(interactions.item(0).constrainResolution_).to.eql(false);
      });
    });

    describe('set constrainResolution option', function() {
      it('set constrainResolution option', function() {
        options.pinchZoom = true;
        options.mouseWheelZoom = true;
        options.constrainResolution = true;
        var interactions = _ol_interaction_.defaults(options);
        expect(interactions.getLength()).to.eql(2);
        expect(interactions.item(0)).to.be.a(_ol_interaction_PinchZoom_);
        expect(interactions.item(0).constrainResolution_).to.eql(true);
        expect(interactions.item(1)).to.be.a(_ol_interaction_MouseWheelZoom_);
        expect(interactions.item(1).constrainResolution_).to.eql(true);
      });
    });

    describe('create double click interaction', function() {

      beforeEach(function() {
        options.doubleClickZoom = true;
      });

      describe('default zoomDelta', function() {
        it('create double click interaction with default delta', function() {
          var interactions = _ol_interaction_.defaults(options);
          expect(interactions.getLength()).to.eql(1);
          expect(interactions.item(0)).to.be.a(_ol_interaction_DoubleClickZoom_);
          expect(interactions.item(0).delta_).to.eql(1);
        });
      });

      describe('set zoomDelta', function() {
        it('create double click interaction with set delta', function() {
          options.zoomDelta = 7;
          var interactions = _ol_interaction_.defaults(options);
          expect(interactions.getLength()).to.eql(1);
          expect(interactions.item(0)).to.be.a(_ol_interaction_DoubleClickZoom_);
          expect(interactions.item(0).delta_).to.eql(7);
        });
      });
    });

    describe('#getEventPixel', function() {

      var target;

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

        var map = new _ol_Map_({
          target: target
        });

        var browserEvent = {
          type: 'touchend',
          target: target,
          changedTouches: [{
            clientX: 100,
            clientY: 200
          }]
        };
        var position = map.getEventPixel(browserEvent);
        // 80 = clientX - target.style.left
        expect(position[0]).to.eql(80);
        // 190 = clientY - target.style.top
        expect(position[1]).to.eql(190);
      });
    });

    describe('#getOverlayById()', function() {
      var target, map, overlay, overlay_target;

      beforeEach(function() {
        target = document.createElement('div');
        var style = target.style;
        style.position = 'absolute';
        style.left = '-1000px';
        style.top = '-1000px';
        style.width = '360px';
        style.height = '180px';
        document.body.appendChild(target);
        map = new _ol_Map_({
          target: target,
          view: new _ol_View_({
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
        overlay = new _ol_Overlay_({
          id: 'foo',
          element: overlay_target,
          position: [0, 0]
        });
        map.addOverlay(overlay);
        expect(map.getOverlayById('foo')).to.be(overlay);
      });

      it('returns null when no overlay is found', function() {
        overlay = new _ol_Overlay_({
          id: 'foo',
          element: overlay_target,
          position: [0, 0]
        });
        map.addOverlay(overlay);
        expect(map.getOverlayById('bar')).to.be(null);
      });

      it('returns null after removing overlay', function() {
        overlay = new _ol_Overlay_({
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
