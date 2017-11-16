

goog.require('ol.ImageTile');
goog.require('ol.TileState');
goog.require('ol.events');
goog.require('ol.events.EventType');
goog.require('ol.source.Image');


describe('ol.ImageTile', function() {

  describe('#load()', function() {

    it('can load idle tile', function(done) {
      var tileCoord = [0, 0, 0];
      var state = ol.TileState.IDLE;
      var src = 'spec/ol/data/osm-0-0-0.png';
      var tileLoadFunction = ol.source.Image.defaultImageLoadFunction;
      var tile = new ol.ImageTile(tileCoord, state, src, null, tileLoadFunction);

      var previousState = tile.getState();

      ol.events.listen(tile, ol.events.EventType.CHANGE, function(event) {
        var state = tile.getState();
        if (previousState == ol.TileState.IDLE) {
          expect(state).to.be(ol.TileState.LOADING);
        } else if (previousState == ol.TileState.LOADING) {
          expect(state).to.be(ol.TileState.LOADED);
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
      var state = ol.TileState.ERROR;
      var src = 'spec/ol/data/osm-0-0-0.png';
      var tileLoadFunction = ol.source.Image.defaultImageLoadFunction;
      var tile = new ol.ImageTile(tileCoord, state, src, null, tileLoadFunction);

      var previousState = tile.getState();

      ol.events.listen(tile, ol.events.EventType.CHANGE, function(event) {
        var state = tile.getState();
        if (previousState == ol.TileState.ERROR) {
          expect(state).to.be(ol.TileState.LOADING);
        } else if (previousState == ol.TileState.LOADING) {
          expect(state).to.be(ol.TileState.LOADED);
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
      var state = ol.TileState.IDLE;
      var src = 'spec/ol/data/osm-0-0-99.png';
      var tileLoadFunction = ol.source.Image.defaultImageLoadFunction;
      var tile = new ol.ImageTile(tileCoord, state, src, null, tileLoadFunction);

      var key = ol.events.listen(tile, ol.events.EventType.CHANGE, function(event) {
        var state = tile.getState();
        if (state == ol.TileState.ERROR) {
          expect(state).to.be(ol.TileState.ERROR);
          expect(tile.image_).to.be.a(HTMLCanvasElement);
          ol.events.unlistenByKey(key);
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
      var state = ol.TileState.IDLE;
      var src = 'spec/ol/data/osm-0-0-0.png';
      var tileLoadFunction = ol.source.Image.defaultImageLoadFunction;
      var tile = new ol.ImageTile(tileCoord, state, src, null, tileLoadFunction);
      tile.load();
      expect(tile.getState()).to.be(ol.TileState.LOADING);
      tile.dispose();
      expect(tile.getState()).to.be(ol.TileState.ABORT);
      expect(tile.getImage().src).to.be(ol.ImageTile.blankImageUrl);
    });

  });

});
