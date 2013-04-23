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
goog.require('ol.RendererHint');
goog.require('ol.RendererHints');
goog.require('ol.interaction.DoubleClickZoom');
goog.require('ol.interaction.MouseWheelZoom');
goog.require('ol.interaction.defaults');
