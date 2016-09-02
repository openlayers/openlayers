goog.provide('ol.test.Map');

goog.require('ol.Map');
goog.require('ol.MapEvent');
goog.require('ol.Overlay');
goog.require('ol.View');
goog.require('ol.has');
goog.require('ol.interaction');
goog.require('ol.interaction.DoubleClickZoom');
goog.require('ol.interaction.Interaction');
goog.require('ol.interaction.MouseWheelZoom');
goog.require('ol.layer.Tile');
goog.require('ol.source.XYZ');


describe('ol.Map', function() {

  describe('constructor', function() {
    it('creates a new map', function() {
      var map = new ol.Map({});
      expect(map).to.be.a(ol.Map);
    });

    it('creates a set of default interactions', function() {
      var map = new ol.Map({});
      var interactions = map.getInteractions();
      var length = interactions.getLength();
      expect(length).to.be.greaterThan(0);

      for (var i = 0; i < length; ++i) {
        expect(interactions.item(i).getMap()).to.be(map);
      }
    });

    it('creates the viewport', function() {
      var map = new ol.Map({});
      var viewport = map.getViewport();
      var className = 'ol-viewport' + (ol.has.TOUCH ? ' ol-touch' : '');
      expect(viewport.className).to.be(className);
    });

    it('creates the overlay containers', function() {
      var map = new ol.Map({});
      var container = map.getOverlayContainer();
      expect(container.className).to.be('ol-overlaycontainer');

      var containerStop = map.getOverlayContainerStopEvent();
      expect(containerStop.className).to.be('ol-overlaycontainer-stopevent');
    });

  });

  describe('#addInteraction()', function() {
    it('adds an interaction to the map', function() {
      var map = new ol.Map({});
      var interaction = new ol.interaction.Interaction({});

      var before = map.getInteractions().getLength();
      map.addInteraction(interaction);
      var after = map.getInteractions().getLength();
      expect(after).to.be(before + 1);
      expect(interaction.getMap()).to.be(map);
    });
  });

  describe('#removeInteraction()', function() {
    it('removes an interaction from the map', function() {
      var map = new ol.Map({});
      var interaction = new ol.interaction.Interaction({});

      var before = map.getInteractions().getLength();
      map.addInteraction(interaction);

      map.removeInteraction(interaction);
      expect(map.getInteractions().getLength()).to.be(before);

      expect(interaction.getMap()).to.be(null);
    });
  });

  describe('moveend event', function() {

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

      view = new ol.View({
        projection: 'EPSG:4326'
      });
      map = new ol.Map({
        target: target,
        view: view,
        layers: [
          new ol.layer.Tile({
            source: new ol.source.XYZ({
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

    it('is fired only once after view changes', function(done) {
      var center = [10, 20];
      var zoom = 3;
      var calls = 0;
      map.on('moveend', function() {
        ++calls;
        expect(calls).to.be(1);
        expect(view.getCenter()).to.eql(center);
        expect(view.getZoom()).to.be(zoom);
        window.setTimeout(done, 1000);
      });

      view.setCenter(center);
      view.setZoom(zoom);
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
      map = new ol.Map({
        target: target,
        view: new ol.View({
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

    it('calls renderFrame_ and results in an postrender event', function(done) {

      var spy = sinon.spy(map, 'renderFrame_');
      map.render();
      map.once('postrender', function(event) {
        expect(event).to.be.a(ol.MapEvent);
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
        expect(event).to.be.a(ol.MapEvent);
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
        expect(event).to.be.a(ol.MapEvent);
        var frameState = event.frameState;
        expect(frameState).to.be(null);
        done();
      });

    });

  });

  describe('dispose', function() {
    var map;

    beforeEach(function() {
      map = new ol.Map({
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
      map = new ol.Map({
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
        var interactions = ol.interaction.defaults(options);
        expect(interactions.getLength()).to.eql(1);
        expect(interactions.item(0)).to.be.a(ol.interaction.MouseWheelZoom);
        expect(interactions.item(0).useAnchor_).to.eql(true);
        interactions.item(0).setMouseAnchor(false);
        expect(interactions.item(0).useAnchor_).to.eql(false);
      });
    });

    describe('create double click interaction', function() {

      beforeEach(function() {
        options.doubleClickZoom = true;
      });

      describe('default zoomDelta', function() {
        it('create double click interaction with default delta', function() {
          var interactions = ol.interaction.defaults(options);
          expect(interactions.getLength()).to.eql(1);
          expect(interactions.item(0)).to.be.a(ol.interaction.DoubleClickZoom);
          expect(interactions.item(0).delta_).to.eql(1);
        });
      });

      describe('set zoomDelta', function() {
        it('create double click interaction with set delta', function() {
          options.zoomDelta = 7;
          var interactions = ol.interaction.defaults(options);
          expect(interactions.getLength()).to.eql(1);
          expect(interactions.item(0)).to.be.a(ol.interaction.DoubleClickZoom);
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

        var map = new ol.Map({
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
        map = new ol.Map({
          target: target,
          view: new ol.View({
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
        overlay = new ol.Overlay({
          id: 'foo',
          element: overlay_target,
          position: [0, 0]
        });
        map.addOverlay(overlay);
        expect(map.getOverlayById('foo')).to.be(overlay);
      });

      it('returns null when no overlay is found', function() {
        overlay = new ol.Overlay({
          id: 'foo',
          element: overlay_target,
          position: [0, 0]
        });
        map.addOverlay(overlay);
        expect(map.getOverlayById('bar')).to.be(null);
      });

      it('returns null after removing overlay', function() {
        overlay = new ol.Overlay({
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
