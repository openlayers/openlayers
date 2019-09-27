import {assert} from 'chai';
import {
  fromKey,
  getKey,
  hash,
  withinExtentAndZ,
} from '../../../../src/ol/tilecoord.js';
import TileGrid from '../../../../src/ol/tilegrid/TileGrid.js';

describe('ol.TileCoord', function () {
  describe('create', function () {
    it('sets x y z properties as expected', function () {
      const tileCoord = [1, 2, 3];
      assert.deepEqual(tileCoord[0], 1);
      assert.deepEqual(tileCoord[1], 2);
      assert.deepEqual(tileCoord[2], 3);
    });
  });

  describe('getKey()', function () {
    it('returns a key for a tile coord', function () {
      const key = getKey([1, 2, 3]);
      assert.deepEqual(key, '1/2/3');
    });
  });

  describe('fromKey()', function () {
    it('returns a tile coord given a key', function () {
      const tileCoord = [1, 2, 3];
      const key = getKey(tileCoord);

      const returned = fromKey(key);
      assert.deepEqual(returned, tileCoord);
    });
  });

  describe('hash', function () {
    it('produces different hashes for different tile coords', function () {
      const tileCoord1 = [3, 2, 1];
      const tileCoord2 = [3, 1, 1];
      assert.notDeepEqual(hash(tileCoord1), hash(tileCoord2));
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
      assert.strictEqual(withinExtentAndZ([0, 0, 0], tileGrid), false);
      assert.strictEqual(withinExtentAndZ([1, 0, 0], tileGrid), true);
      assert.strictEqual(withinExtentAndZ([2, 0, 0], tileGrid), false);
    });

    it('restricts by extent when extent defines tile ranges', function () {
      const tileGrid = new TileGrid({
        extent: [10, 20, 30, 40],
        sizes: [[3, 3]],
        tileSize: 10,
        resolutions: [1],
      });
      assert.strictEqual(withinExtentAndZ([0, 1, 1], tileGrid), true);
      assert.strictEqual(withinExtentAndZ([0, 2, 0], tileGrid), false);
      assert.strictEqual(withinExtentAndZ([0, 0, 2], tileGrid), false);
    });

    it('restricts by extent when sizes define tile ranges', function () {
      const tileGrid = new TileGrid({
        origin: [10, 20],
        sizes: [[3, 3]],
        tileSize: 10,
        resolutions: [1],
      });
      assert.strictEqual(withinExtentAndZ([0, 0, 0], tileGrid), true);
      assert.strictEqual(withinExtentAndZ([0, 1, 0], tileGrid), true);
      assert.strictEqual(withinExtentAndZ([0, 2, 0], tileGrid), true);
      assert.strictEqual(withinExtentAndZ([0, 0, 1], tileGrid), true);
      assert.strictEqual(withinExtentAndZ([0, 1, 1], tileGrid), true);
      assert.strictEqual(withinExtentAndZ([0, 2, 1], tileGrid), true);
      assert.strictEqual(withinExtentAndZ([0, 0, 2], tileGrid), true);
      assert.strictEqual(withinExtentAndZ([0, 1, 2], tileGrid), true);
      assert.strictEqual(withinExtentAndZ([0, 2, 2], tileGrid), true);

      assert.strictEqual(withinExtentAndZ([0, 0, -1], tileGrid), false);
      assert.strictEqual(withinExtentAndZ([0, 1, -1], tileGrid), false);
      assert.strictEqual(withinExtentAndZ([0, 2, -1], tileGrid), false);
      assert.strictEqual(withinExtentAndZ([0, -1, 0], tileGrid), false);
      assert.strictEqual(withinExtentAndZ([0, 3, 0], tileGrid), false);
      assert.strictEqual(withinExtentAndZ([0, -1, 1], tileGrid), false);
      assert.strictEqual(withinExtentAndZ([0, 3, 1], tileGrid), false);
      assert.strictEqual(withinExtentAndZ([0, -1, 2], tileGrid), false);
      assert.strictEqual(withinExtentAndZ([0, 3, 2], tileGrid), false);
      assert.strictEqual(withinExtentAndZ([0, 0, 3], tileGrid), false);
      assert.strictEqual(withinExtentAndZ([0, 1, 3], tileGrid), false);
      assert.strictEqual(withinExtentAndZ([0, 2, 3], tileGrid), false);
    });

    it('restricts by extent when sizes (neg y) define tile ranges', function () {
      const tileGrid = new TileGrid({
        origin: [10, 40],
        sizes: [[3, -3]],
        tileSize: 10,
        resolutions: [1],
      });
      assert.strictEqual(withinExtentAndZ([0, 0, -1], tileGrid), true);
      assert.strictEqual(withinExtentAndZ([0, 1, -1], tileGrid), true);
      assert.strictEqual(withinExtentAndZ([0, 2, -1], tileGrid), true);
      assert.strictEqual(withinExtentAndZ([0, 0, -2], tileGrid), true);
      assert.strictEqual(withinExtentAndZ([0, 1, -2], tileGrid), true);
      assert.strictEqual(withinExtentAndZ([0, 2, -2], tileGrid), true);
      assert.strictEqual(withinExtentAndZ([0, 0, -3], tileGrid), true);
      assert.strictEqual(withinExtentAndZ([0, 1, -3], tileGrid), true);
      assert.strictEqual(withinExtentAndZ([0, 2, -3], tileGrid), true);

      assert.strictEqual(withinExtentAndZ([0, 0, 0], tileGrid), false);
      assert.strictEqual(withinExtentAndZ([0, 1, 0], tileGrid), false);
      assert.strictEqual(withinExtentAndZ([0, 2, 0], tileGrid), false);
      assert.strictEqual(withinExtentAndZ([0, -1, -1], tileGrid), false);
      assert.strictEqual(withinExtentAndZ([0, 3, -1], tileGrid), false);
      assert.strictEqual(withinExtentAndZ([0, -1, -2], tileGrid), false);
      assert.strictEqual(withinExtentAndZ([0, 3, -2], tileGrid), false);
      assert.strictEqual(withinExtentAndZ([0, -1, -3], tileGrid), false);
      assert.strictEqual(withinExtentAndZ([0, 3, -3], tileGrid), false);
      assert.strictEqual(withinExtentAndZ([0, 0, -4], tileGrid), false);
      assert.strictEqual(withinExtentAndZ([0, 1, -4], tileGrid), false);
      assert.strictEqual(withinExtentAndZ([0, 2, -4], tileGrid), false);
    });

    it('does not restrict by extent with no extent or sizes', function () {
      const tileGrid = new TileGrid({
        origin: [10, 20],
        tileSize: 10,
        resolutions: [1],
      });
      assert.strictEqual(withinExtentAndZ([0, Infinity, -1], tileGrid), true);
      assert.strictEqual(withinExtentAndZ([0, 0, Infinity], tileGrid), true);
      assert.strictEqual(withinExtentAndZ([0, -Infinity, -1], tileGrid), true);
      assert.strictEqual(withinExtentAndZ([0, 0, Infinity], tileGrid), true);
    });
  });
});
