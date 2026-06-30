import {assert} from 'chai';
import DataTile, {
  asArrayLike,
  asImageLike,
  toArray,
} from '../../../../src/ol/DataTile.js';
import TileState from '../../../../src/ol/TileState.js';
import {listenOnce} from '../../../../src/ol/events.js';

describe('ol/DataTile', function () {
  /**
   * @type {Promise<import('../../../../src/ol/DataTile.js').Data>}
   */
  let loader;
  beforeEach(function () {
    loader = function () {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        context.fillStyle = 'red';
        context.fillRect(0, 0, 256, 256);
        resolve(context.getImageData(0, 0, 256, 256).data);
      });
    };
  });

  describe('constructor', function () {
    it('sets options', function () {
      const tileCoord = [0, 0, 0];
      const tile = new DataTile({
        tileCoord: tileCoord,
        loader: loader,
        transition: 200,
      });
      assert.equal(tile.tileCoord, tileCoord);
      assert.strictEqual(tile.transition_, 200);
      assert.equal(tile.loader_, loader);
    });
  });

  describe('#getSize()', function () {
    it('returns [256, 256] by default', function () {
      const tileCoord = [0, 0, 0];
      const tile = new DataTile({
        tileCoord: tileCoord,
        loader: loader,
      });
      assert.deepEqual(tile.getSize(), [256, 256]);
    });

    it('respects what is provided in the constructor', function () {
      const size = [123, 456];
      const tileCoord = [0, 0, 0];
      const tile = new DataTile({
        size: size,
        tileCoord: tileCoord,
        loader: loader,
      });
      assert.deepEqual(tile.getSize(), size);
    });
  });

  describe('#load()', function () {
    it('handles loading states correctly', () =>
      new Promise((resolve) => {
        const tileCoord = [0, 0, 0];
        const tile = new DataTile({
          tileCoord: tileCoord,
          loader: loader,
        });
        assert.strictEqual(tile.getState(), TileState.IDLE);
        tile.load();
        assert.strictEqual(tile.getState(), TileState.LOADING);
        listenOnce(tile, 'change', () => {
          assert.strictEqual(tile.getState(), TileState.LOADED);
          resolve();
        });
      }));

    it('reloads tiles in an error state', () =>
      new Promise((resolve) => {
        const tileCoord = [0, 0, 0];
        const tile = new DataTile({
          tileCoord: tileCoord,
          loader: loader,
        });
        tile.state = TileState.ERROR;

        tile.load();
        assert.strictEqual(tile.getState(), TileState.LOADING);
        listenOnce(tile, 'change', () => {
          assert.strictEqual(tile.getState(), TileState.LOADED);
          resolve();
        });
      }));
  });

  describe('#getData() #asArrayLike() #asImageLike() #toArray()', function () {
    it('handles array data correctly', () =>
      new Promise((resolve) => {
        const tileCoord = [0, 0, 0];
        const tile = new DataTile({
          tileCoord: tileCoord,
          loader: loader,
        });
        tile.load();
        listenOnce(tile, 'change', () => {
          assert.strictEqual(tile.getState(), TileState.LOADED);
          const data = tile.getData();
          assert.instanceOf(data, Uint8ClampedArray);
          assert.strictEqual(data.length, 262144);
          const expected = [255, 0, 0, 255, 255, 0, 0, 255];
          assert.deepEqual(Array.from(data.slice(0, 8)), expected);
          assert.strictEqual(asImageLike(data), null);
          assert.strictEqual(asArrayLike(data), data);
          resolve();
        });
      }));

    it('handles image data correctly', () =>
      new Promise((resolve) => {
        const loadImage = function (src) {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.addEventListener('load', () => resolve(img));
            img.addEventListener('error', () =>
              reject(new Error('load failed')),
            );
            img.src = src;
          });
        };
        const loader = async function () {
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const context = canvas.getContext('2d');
          context.fillStyle = 'red';
          context.fillRect(0, 0, 256, 256);
          const src = canvas.toDataURL();
          const image = await loadImage(src);
          return image;
        };
        const tileCoord = [0, 0, 0];
        const tile = new DataTile({
          tileCoord: tileCoord,
          loader: loader,
        });
        tile.load();
        listenOnce(tile, 'change', () => {
          assert.strictEqual(tile.getState(), TileState.LOADED);
          const data = tile.getData();
          assert.instanceOf(data, Image);
          assert.strictEqual(data.width, 256);
          assert.strictEqual(data.height, 256);
          assert.strictEqual(asArrayLike(data), null);
          assert.strictEqual(asImageLike(data), data);
          const imageData = toArray(asImageLike(data));
          assert.instanceOf(imageData, Uint8ClampedArray);
          assert.strictEqual(imageData.length, 262144);
          const expected = [255, 0, 0, 255, 255, 0, 0, 255];
          assert.deepEqual(Array.from(imageData.slice(0, 8)), expected);
          resolve();
        });
      }));
  });
});
