goog.provide('ol.test.control.ZoomSlider');

describe('ol.control.ZoomSlider', function() {
  var map, zoomslider;

  beforeEach(function() {
    map = new ol.Map({
      target: document.getElementById('map')
    });
    zoomslider = new ol.control.ZoomSlider({
      minResolution: 5000,
      maxResolution: 100000,
      map: map
    });
  });

  afterEach(function() {
    zoomslider.dispose();
    map.dispose();
  });

  describe('configuration & defaults', function() {

    it('has valid defaults for min and maxresolution', function() {
      expect(function() {
        zoomslider = new ol.control.ZoomSlider({});
      }).not.toThrow();
      expect(zoomslider.minResolution_).toBe(500);
      expect(zoomslider.maxResolution_).toBe(1000000);
      expect(zoomslider.range_).toBe(999500);
    });

    it('throws exception when configured with wrong resolutions', function() {
      expect(function() {
        zoomslider = new ol.control.ZoomSlider({
          minResolution: 50,
          maxResolution: 0
        });
      }).toThrow();
    });

    it('can be configured with valid resolutions', function() {
      expect(function() {
        zoomslider = new ol.control.ZoomSlider({
          minResolution: 790,
          maxResolution: 91000
        });
      }).not.toThrow();
      expect(zoomslider.minResolution_).toBe(790);
      expect(zoomslider.maxResolution_).toBe(91000);
      expect(zoomslider.range_).toBe(90210);
    });
  });

  describe('DOM creation', function() {
    it('creates the expected DOM elements', function() {
      var zoomSliderContainers = goog.dom.getElementsByClass('ol-zoomslider'),
          zoomSliderContainer,
          zoomSliderThumbs,
          zoomSliderThumb,
          hasUnselectableCls;

      expect(zoomSliderContainers.length).toBe(1);

      zoomSliderContainer = zoomSliderContainers[0];
      expect(zoomSliderContainer instanceof HTMLDivElement).toBe(true);

      hasUnselectableCls = goog.dom.classes.has(zoomSliderContainer,
          'ol-unselectable');
      expect(hasUnselectableCls).toBe(true);

      zoomSliderThumbs = goog.dom.getElementsByClass('ol-zoomslider-thumb',
          zoomSliderContainer);
      expect(zoomSliderThumbs.length).toBe(1);

      zoomSliderThumb = zoomSliderThumbs[0];
      expect(zoomSliderThumb instanceof HTMLDivElement).toBe(true);

      hasUnselectableCls = goog.dom.classes.has(zoomSliderThumb,
          'ol-unselectable');
      expect(hasUnselectableCls).toBe(true);
    });

  });

  describe('dragger setup', function() {
    it('creates a goog.fx.Dragger', function() {
      expect(zoomslider.dragger_).toBeDefined();
      expect(zoomslider.dragger_).toBeA(goog.fx.Dragger);

      expect(zoomslider.dragger_.limits).toBeDefined();
      expect(zoomslider.dragger_.limits).toBeA(goog.math.Rect);

      expect(zoomslider.direction_).toBeDefined();
      expect(zoomslider.direction_).toBe(1); // vertical
    });
  });

});

goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.fx.Dragger');
goog.require('goog.math.Rect');
goog.require('goog.style');
goog.require('ol.Map');
goog.require('ol.control.ZoomSlider');
