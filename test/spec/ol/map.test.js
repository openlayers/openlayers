goog.require('goog.async.AnimationDelay');
goog.require('goog.dom');
goog.require('ol.Collection');
goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.XYZ');

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

  describe('create constraints', function() {

    describe('create resolution constraint', function() {

      describe('with no options', function() {
        it('gives a correct resolution constraint function', function() {
          var options = {};
          var fn = ol.Map.createConstraints_(options).resolution;
          expect(fn(156543.03392804097, 0))
              .toRoughlyEqual(156543.03392804097, 1e-9);
          expect(fn(78271.51696402048, 0))
              .toRoughlyEqual(78271.51696402048, 1e-10);
        });
      });

      describe('with maxResolution, numZoomLevels, and zoomFactor options',
          function() {
        it('gives a correct resolution constraint function', function() {
          var options = {
            maxResolution: 81,
            numZoomLevels: 4,
            zoomFactor: 3
          };
          var fn = ol.Map.createConstraints_(options).resolution;
          expect(fn(82, 0)).toEqual(81);
          expect(fn(81, 0)).toEqual(81);
          expect(fn(27, 0)).toEqual(27);
          expect(fn(9, 0)).toEqual(9);
          expect(fn(3, 0)).toEqual(3);
          expect(fn(2, 0)).toEqual(3);
        });
      });

      describe('with resolutions', function() {
        it('gives a correct resolution constraint function', function() {
          var options = {
            resolutions: [97, 76, 65, 54, 0.45]
          };
          var fn = ol.Map.createConstraints_(options).resolution;
          expect(fn(97, 0), 97);
          expect(fn(76, 0), 76);
          expect(fn(65, 0), 65);
          expect(fn(54, 0), 54);
          expect(fn(0.45, 0), 0.45);
        });
      });

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
        center: new ol.Coordinate(0, 0),
        layers: new ol.Collection([layer]),
        renderer: ol.RendererHint.DOM,
        target: 'map',
        zoom: 1
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

      var origin = map.getCenter();
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
          map.setCenter(new ol.Coordinate(x, y));
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
      waits(100);
      runs(function() {
        expect(o.callback).toHaveBeenCalled();
        var loc = map.getCenter();
        expect(loc.x).not.toEqual(origin.x);
        expect(loc.y).not.toEqual(origin.y);
        expect(loc.x).not.toEqual(destination.x);
        expect(loc.y).not.toEqual(destination.y);
      });

      // confirm that the map has reached the destination after the duration
      waits(duration);
      runs(function() {
        var loc = map.getCenter();
        expect(loc.x).toEqual(destination.x);
        expect(loc.y).toEqual(destination.y);
      });

    });

  });

});
