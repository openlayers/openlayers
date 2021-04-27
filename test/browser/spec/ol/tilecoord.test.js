import TileGrid from '../../../../src/ol/tilegrid/TileGrid.js';
import {
  fromKey,
  getKey,
  hash,
  withinExtentAndZ,
} from '../../../../src/ol/tilecoord.js';

describe('ol.TileCoord', function () {
  describe('create', function () {
    it('sets x y z properties as expected', function () {
      const tileCoord = [1, 2, 3];
      expect(tileCoord[0]).to.eql(1);
      expect(tileCoord[1]).to.eql(2);
      expect(tileCoord[2]).to.eql(3);
    });
  });

  describe('getKey()', function () {
    it('returns a key for a tile coord', function () {
      const key = getKey([1, 2, 3]);
      expect(key).to.eql('1/2/3');
    });
  });

  describe('fromKey()', function () {
    it('returns a tile coord given a key', function () {
      const tileCoord = [1, 2, 3];
      const key = getKey(tileCoord);

      const returned = fromKey(key);
      expect(returned).to.eql(tileCoord);
    });
  });

  describe('hash', function () {
    it('produces different hashes for different tile coords', function () {
      const tileCoord1 = [3, 2, 1];
      const tileCoord2 = [3, 1, 1];
      expect(hash(tileCoord1)).not.to.eql(hash(tileCoord2));
    });
  });

  describe('withinExtentAndZ', function () {
    it('restricts by z', function () {
      const tileGrid = new TileGrid({
        extent: [10, 20, 30, 40],
        tileSize: 10,
        resolutions: [2, 1],
        minZoom: 1,
      });
      expect(withinExtentAndZ([0, 0, 0], tileGrid)).to.be(false);
      expect(withinExtentAndZ([1, 0, 0], tileGrid)).to.be(true);
      expect(withinExtentAndZ([2, 0, 0], tileGrid)).to.be(false);
    });

    it('restricts by extent when extent defines tile ranges', function () {
      const tileGrid = new TileGrid({
        extent: [10, 20, 30, 40],
        sizes: [[3, 3]],
        tileSize: 10,
        resolutions: [1],
      });
      expect(withinExtentAndZ([0, 1, 1], tileGrid)).to.be(true);
      expect(withinExtentAndZ([0, 2, 0], tileGrid)).to.be(false);
      expect(withinExtentAndZ([0, 0, 2], tileGrid)).to.be(false);
    });

    it('restricts by extent when sizes define tile ranges', function () {
      const tileGrid = new TileGrid({
        origin: [10, 20],
        sizes: [[3, 3]],
        tileSize: 10,
        resolutions: [1],
      });
      expect(withinExtentAndZ([0, 0, 0], tileGrid)).to.be(true);
      expect(withinExtentAndZ([0, 1, 0], tileGrid)).to.be(true);
      expect(withinExtentAndZ([0, 2, 0], tileGrid)).to.be(true);
      expect(withinExtentAndZ([0, 0, 1], tileGrid)).to.be(true);
      expect(withinExtentAndZ([0, 1, 1], tileGrid)).to.be(true);
      expect(withinExtentAndZ([0, 2, 1], tileGrid)).to.be(true);
      expect(withinExtentAndZ([0, 0, 2], tileGrid)).to.be(true);
      expect(withinExtentAndZ([0, 1, 2], tileGrid)).to.be(true);
      expect(withinExtentAndZ([0, 2, 2], tileGrid)).to.be(true);

      expect(withinExtentAndZ([0, 0, -1], tileGrid)).to.be(false);
      expect(withinExtentAndZ([0, 1, -1], tileGrid)).to.be(false);
      expect(withinExtentAndZ([0, 2, -1], tileGrid)).to.be(false);
      expect(withinExtentAndZ([0, -1, 0], tileGrid)).to.be(false);
      expect(withinExtentAndZ([0, 3, 0], tileGrid)).to.be(false);
      expect(withinExtentAndZ([0, -1, 1], tileGrid)).to.be(false);
      expect(withinExtentAndZ([0, 3, 1], tileGrid)).to.be(false);
      expect(withinExtentAndZ([0, -1, 2], tileGrid)).to.be(false);
      expect(withinExtentAndZ([0, 3, 2], tileGrid)).to.be(false);
      expect(withinExtentAndZ([0, 0, 3], tileGrid)).to.be(false);
      expect(withinExtentAndZ([0, 1, 3], tileGrid)).to.be(false);
      expect(withinExtentAndZ([0, 2, 3], tileGrid)).to.be(false);
    });

    it('restricts by extent when sizes (neg y) define tile ranges', function () {
      const tileGrid = new TileGrid({
        origin: [10, 40],
        sizes: [[3, -3]],
        tileSize: 10,
        resolutions: [1],
      });
      expect(withinExtentAndZ([0, 0, -1], tileGrid)).to.be(true);
      expect(withinExtentAndZ([0, 1, -1], tileGrid)).to.be(true);
      expect(withinExtentAndZ([0, 2, -1], tileGrid)).to.be(true);
      expect(withinExtentAndZ([0, 0, -2], tileGrid)).to.be(true);
      expect(withinExtentAndZ([0, 1, -2], tileGrid)).to.be(true);
      expect(withinExtentAndZ([0, 2, -2], tileGrid)).to.be(true);
      expect(withinExtentAndZ([0, 0, -3], tileGrid)).to.be(true);
      expect(withinExtentAndZ([0, 1, -3], tileGrid)).to.be(true);
      expect(withinExtentAndZ([0, 2, -3], tileGrid)).to.be(true);

      expect(withinExtentAndZ([0, 0, 0], tileGrid)).to.be(false);
      expect(withinExtentAndZ([0, 1, 0], tileGrid)).to.be(false);
      expect(withinExtentAndZ([0, 2, 0], tileGrid)).to.be(false);
      expect(withinExtentAndZ([0, -1, -1], tileGrid)).to.be(false);
      expect(withinExtentAndZ([0, 3, -1], tileGrid)).to.be(false);
      expect(withinExtentAndZ([0, -1, -2], tileGrid)).to.be(false);
      expect(withinExtentAndZ([0, 3, -2], tileGrid)).to.be(false);
      expect(withinExtentAndZ([0, -1, -3], tileGrid)).to.be(false);
      expect(withinExtentAndZ([0, 3, -3], tileGrid)).to.be(false);
      expect(withinExtentAndZ([0, 0, -4], tileGrid)).to.be(false);
      expect(withinExtentAndZ([0, 1, -4], tileGrid)).to.be(false);
      expect(withinExtentAndZ([0, 2, -4], tileGrid)).to.be(false);
    });

    it('does not restrict by extent with no extent or sizes', function () {
      const tileGrid = new TileGrid({
        origin: [10, 20],
        tileSize: 10,
        resolutions: [1],
      });
      expect(withinExtentAndZ([0, Infinity, -1], tileGrid)).to.be(true);
      expect(withinExtentAndZ([0, 0, Infinity], tileGrid)).to.be(true);
      expect(withinExtentAndZ([0, -Infinity, -1], tileGrid)).to.be(true);
      expect(withinExtentAndZ([0, 0, Infinity], tileGrid)).to.be(true);
    });
  });
});
