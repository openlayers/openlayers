goog.provide('ol.test.renderer.Layer');

describe('ol.renderer.Layer', function() {
  var renderer;
  var eventType = goog.events.EventType.CHANGE;

  beforeEach(function() {
    var map = new ol.Map({});
    var mapRenderer = map.getRenderer();
    var layer = new ol.layer.Layer({});
    renderer = new ol.renderer.Layer(mapRenderer, layer);
  });

  describe('#loadImage', function() {
    var image;
    var imageLoadFunction;

    beforeEach(function() {
      var extent = [];
      var resolution = 1;
      var pixelRatio = 1;
      var attributions = [];
      var src = '';
      var crossOrigin = '';
      imageLoadFunction = sinon.spy();
      image = new ol.Image(extent, resolution, pixelRatio, attributions,
          src, crossOrigin, imageLoadFunction);
    });

    describe('load IDLE image', function() {

      it('returns false', function() {
        var loaded = renderer.loadImage(image);
        expect(loaded).to.be(false);
      });

      it('registers a listener', function() {
        renderer.loadImage(image);
        var listeners = image.getListeners(eventType, false);
        expect(listeners).to.have.length(1);
      });

    });

    describe('load LOADED image', function() {

      it('returns true', function() {
        image.state = ol.ImageState.LOADED;
        var loaded = renderer.loadImage(image);
        expect(loaded).to.be(true);
      });

      it('does not register a listener', function() {
        image.state = ol.ImageState.LOADED;
        var loaded = renderer.loadImage(image);
        expect(loaded).to.be(true);
      });

    });

    describe('load LOADING image', function() {

      beforeEach(function() {
        renderer.loadImage(image);
        expect(image.getState()).to.be(ol.ImageState.LOADING);
      });

      it('returns false', function() {
        var loaded = renderer.loadImage(image);
        expect(loaded).to.be(false);
      });

      it('does not register a new listener', function() {
        renderer.loadImage(image);
        var listeners = image.getListeners(eventType, false);
        expect(listeners).to.have.length(1);
      });

    });

  });
});

goog.require('goog.events.EventType');
goog.require('ol.Image');
goog.require('ol.ImageState');
goog.require('ol.Map');
goog.require('ol.layer.Layer');
goog.require('ol.renderer.Layer');
