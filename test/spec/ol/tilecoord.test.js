import {
  getKey,
  fromKey,
  hash,
  withinExtentAndZ
} from '../../../src/ol/tilecoord.js';
import TileGrid from '../../../src/ol/tilegrid/TileGrid.js';


describe('ol.TileCoord', () => {

  describe('create', () => {
    test('sets x y z properties as expected', () => {
      const tileCoord = [1, 2, 3];
      expect(tileCoord[0]).toEqual(1);
      expect(tileCoord[1]).toEqual(2);
      expect(tileCoord[2]).toEqual(3);
    });
  });

  describe('getKey()', () => {
    test('returns a key for a tile coord', () => {
      const key = getKey([1, 2, 3]);
      expect(key).toEqual('1/2/3');
    });
  });

  describe('fromKey()', () => {
    test('returns a tile coord given a key', () => {
      const tileCoord = [1, 2, 3];
      const key = getKey(tileCoord);

      const returned = fromKey(key);
      expect(returned).toEqual(tileCoord);
    });
  });

  describe('hash', () => {
    test('produces different hashes for different tile coords', () => {
      const tileCoord1 = [3, 2, 1];
      const tileCoord2 = [3, 1, 1];
      expect(hash(tileCoord1)).not.toEqual(hash(tileCoord2));
    });
  });

  describe('withinExtentAndZ', () => {

    test('restricts by z', () => {
      const tileGrid = new TileGrid({
        extent: [10, 20, 30, 40],
        tileSize: 10,
        resolutions: [2, 1],
        minZoom: 1
      });
      expect(withinExtentAndZ([0, 0, 0], tileGrid)).toBe(false);
      expect(withinExtentAndZ([1, 0, 0], tileGrid)).toBe(true);
      expect(withinExtentAndZ([2, 0, 0], tileGrid)).toBe(false);
    });

    test('restricts by extent when extent defines tile ranges', () => {
      const tileGrid = new TileGrid({
        extent: [10, 20, 30, 40],
        sizes: [[3, -3]],
        tileSize: 10,
        resolutions: [1]
      });
      expect(withinExtentAndZ([0, 1, 1], tileGrid)).toBe(true);
      expect(withinExtentAndZ([0, 2, 0], tileGrid)).toBe(false);
      expect(withinExtentAndZ([0, 0, 2], tileGrid)).toBe(false);
    });

    test('restricts by extent when sizes define tile ranges', () => {
      const tileGrid = new TileGrid({
        origin: [10, 20],
        sizes: [[3, 3]],
        tileSize: 10,
        resolutions: [1]
      });
      expect(withinExtentAndZ([0, 0, 0], tileGrid)).toBe(true);
      expect(withinExtentAndZ([0, 1, 0], tileGrid)).toBe(true);
      expect(withinExtentAndZ([0, 2, 0], tileGrid)).toBe(true);
      expect(withinExtentAndZ([0, 0, 1], tileGrid)).toBe(true);
      expect(withinExtentAndZ([0, 1, 1], tileGrid)).toBe(true);
      expect(withinExtentAndZ([0, 2, 1], tileGrid)).toBe(true);
      expect(withinExtentAndZ([0, 0, 2], tileGrid)).toBe(true);
      expect(withinExtentAndZ([0, 1, 2], tileGrid)).toBe(true);
      expect(withinExtentAndZ([0, 2, 2], tileGrid)).toBe(true);

      expect(withinExtentAndZ([0, 0, -1], tileGrid)).toBe(false);
      expect(withinExtentAndZ([0, 1, -1], tileGrid)).toBe(false);
      expect(withinExtentAndZ([0, 2, -1], tileGrid)).toBe(false);
      expect(withinExtentAndZ([0, -1, 0], tileGrid)).toBe(false);
      expect(withinExtentAndZ([0, 3, 0], tileGrid)).toBe(false);
      expect(withinExtentAndZ([0, -1, 1], tileGrid)).toBe(false);
      expect(withinExtentAndZ([0, 3, 1], tileGrid)).toBe(false);
      expect(withinExtentAndZ([0, -1, 2], tileGrid)).toBe(false);
      expect(withinExtentAndZ([0, 3, 2], tileGrid)).toBe(false);
      expect(withinExtentAndZ([0, 0, 3], tileGrid)).toBe(false);
      expect(withinExtentAndZ([0, 1, 3], tileGrid)).toBe(false);
      expect(withinExtentAndZ([0, 2, 3], tileGrid)).toBe(false);
    });

    test('restricts by extent when sizes (neg y) define tile ranges', () => {
      const tileGrid = new TileGrid({
        origin: [10, 40],
        sizes: [[3, -3]],
        tileSize: 10,
        resolutions: [1]
      });
      expect(withinExtentAndZ([0, 0, -1], tileGrid)).toBe(true);
      expect(withinExtentAndZ([0, 1, -1], tileGrid)).toBe(true);
      expect(withinExtentAndZ([0, 2, -1], tileGrid)).toBe(true);
      expect(withinExtentAndZ([0, 0, -2], tileGrid)).toBe(true);
      expect(withinExtentAndZ([0, 1, -2], tileGrid)).toBe(true);
      expect(withinExtentAndZ([0, 2, -2], tileGrid)).toBe(true);
      expect(withinExtentAndZ([0, 0, -3], tileGrid)).toBe(true);
      expect(withinExtentAndZ([0, 1, -3], tileGrid)).toBe(true);
      expect(withinExtentAndZ([0, 2, -3], tileGrid)).toBe(true);

      expect(withinExtentAndZ([0, 0, 0], tileGrid)).toBe(false);
      expect(withinExtentAndZ([0, 1, 0], tileGrid)).toBe(false);
      expect(withinExtentAndZ([0, 2, 0], tileGrid)).toBe(false);
      expect(withinExtentAndZ([0, -1, -1], tileGrid)).toBe(false);
      expect(withinExtentAndZ([0, 3, -1], tileGrid)).toBe(false);
      expect(withinExtentAndZ([0, -1, -2], tileGrid)).toBe(false);
      expect(withinExtentAndZ([0, 3, -2], tileGrid)).toBe(false);
      expect(withinExtentAndZ([0, -1, -3], tileGrid)).toBe(false);
      expect(withinExtentAndZ([0, 3, -3], tileGrid)).toBe(false);
      expect(withinExtentAndZ([0, 0, -4], tileGrid)).toBe(false);
      expect(withinExtentAndZ([0, 1, -4], tileGrid)).toBe(false);
      expect(withinExtentAndZ([0, 2, -4], tileGrid)).toBe(false);
    });

    test('does not restrict by extent with no extent or sizes', () => {
      const tileGrid = new TileGrid({
        origin: [10, 20],
        tileSize: 10,
        resolutions: [1]
      });
      expect(withinExtentAndZ([0, Infinity, -1], tileGrid)).toBe(true);
      expect(withinExtentAndZ([0, 0, Infinity], tileGrid)).toBe(true);
      expect(withinExtentAndZ([0, -Infinity, -1], tileGrid)).toBe(true);
      expect(withinExtentAndZ([0, 0, Infinity], tileGrid)).toBe(true);
    });
  });

});
