goog.provide('ol.test.control.ZoomSlider');

describe('ol.control.ZoomSlider', function() {
  var map, zoomslider;

  beforeEach(function() {
    map = new ol.Map({
      target: document.getElementById('map')
    });
    zoomslider = new ol.control.ZoomSlider({
      minResolution: 5000,
      maxResolution: 100000
    });
    zoomslider.setMap(map);
  });

  afterEach(function() {
    map.dispose();
  });

  describe('configuration & defaults', function() {

    it('has valid defaults for min and maxresolution', function() {
      expect(function() {
        var zoomslider = new ol.control.ZoomSlider({});
      }).not.toThrow();
    });

    it('throws exception when configured with wrong resolutions', function() {
      expect(function() {
        var zoomslider = new ol.control.ZoomSlider({
          minResolution: 50,
          maxResolution: 0
        });
      }).toThrow();
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

      zoomSliderThumbs = goog.dom.getElementsByClass('ol-zoomslider-handle',
          zoomSliderContainer);
      expect(zoomSliderThumbs.length).toBe(1);

      zoomSliderThumb = zoomSliderThumbs[0];
      expect(zoomSliderThumb instanceof HTMLDivElement).toBe(true);

      hasUnselectableCls = goog.dom.classes.has(zoomSliderThumb,
          'ol-unselectable');
      expect(hasUnselectableCls).toBe(true);
    });
  });

});

goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.style');
goog.require('ol.Map');
goog.require('ol.control.ZoomSlider');
