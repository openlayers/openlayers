goog.provide('ol.test.control.ZoomSlider');

describe('ol.control.ZoomSlider', function() {
  var map, target, zoomslider;

  beforeEach(function() {
    target = document.createElement('div');
    document.body.appendChild(target);
    map = new ol.Map({
      target: target
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
    document.body.removeChild(target);
    zoomslider = null;
    map = null;
    target = null;
  });

  describe('configuration & defaults', function() {

    it('has valid defaults for min and maxresolution', function() {
      var zoomslider,
          expectedMin = 0.5971642833948135,
          expectedMax = 156543.0339,
          expectedRange = expectedMax - expectedMin;
      expect(function() {
        zoomslider = new ol.control.ZoomSlider({});
      }).not.to.throwException();
      expect(zoomslider.minResolution_).to.be(expectedMin);
      expect(zoomslider.maxResolution_).to.be(expectedMax);
      expect(zoomslider.range_).to.be(expectedRange);
    });

    it('throws exception when configured with wrong resolutions', function() {
      expect(function() {
        zoomslider = new ol.control.ZoomSlider({
          minResolution: 50,
          maxResolution: 0
        });
      }).to.throwException();
    });

    it('can be configured with valid resolutions', function() {
      expect(function() {
        zoomslider = new ol.control.ZoomSlider({
          minResolution: 790,
          maxResolution: 91000
        });
      }).not.to.throwException();
      expect(zoomslider.minResolution_).to.be(790);
      expect(zoomslider.maxResolution_).to.be(91000);
      expect(zoomslider.range_).to.be(90210);
    });
  });

  describe('DOM creation', function() {
    it('creates the expected DOM elements', function() {
      var zoomSliderContainers = goog.dom.getElementsByClass(
          'ol-zoomslider', target),
          zoomSliderContainer,
          zoomSliderThumbs,
          zoomSliderThumb,
          hasUnselectableCls;

      expect(zoomSliderContainers.length).to.be(1);

      zoomSliderContainer = zoomSliderContainers[0];
      expect(zoomSliderContainer instanceof HTMLDivElement).to.be(true);

      hasUnselectableCls = goog.dom.classes.has(zoomSliderContainer,
          'ol-unselectable');
      expect(hasUnselectableCls).to.be(true);

      zoomSliderThumbs = goog.dom.getElementsByClass('ol-zoomslider-thumb',
          zoomSliderContainer);
      expect(zoomSliderThumbs.length).to.be(1);

      zoomSliderThumb = zoomSliderThumbs[0];
      expect(zoomSliderThumb instanceof HTMLDivElement).to.be(true);

      hasUnselectableCls = goog.dom.classes.has(zoomSliderThumb,
          'ol-unselectable');
      expect(hasUnselectableCls).to.be(true);
    });

  });

  describe('dragger setup', function() {
    it('creates a goog.fx.Dragger', function() {
      expect(zoomslider.dragger_ instanceof goog.fx.Dragger).to.be(true);
      expect(zoomslider.dragger_.limits instanceof goog.math.Rect).to.be(true);
    });
  });

  describe('#direction_', function() {
    it('is horizontal for wide containers', function() {
      var control = new ol.control.ZoomSlider({
        minResolution: 5000,
        maxResolution: 100000
      });
      control.element.style.width = '1000px';
      control.element.style.height = '10px';
      control.setMap(map);

      var horizontal = ol.control.ZoomSlider.direction.HORIZONTAL;
      expect(control.direction_).to.be(horizontal);

      control.dispose();
    });

    it('is vertical for tall containers', function() {
      var control = new ol.control.ZoomSlider({
        minResolution: 5000,
        maxResolution: 100000
      });
      control.element.style.width = '10px';
      control.element.style.height = '1000px';

      control.setMap(map);

      var vertical = ol.control.ZoomSlider.direction.VERTICAL;
      expect(control.direction_).to.be(vertical);

      control.dispose();
    });
  });

});

goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.fx.Dragger');
goog.require('goog.math.Rect');
goog.require('ol.Map');
goog.require('ol.control.ZoomSlider');
