import ImageTile from '../../../src/ol/ImageTile.js';
import TileState from '../../../src/ol/TileState.js';
import {listen, unlistenByKey} from '../../../src/ol/events.js';
import EventType from '../../../src/ol/events/EventType.js';
import {defaultImageLoadFunction} from '../../../src/ol/source/Image.js';


describe('ol.ImageTile', () => {

  describe('#load()', () => {

    test('can load idle tile', done => {
      const tileCoord = [0, 0, 0];
      const state = TileState.IDLE;
      const src = 'spec/ol/data/osm-0-0-0.png';
      const tileLoadFunction = defaultImageLoadFunction;
      const tile = new ImageTile(tileCoord, state, src, null, tileLoadFunction);

      let previousState = tile.getState();

      listen(tile, EventType.CHANGE, function(event) {
        const state = tile.getState();
        if (previousState == TileState.IDLE) {
          expect(state).toBe(TileState.LOADING);
        } else if (previousState == TileState.LOADING) {
          expect(state).toBe(TileState.LOADED);
          done();
        } else {
          throw Error();
        }
        previousState = state;
      });

      tile.load();
    });

    test('can load error tile', done => {
      const tileCoord = [0, 0, 0];
      const state = TileState.ERROR;
      const src = 'spec/ol/data/osm-0-0-0.png';
      const tileLoadFunction = defaultImageLoadFunction;
      const tile = new ImageTile(tileCoord, state, src, null, tileLoadFunction);

      let previousState = tile.getState();

      listen(tile, EventType.CHANGE, function(event) {
        const state = tile.getState();
        if (previousState == TileState.ERROR) {
          expect(state).toBe(TileState.LOADING);
        } else if (previousState == TileState.LOADING) {
          expect(state).toBe(TileState.LOADED);
          done();
        } else {
          throw Error();
        }
        previousState = state;
      });

      tile.load();
    });

    test('loads an empty image on error ', done => {
      const tileCoord = [0, 0, 0];
      const state = TileState.IDLE;
      const src = 'spec/ol/data/osm-0-0-99.png';
      const tileLoadFunction = defaultImageLoadFunction;
      const tile = new ImageTile(tileCoord, state, src, null, tileLoadFunction);

      const key = listen(tile, EventType.CHANGE, function(event) {
        const state = tile.getState();
        if (state == TileState.ERROR) {
          expect(state).toBe(TileState.ERROR);
          expect(tile.image_).toBeInstanceOf(HTMLCanvasElement);
          unlistenByKey(key);
          tile.load();
          expect(tile.image_).toBeInstanceOf(HTMLImageElement);
          done();
        }
      });

      tile.load();
    });

  });

  describe('dispose', () => {

    test('sets image src to a blank image data uri', () => {
      const tileCoord = [0, 0, 0];
      const state = TileState.IDLE;
      const src = 'spec/ol/data/osm-0-0-0.png';
      const tileLoadFunction = defaultImageLoadFunction;
      const tile = new ImageTile(tileCoord, state, src, null, tileLoadFunction);
      tile.load();
      expect(tile.getState()).toBe(TileState.LOADING);
      tile.dispose();
      expect(tile.getState()).toBe(TileState.ABORT);
      expect(tile.getImage().src).toBe(ImageTile.blankImageUrl);
    });

  });

});
