/*global createMapDiv, disposeMap*/
goog.provide('ol.test.control.ZoomSlider');

goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control.ZoomSlider');
goog.require('ol.pointer.PointerEvent');

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
    zoomslider.dispose();
    map.dispose();
    document.body.removeChild(target);
    zoomslider = null;
    map = null;
    target = null;
  });

  describe('DOM creation', function() {
    it('creates the expected DOM elements', function() {
      var zoomSliderContainers = target.querySelectorAll('.ol-zoomslider');

      expect(zoomSliderContainers.length).to.be(1);

      var zoomSliderContainer = zoomSliderContainers[0];
      expect(zoomSliderContainer instanceof HTMLDivElement).to.be(true);

      var hasUnselectableCls = zoomSliderContainer.classList.contains('ol-unselectable');
      expect(hasUnselectableCls).to.be(true);

      var zoomSliderThumbs = zoomSliderContainer.querySelectorAll('.ol-zoomslider-thumb');
      expect(zoomSliderThumbs.length).to.be(1);

      var zoomSliderThumb = zoomSliderThumbs[0];
      expect(zoomSliderThumb instanceof HTMLButtonElement).to.be(true);

      hasUnselectableCls = zoomSliderThumb.classList.contains('ol-unselectable');
      expect(hasUnselectableCls).to.be(true);
    });

  });

  describe('#initSlider_', function() {
    it('sets limits', function() {
      zoomslider.initSlider_();
      expect(zoomslider.widthLimit_).not.to.be(0);
      expect(zoomslider.heightLimit_).to.be(0);
    });
  });

  describe('#direction_', function() {
    it('is horizontal for wide containers', function() {
      var control = new ol.control.ZoomSlider({});
      control.element.style.width = '1000px';
      control.element.style.height = '10px';
      control.setMap(map);
      control.initSlider_();

      var horizontal = 1;
      expect(control.direction_).to.be(horizontal);

      control.dispose();
    });

    it('is vertical for tall containers', function() {
      var control = new ol.control.ZoomSlider({});
      control.element.style.width = '10px';
      control.element.style.height = '1000px';

      control.setMap(map);

      var vertical = 0;
      expect(control.direction_).to.be(vertical);

      control.dispose();
    });
  });

  describe('Pointer event handling', function() {
    var map;

    beforeEach(function() {
      map = new ol.Map({
        target: createMapDiv(500, 100),
        view: new ol.View({
          center: [0, 0],
          resolutions: [16, 8, 4, 2, 1, 0.5, 0.25, 0.125, 0.0625]
        })
      });
    });
    afterEach(function() {
      disposeMap(map);
    });

    it('[horizontal] handles a drag sequence', function() {
      var control = new ol.control.ZoomSlider();
      map.addControl(control);
      map.getView().setZoom(0);
      control.element.style.width = '500px';
      control.element.style.height = '10px';
      control.element.firstChild.style.width = '100px';
      control.element.firstChild.style.height = '10px';
      map.renderSync();
      var dragger = control.dragger_;
      var event = new ol.pointer.PointerEvent('pointerdown', {
        target: control.element.firstElementChild
      });
      event.clientX = control.widthLimit_;
      event.clientY = 0;
      dragger.dispatchEvent(event);
      expect(control.currentResolution_).to.be(16);
      expect(control.dragging_).to.be(true);
      expect(control.dragListenerKeys_.length).to.be(6);
      event.type = 'pointermove';
      event.clientX = 6 * control.widthLimit_ / 8;
      event.clientY = 0;
      dragger.dispatchEvent(event);
      expect(control.currentResolution_).to.be(4);
      event.type = 'pointermove';
      event.clientX = 4 * control.widthLimit_ / 8;
      event.clientY = 0;
      dragger.dispatchEvent(event);
      event.type = 'pointerup';
      dragger.dispatchEvent(event);
      expect(control.currentResolution_).to.be(1);
      expect(control.dragListenerKeys_.length).to.be(0);
      expect(control.dragging_).to.be(false);
    });
    it('[vertical] handles a drag sequence', function() {
      var control = new ol.control.ZoomSlider();
      control.element.style.width = '10px';
      control.element.style.height = '100px';
      control.element.firstChild.style.width = '10px';
      control.element.firstChild.style.height = '20px';
      map.addControl(control);
      map.getView().setZoom(8);
      map.renderSync();
      var dragger = control.dragger_;
      var event = new ol.pointer.PointerEvent('pointerdown', {
        target: control.element.firstElementChild
      });
      event.clientX = 0;
      event.clientY = 0;
      dragger.dispatchEvent(event);
      expect(control.currentResolution_).to.be(0.0625);
      expect(control.dragging_).to.be(true);
      expect(control.dragListenerKeys_.length).to.be(6);
      event.type = 'pointermove';
      event.clientX = 0;
      event.clientY = 2 * control.heightLimit_ / 8;
      dragger.dispatchEvent(event);
      expect(control.currentResolution_).to.be(0.25);
      event.type = 'pointermove';
      event.clientX = 0;
      event.clientY = 4 * control.heightLimit_ / 8;
      dragger.dispatchEvent(event);
      event.type = 'pointerup';
      dragger.dispatchEvent(event);
      expect(control.currentResolution_).to.be(1);
      expect(control.dragListenerKeys_.length).to.be(0);
      expect(control.dragging_).to.be(false);
    });
  });

});
