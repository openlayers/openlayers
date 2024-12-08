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
      expect(tile.tileCoord).to.equal(tileCoord);
      expect(tile.transition_).to.be(200);
      expect(tile.loader_).to.equal(loader);
    });
  });

  describe('#getSize()', function () {
    it('returns [256, 256] by default', function () {
      const tileCoord = [0, 0, 0];
      const tile = new DataTile({
        tileCoord: tileCoord,
        loader: loader,
      });
      expect(tile.getSize()).to.eql([256, 256]);
    });

    it('respects what is provided in the constructor', function () {
      const size = [123, 456];
      const tileCoord = [0, 0, 0];
      const tile = new DataTile({
        size: size,
        tileCoord: tileCoord,
        loader: loader,
      });
      expect(tile.getSize()).to.eql(size);
    });
  });

  describe('#load()', function () {
    it('handles loading states correctly', function (done) {
      const tileCoord = [0, 0, 0];
      const tile = new DataTile({
        tileCoord: tileCoord,
        loader: loader,
      });
      expect(tile.getState()).to.be(TileState.IDLE);
      tile.load();
      expect(tile.getState()).to.be(TileState.LOADING);
      listenOnce(tile, 'change', () => {
        expect(tile.getState()).to.be(TileState.LOADED);
        done();
      });
    });

    it('reloads tiles in an error state', function (done) {
      const tileCoord = [0, 0, 0];
      const tile = new DataTile({
        tileCoord: tileCoord,
        loader: loader,
      });
      tile.state = TileState.ERROR;

      tile.load();
      expect(tile.getState()).to.be(TileState.LOADING);
      listenOnce(tile, 'change', () => {
        expect(tile.getState()).to.be(TileState.LOADED);
        done();
      });
    });
  });

  describe('#getData() #asArrayLike() #asImageLike() #toArray()', function () {
    it('handles array data correctly', function (done) {
      const tileCoord = [0, 0, 0];
      const tile = new DataTile({
        tileCoord: tileCoord,
        loader: loader,
      });
      tile.load();
      listenOnce(tile, 'change', () => {
        expect(tile.getState()).to.be(TileState.LOADED);
        const data = tile.getData();
        expect(data).to.be.an(Uint8ClampedArray);
        expect(data.length).to.be(262144);
        const expected = [255, 0, 0, 255, 255, 0, 0, 255];
        expect(Array.from(data.slice(0, 8))).to.eql(expected);
        expect(asImageLike(data)).to.be(null);
        expect(asArrayLike(data)).to.be(data);
        done();
      });
    });

    it('handles image data correctly', function (done) {
      const loadImage = function (src) {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.addEventListener('load', () => resolve(img));
          img.addEventListener('error', () => reject(new Error('load failed')));
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
        expect(tile.getState()).to.be(TileState.LOADED);
        const data = tile.getData();
        expect(data).to.be.an(Image);
        expect(data.width).to.be(256);
        expect(data.height).to.be(256);
        expect(asArrayLike(data)).to.be(null);
        expect(asImageLike(data)).to.be(data);
        const imageData = toArray(asImageLike(data));
        expect(imageData).to.be.an(Uint8ClampedArray);
        expect(imageData.length).to.be(262144);
        const expected = [255, 0, 0, 255, 255, 0, 0, 255];
        expect(Array.from(imageData.slice(0, 8))).to.eql(expected);
        done();
      });
    });
  });
});
