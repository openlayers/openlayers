goog.provide('ol.test.Map');
goog.provide('ol.test.RendererHints');

describe('ol.RendererHints', function() {

  describe('#createFromQueryData()', function() {

    var savedGoogGlobal;

    beforeEach(function() {
      savedGoogGlobal = goog.global;
      goog.global = {};
    });

    afterEach(function() {
      goog.global = savedGoogGlobal;
    });

    it('returns defaults when no query string', function() {
      goog.global.location = {search: ''};
      var hints = ol.RendererHints.createFromQueryData();
      expect(hints).to.be(ol.DEFAULT_RENDERER_HINTS);
    });

    it('returns defaults when no "renderer" or "renderers"', function() {
      goog.global.location = {search: '?foo=bar'};
      var hints = ol.RendererHints.createFromQueryData();
      expect(hints).to.be(ol.DEFAULT_RENDERER_HINTS);
    });

    it('returns array of one for "renderer"', function() {
      goog.global.location = {search: '?renderer=bogus'};
      var hints = ol.RendererHints.createFromQueryData();
      expect(hints).to.eql(['bogus']);
    });

    it('accepts comma delimited list for "renderers"', function() {
      goog.global.location = {search: '?renderers=one,two'};
      var hints = ol.RendererHints.createFromQueryData();
      expect(hints).to.eql(['one', 'two']);
    });

    it('works with "renderer" in second position', function() {
      goog.global.location = {search: '?foo=bar&renderer=one'};
      var hints = ol.RendererHints.createFromQueryData();
      expect(hints).to.eql(['one']);
    });

  });
});

describe('ol.Map', function() {

  describe('contstructor', function() {
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
        expect(interactions.getAt(i).getMap()).to.be(map);
      }
    });
  });

  describe('#addInteraction()', function() {
    it('adds an interaction to the map', function() {
      var map = new ol.Map({});
      var interaction = new ol.interaction.Interaction();

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
      var interaction = new ol.interaction.Interaction();

      var before = map.getInteractions().getLength();
      map.addInteraction(interaction);

      map.removeInteraction(interaction);
      expect(map.getInteractions().getLength()).to.be(before);

      expect(interaction.getMap()).to.be(null);
    });
  });

  describe('#requestRenderFrame()', function() {

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
        view: new ol.View2D({
          projection: 'EPSG:4326',
          center: [0, 0],
          resolution: 1
        })
      });
    });

    afterEach(function() {
      goog.dispose(map);
      document.body.removeChild(target);
    });

    it('results in an postrender event', function(done) {

      map.requestRenderFrame();
      map.on('postrender', function(event) {
        expect(event).to.be.a(ol.MapEvent);
        var frameState = event.frameState;
        expect(frameState).not.to.be(null);
        done();
      });

    });

    it('results in an postrender event (for zero height map)', function(done) {
      target.style.height = '0px';
      map.updateSize();

      map.requestRenderFrame();
      map.on('postrender', function(event) {
        expect(event).to.be.a(ol.MapEvent);
        var frameState = event.frameState;
        expect(frameState).to.be(null);
        done();
      });

    });

    it('results in an postrender event (for zero width map)', function(done) {
      target.style.width = '0px';
      map.updateSize();

      map.requestRenderFrame();
      map.on('postrender', function(event) {
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
      goog.dispose(map);
      expect(goog.dom.getParentElement(map.getViewport())).to.be(null);
    });
  });

  describe('create interactions', function() {

    var options;

    beforeEach(function() {
      options = {
        altShiftDragRotate: false,
        doubleClickZoom: false,
        dragPan: false,
        keyboard: false,
        mouseWheelZoom: false,
        shiftDragZoom: false,
        touchPan: false,
        touchRotate: false,
        touchZoom: false
      };
    });

    describe('create mousewheel interaction', function() {
      it('creates mousewheel interaction', function() {
        options.mouseWheelZoom = true;
        var interactions = ol.interaction.defaults(options);
        expect(interactions.getLength()).to.eql(1);
        expect(interactions.getAt(0)).to.be.a(ol.interaction.MouseWheelZoom);
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
          expect(interactions.getAt(0)).to.be.a(ol.interaction.DoubleClickZoom);
          expect(interactions.getAt(0).delta_).to.eql(1);
        });
      });

      describe('set zoomDelta', function() {
        it('create double click interaction with set delta', function() {
          options.zoomDelta = 7;
          var interactions = ol.interaction.defaults(options);
          expect(interactions.getLength()).to.eql(1);
          expect(interactions.getAt(0)).to.be.a(ol.interaction.DoubleClickZoom);
          expect(interactions.getAt(0).delta_).to.eql(7);
        });
      });
    });
  });

});

goog.require('goog.dispose');
goog.require('goog.dom');
goog.require('ol.Map');
goog.require('ol.MapEvent');
goog.require('ol.RendererHint');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.interaction');
goog.require('ol.interaction.Interaction');
goog.require('ol.interaction.DoubleClickZoom');
goog.require('ol.interaction.MouseWheelZoom');
