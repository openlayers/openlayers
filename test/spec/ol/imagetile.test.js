import _ol_ImageTile_ from '../../../src/ol/ImageTile.js';
import TileState from '../../../src/ol/TileState.js';
import _ol_events_ from '../../../src/ol/events.js';
import EventType from '../../../src/ol/events/EventType.js';
import _ol_source_Image_ from '../../../src/ol/source/Image.js';


describe('ol.ImageTile', function() {

  describe('#load()', function() {

    it('can load idle tile', function(done) {
      var tileCoord = [0, 0, 0];
      var state = TileState.IDLE;
      var src = 'spec/ol/data/osm-0-0-0.png';
      var tileLoadFunction = _ol_source_Image_.defaultImageLoadFunction;
      var tile = new _ol_ImageTile_(tileCoord, state, src, null, tileLoadFunction);

      var previousState = tile.getState();

      _ol_events_.listen(tile, EventType.CHANGE, function(event) {
        var state = tile.getState();
        if (previousState == TileState.IDLE) {
          expect(state).to.be(TileState.LOADING);
        } else if (previousState == TileState.LOADING) {
          expect(state).to.be(TileState.LOADED);
          done();
        } else {
          expect().fail();
        }
        previousState = state;
      });

      tile.load();
    });

    it('can load error tile', function(done) {
      var tileCoord = [0, 0, 0];
      var state = TileState.ERROR;
      var src = 'spec/ol/data/osm-0-0-0.png';
      var tileLoadFunction = _ol_source_Image_.defaultImageLoadFunction;
      var tile = new _ol_ImageTile_(tileCoord, state, src, null, tileLoadFunction);

      var previousState = tile.getState();

      _ol_events_.listen(tile, EventType.CHANGE, function(event) {
        var state = tile.getState();
        if (previousState == TileState.ERROR) {
          expect(state).to.be(TileState.LOADING);
        } else if (previousState == TileState.LOADING) {
          expect(state).to.be(TileState.LOADED);
          done();
        } else {
          expect().fail();
        }
        previousState = state;
      });

      tile.load();
    });

    it('loads an empty image on error ', function(done) {
      var tileCoord = [0, 0, 0];
      var state = TileState.IDLE;
      var src = 'spec/ol/data/osm-0-0-99.png';
      var tileLoadFunction = _ol_source_Image_.defaultImageLoadFunction;
      var tile = new _ol_ImageTile_(tileCoord, state, src, null, tileLoadFunction);

      var key = _ol_events_.listen(tile, EventType.CHANGE, function(event) {
        var state = tile.getState();
        if (state == TileState.ERROR) {
          expect(state).to.be(TileState.ERROR);
          expect(tile.image_).to.be.a(HTMLCanvasElement);
          _ol_events_.unlistenByKey(key);
          tile.load();
          expect(tile.image_).to.be.a(HTMLImageElement);
          done();
        }
      });

      tile.load();
    });

  });

  describe('dispose', function() {

    it('sets image src to a blank image data uri', function() {
      var tileCoord = [0, 0, 0];
      var state = TileState.IDLE;
      var src = 'spec/ol/data/osm-0-0-0.png';
      var tileLoadFunction = _ol_source_Image_.defaultImageLoadFunction;
      var tile = new _ol_ImageTile_(tileCoord, state, src, null, tileLoadFunction);
      tile.load();
      expect(tile.getState()).to.be(TileState.LOADING);
      tile.dispose();
      expect(tile.getState()).to.be(TileState.ABORT);
      expect(tile.getImage().src).to.be(_ol_ImageTile_.blankImageUrl);
    });

  });

});
