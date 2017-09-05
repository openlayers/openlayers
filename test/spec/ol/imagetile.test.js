

import _ol_ImageTile_ from '../../../src/ol/imagetile';
import _ol_TileState_ from '../../../src/ol/tilestate';
import _ol_events_ from '../../../src/ol/events';
import _ol_events_EventType_ from '../../../src/ol/events/eventtype';
import _ol_source_Image_ from '../../../src/ol/source/image';


describe('ol.ImageTile', function() {

  describe('#load()', function() {

    it('can load idle tile', function(done) {
      var tileCoord = [0, 0, 0];
      var state = _ol_TileState_.IDLE;
      var src = 'spec/ol/data/osm-0-0-0.png';
      var tileLoadFunction = _ol_source_Image_.defaultImageLoadFunction;
      var tile = new _ol_ImageTile_(tileCoord, state, src, null, tileLoadFunction);

      var previousState = tile.getState();

      _ol_events_.listen(tile, _ol_events_EventType_.CHANGE, function(event) {
        var state = tile.getState();
        if (previousState == _ol_TileState_.IDLE) {
          expect(state).to.be(_ol_TileState_.LOADING);
        } else if (previousState == _ol_TileState_.LOADING) {
          expect(state).to.be(_ol_TileState_.LOADED);
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
      var state = _ol_TileState_.ERROR;
      var src = 'spec/ol/data/osm-0-0-0.png';
      var tileLoadFunction = _ol_source_Image_.defaultImageLoadFunction;
      var tile = new _ol_ImageTile_(tileCoord, state, src, null, tileLoadFunction);

      var previousState = tile.getState();

      _ol_events_.listen(tile, _ol_events_EventType_.CHANGE, function(event) {
        var state = tile.getState();
        if (previousState == _ol_TileState_.ERROR) {
          expect(state).to.be(_ol_TileState_.LOADING);
        } else if (previousState == _ol_TileState_.LOADING) {
          expect(state).to.be(_ol_TileState_.LOADED);
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
      var state = _ol_TileState_.IDLE;
      var src = 'spec/ol/data/osm-0-0-99.png';
      var tileLoadFunction = _ol_source_Image_.defaultImageLoadFunction;
      var tile = new _ol_ImageTile_(tileCoord, state, src, null, tileLoadFunction);

      _ol_events_.listen(tile, _ol_events_EventType_.CHANGE, function(event) {
        var state = tile.getState();
        if (state == _ol_TileState_.ERROR) {
          expect(state).to.be(_ol_TileState_.ERROR);
          expect(tile.image_.src).to.be(_ol_ImageTile_.blankImageUrl);
          done();
        }
      });

      tile.load();
    });

  });

  describe('dispose', function() {

    it('sets image src to a blank image data uri', function() {
      var tileCoord = [0, 0, 0];
      var state = _ol_TileState_.IDLE;
      var src = 'spec/ol/data/osm-0-0-0.png';
      var tileLoadFunction = _ol_source_Image_.defaultImageLoadFunction;
      var tile = new _ol_ImageTile_(tileCoord, state, src, null, tileLoadFunction);
      tile.load();
      expect(tile.getState()).to.be(_ol_TileState_.LOADING);
      tile.dispose();
      expect(tile.getState()).to.be(_ol_TileState_.ABORT);
      expect(tile.getImage().src).to.be(_ol_ImageTile_.blankImageUrl);
    });

  });

});
