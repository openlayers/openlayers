import _ol_Image_ from '../../../../src/ol/Image.js';
import _ol_Map_ from '../../../../src/ol/Map.js';
import _ol_View_ from '../../../../src/ol/View.js';
import _ol_layer_Layer_ from '../../../../src/ol/layer/Layer.js';
import _ol_layer_Tile_ from '../../../../src/ol/layer/Tile.js';
import _ol_renderer_Layer_ from '../../../../src/ol/renderer/Layer.js';
import _ol_source_XYZ_ from '../../../../src/ol/source/XYZ.js';
import _ol_tilecoord_ from '../../../../src/ol/tilecoord.js';


describe('ol.renderer.Layer', function() {
  var renderer;
  var eventType = 'change';

  beforeEach(function() {
    var layer = new _ol_layer_Layer_({});
    renderer = new _ol_renderer_Layer_(layer);
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
      image = new _ol_Image_(extent, resolution, pixelRatio, src, crossOrigin, imageLoadFunction);
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

      view = new _ol_View_({
        center: [0, 0],
        zoom: 0
      });

      source = new _ol_source_XYZ_({
        url: '#{x}/{y}/{z}'
      });

      map = new _ol_Map_({
        target: target,
        view: view,
        layers: [
          new _ol_layer_Tile_({
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
      var tileCoord = _ol_tilecoord_.fromKey(key);
      expect(tileCoord[0]).to.be(0);

      map.once('moveend', function() {
        // expect most recent tile in the cache to be from zoom level 4
        var key = source.tileCache.peekFirstKey();
        var tileCoord = _ol_tilecoord_.fromKey(key);
        expect(tileCoord[0]).to.be(4);
        done();
      });
      view.setZoom(4);
    });
  });
});
