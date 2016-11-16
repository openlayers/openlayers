goog.provide('ol.test.ImageTile');

goog.require('ol.ImageTile');
goog.require('ol.Tile');
goog.require('ol.events');
goog.require('ol.events.EventType');
goog.require('ol.source.Image');


describe('ol.ImageTile', function() {

  describe('#load()', function() {

    it('can load idle tile', function(done) {
      var tileCoord = [0, 0, 0];
      var state = ol.Tile.State.IDLE;
      var src = 'spec/ol/data/osm-0-0-0.png';
      var tileLoadFunction = ol.source.Image.defaultImageLoadFunction;
      var tile = new ol.ImageTile(tileCoord, state, src, null, tileLoadFunction);

      var previousState = tile.getState();

      ol.events.listen(tile, ol.events.EventType.CHANGE, function(event) {
        var state = tile.getState();
        if (previousState == ol.Tile.State.IDLE) {
          expect(state).to.be(ol.Tile.State.LOADING);
        } else if (previousState == ol.Tile.State.LOADING) {
          expect(state).to.be(ol.Tile.State.LOADED);
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
      var state = ol.Tile.State.ERROR;
      var src = 'spec/ol/data/osm-0-0-0.png';
      var tileLoadFunction = ol.source.Image.defaultImageLoadFunction;
      var tile = new ol.ImageTile(tileCoord, state, src, null, tileLoadFunction);

      var previousState = tile.getState();

      ol.events.listen(tile, ol.events.EventType.CHANGE, function(event) {
        var state = tile.getState();
        if (previousState == ol.Tile.State.ERROR) {
          expect(state).to.be(ol.Tile.State.LOADING);
        } else if (previousState == ol.Tile.State.LOADING) {
          expect(state).to.be(ol.Tile.State.LOADED);
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
