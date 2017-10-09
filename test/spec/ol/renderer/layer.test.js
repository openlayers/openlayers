goog.require('ol.Image');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Layer');
goog.require('ol.layer.Tile');
goog.require('ol.renderer.Layer');
goog.require('ol.source.XYZ');
goog.require('ol.tilecoord');


describe('ol.renderer.Layer', function() {
  var renderer;
  var eventType = 'change';

  beforeEach(function() {
    var layer = new ol.layer.Layer({});
    renderer = new ol.renderer.Layer(layer);
  });

  describe('#loadImage', function() {
    var image;
    var imageLoadFunction;

    beforeEach(function() {
      var extent = [];
      var resolution = 1;
      var pixelRatio = 1;
      var src = '';
      var crossOrigin = '';
      imageLoadFunction = sinon.spy();
      image = new ol.Image(extent, resolution, pixelRatio, src, crossOrigin, imageLoadFunction);
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
        image.state = 2; // LOADED
        var loaded = renderer.loadImage(image);
        expect(loaded).to.be(true);
      });

      it('does not register a listener', function() {
        image.state = 2; // LOADED
        var loaded = renderer.loadImage(image);
        expect(loaded).to.be(true);
      });

    });

    describe('load LOADING image', function() {

      beforeEach(function() {
        renderer.loadImage(image);
        expect(image.getState()).to.be(1); // LOADING
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

  describe('manageTilePyramid behavior', function() {
    var target, map, view, source;

    beforeEach(function(done) {
      target = document.createElement('div');
      Object.assign(target.style, {
        position: 'absolute',
        left: '-1000px',
        top: '-1000px',
        width: '360px',
        height: '180px'
      });
      document.body.appendChild(target);

      view = new ol.View({
        center: [0, 0],
        zoom: 0
      });

      source = new ol.source.XYZ({
        url: '#{x}/{y}/{z}'
      });

      map = new ol.Map({
        target: target,
        view: view,
        layers: [
          new ol.layer.Tile({
            source: source
          })
        ]
      });
      map.once('postrender', function() {
        done();
      });
    });

    afterEach(function() {
      map.dispose();
      document.body.removeChild(target);
    });

    it('accesses tiles from current zoom level last', function(done) {
      // expect most recent tile in the cache to be from zoom level 0
      var key = source.tileCache.peekFirstKey();
      var tileCoord = ol.tilecoord.fromKey(key);
      expect(tileCoord[0]).to.be(0);

      map.once('moveend', function() {
        // expect most recent tile in the cache to be from zoom level 4
        var key = source.tileCache.peekFirstKey();
        var tileCoord = ol.tilecoord.fromKey(key);
        expect(tileCoord[0]).to.be(4);
        done();
      });
      view.setZoom(4);
    });
  });
});
