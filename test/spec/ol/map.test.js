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
      expect(hints).toBe(ol.DEFAULT_RENDERER_HINTS);
    });

    it('returns defaults when no "renderer" or "renderers"', function() {
      goog.global.location = {search: '?foo=bar'};
      var hints = ol.RendererHints.createFromQueryData();
      expect(hints).toBe(ol.DEFAULT_RENDERER_HINTS);
    });

    it('returns array of one for "renderer"', function() {
      goog.global.location = {search: '?renderer=bogus'};
      var hints = ol.RendererHints.createFromQueryData();
      expect(hints).toEqual(['bogus']);
    });

    it('accepts comma delimited list for "renderers"', function() {
      goog.global.location = {search: '?renderers=one,two'};
      var hints = ol.RendererHints.createFromQueryData();
      expect(hints).toEqual(['one', 'two']);
    });

    it('works with "renderer" in second position', function() {
      goog.global.location = {search: '?foo=bar&renderer=one'};
      var hints = ol.RendererHints.createFromQueryData();
      expect(hints).toEqual(['one']);
    });

  });
});

describe('ol.Map', function() {

  describe('dispose', function() {
    var map;

    beforeEach(function() {
      map = new ol.Map({
        target: document.getElementById('map')
      });
    });

    it('removes the viewport from its parent', function() {
      map.dispose();
      expect(goog.dom.getParentElement(map.getViewport())).toBeNull();
    });
  });

  describe('create interactions', function() {

    var options;

    beforeEach(function() {
      options = {
        rotate: false,
        doubleClickZoom: false,
        dragPan: false,
        keyboard: false,
        mouseWheelZoom: false,
        shiftDragZoom: false
      };
    });

    describe('create mousewheel interaction', function() {

      beforeEach(function() {
        options.mouseWheelZoom = true;
      });

      describe('default mouseWheelZoomDelta', function() {
        it('create mousewheel interaction with default delta', function() {
          var interactions = ol.Map.createInteractions_(options);
          expect(interactions.getLength()).toEqual(1);
          expect(interactions.getAt(0)).toBeA(ol.interaction.MouseWheelZoom);
          expect(interactions.getAt(0).delta_).toEqual(1);
        });
      });

      describe('set mouseWheelZoomDelta', function() {
        it('create mousewheel interaction with set delta', function() {
          options.mouseWheelZoomDelta = 7;
          var interactions = ol.Map.createInteractions_(options);
          expect(interactions.getLength()).toEqual(1);
          expect(interactions.getAt(0)).toBeA(ol.interaction.MouseWheelZoom);
          expect(interactions.getAt(0).delta_).toEqual(7);
        });
      });
    });

    describe('create double click interaction', function() {

      beforeEach(function() {
        options.doubleClickZoom = true;
      });

      describe('default zoomDelta', function() {
        it('create double click interaction with default delta', function() {
          var interactions = ol.Map.createInteractions_(options);
          expect(interactions.getLength()).toEqual(1);
          expect(interactions.getAt(0)).toBeA(ol.interaction.DblClickZoom);
          expect(interactions.getAt(0).delta_).toEqual(4);
        });
      });

      describe('set mouseWheelZoomDelta', function() {
        it('create double click interaction with set delta', function() {
          options.zoomDelta = 7;
          var interactions = ol.Map.createInteractions_(options);
          expect(interactions.getLength()).toEqual(1);
          expect(interactions.getAt(0)).toBeA(ol.interaction.DblClickZoom);
          expect(interactions.getAt(0).delta_).toEqual(7);
        });
      });
    });
  });

  describe('user animation', function() {

    var layer, map;
    beforeEach(function() {
      // always use setTimeout based shim for requestAnimationFrame
      spyOn(goog.async.AnimationDelay.prototype, 'getRaf_')
          .andCallFake(function() {return null;});

      layer = new ol.layer.TileLayer({
        source: new ol.source.XYZ({
          url: 'foo',
          maxZoom: 2
        })
      });

      map = new ol.Map({
        layers: new ol.Collection([layer]),
        renderer: ol.RendererHint.DOM,
        target: 'map',
        view: new ol.View2D({
          center: new ol.Coordinate(0, 0),
          zoom: 1
        })
      });
    });

    afterEach(function() {
      map.dispose();
      layer.dispose();
    });

    it('can set up an animation loop', function() {

      function quadInOut(t, b, c, d) {
        if ((t /= d / 2) < 1) {
          return c / 2 * t * t + b;
        }
        return -c / 2 * ((--t) * (t - 2) - 1) + b;
      }

      var duration = 500;
      var destination = new ol.Coordinate(1000, 1000);

      var origin = map.getView().getCenter();
      var start = new Date().getTime();
      var x0 = origin.x;
      var y0 = origin.y;
      var dx = destination.x - origin.x;
      var dy = destination.y - origin.y;

      var o = {
        callback: function() {
          var dt = new Date().getTime() - start;
          var more = dt <= duration,
              x, y;
          if (more) {
            x = quadInOut(dt, x0, dx, duration);
            y = quadInOut(dt, y0, dy, duration);
          } else {
            x = destination.x;
            y = destination.y;
          }
          map.getView().setCenter(new ol.Coordinate(x, y));
          if (more) {
            animationDelay.start();
          }
        }
      };

      spyOn(o, 'callback').andCallThrough();

      var animationDelay = new goog.async.AnimationDelay(o.callback);

      animationDelay.start();

      // confirm that the center is somewhere between origin and destination
      // after a short delay
      waits(goog.async.AnimationDelay.TIMEOUT);
      runs(function() {
        expect(o.callback).toHaveBeenCalled();
        var loc = map.getView().getCenter();
        expect(loc.x).not.toEqual(origin.x);
        expect(loc.y).not.toEqual(origin.y);
        if (new Date().getTime() - start < duration) {
          expect(loc.x).not.toEqual(destination.x);
          expect(loc.y).not.toEqual(destination.y);
        }
      });

      // confirm that the map has reached the destination after the duration
      waits(duration);
      runs(function() {
        var loc = map.getView().getCenter();
        expect(loc.x).toEqual(destination.x);
        expect(loc.y).toEqual(destination.y);
      });

    });

  });

});

goog.require('goog.async.AnimationDelay');
goog.require('goog.dom');
goog.require('ol.Collection');
goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.XYZ');
