goog.provide('ol.test.ImageTile');

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

  });

});
