import EventType from '../../../../src/ol/events/EventType.js';
import ImageTile from '../../../../src/ol/ImageTile.js';
import TileState from '../../../../src/ol/TileState.js';
import {defaultImageLoadFunction} from '../../../../src/ol/source/Image.js';
import {listen, unlistenByKey} from '../../../../src/ol/events.js';

describe('ol.ImageTile', function () {
  describe('#load()', function () {
    it('can load idle tile', function (done) {
      const tileCoord = [0, 0, 0];
      const state = TileState.IDLE;
      const src = 'spec/ol/data/osm-0-0-0.png';
      const tileLoadFunction = defaultImageLoadFunction;
      const tile = new ImageTile(tileCoord, state, src, null, tileLoadFunction);

      let previousState = tile.getState();

      listen(tile, EventType.CHANGE, function (event) {
        const state = tile.getState();
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

    it('can load error tile', function (done) {
      const tileCoord = [0, 0, 0];
      const state = TileState.ERROR;
      const src = 'spec/ol/data/osm-0-0-0.png';
      const tileLoadFunction = defaultImageLoadFunction;
      const tile = new ImageTile(tileCoord, state, src, null, tileLoadFunction);

      let previousState = tile.getState();

      listen(tile, EventType.CHANGE, function (event) {
        const state = tile.getState();
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

    it('loads an empty image on error ', function (done) {
      const tileCoord = [0, 0, 0];
      const state = TileState.IDLE;
      const src = 'spec/ol/data/osm-0-0-99.png';
      const tileLoadFunction = defaultImageLoadFunction;
      const tile = new ImageTile(tileCoord, state, src, null, tileLoadFunction);

      const key = listen(tile, EventType.CHANGE, function (event) {
        const state = tile.getState();
        if (state == TileState.ERROR) {
          expect(state).to.be(TileState.ERROR);
          expect(tile.image_).to.be.a(HTMLCanvasElement);
          unlistenByKey(key);
          tile.load();
          expect(tile.image_).to.be.a(HTMLImageElement);
          done();
        }
      });

      tile.load();
    });
  });
});
