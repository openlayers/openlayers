goog.provide('ol.test.control.ZoomSlider');

describe('ol.control.ZoomSlider', function() {
  var map, target, zoomslider;

  beforeEach(function() {
    target = document.createElement('div');
    document.body.appendChild(target);
    zoomslider = new ol.control.ZoomSlider();
    map = new ol.Map({
      target: target,
      controls: [zoomslider]
    });
  });

  afterEach(function() {
    goog.dispose(zoomslider);
    goog.dispose(map);
    document.body.removeChild(target);
    zoomslider = null;
    map = null;
    target = null;
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

      hasUnselectableCls = goog.dom.classlist.contains(zoomSliderContainer,
          'ol-unselectable');
      expect(hasUnselectableCls).to.be(true);

      zoomSliderThumbs = goog.dom.getElementsByClass('ol-zoomslider-thumb',
          zoomSliderContainer);
      expect(zoomSliderThumbs.length).to.be(1);

      zoomSliderThumb = zoomSliderThumbs[0];
      expect(zoomSliderThumb instanceof HTMLButtonElement).to.be(true);

      hasUnselectableCls = goog.dom.classlist.contains(zoomSliderThumb,
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
      var control = new ol.control.ZoomSlider({});
      control.element.style.width = '1000px';
      control.element.style.height = '10px';
      control.setMap(map);
      control.initSlider_();

      var horizontal = ol.control.ZoomSlider.direction.HORIZONTAL;
      expect(control.direction_).to.be(horizontal);

      goog.dispose(control);
    });

    it('is vertical for tall containers', function() {
      var control = new ol.control.ZoomSlider({});
      control.element.style.width = '10px';
      control.element.style.height = '1000px';

      control.setMap(map);

      var vertical = ol.control.ZoomSlider.direction.VERTICAL;
      expect(control.direction_).to.be(vertical);

      goog.dispose(control);
    });
  });

});

goog.require('goog.dispose');
goog.require('goog.dom');
goog.require('goog.dom.classlist');
goog.require('goog.fx.Dragger');
goog.require('goog.math.Rect');
goog.require('ol.Map');
goog.require('ol.control.ZoomSlider');
