import {hasArea, toSize, buffer as bufferSize, scale as scaleSize} from '../../../src/ol/size.js';


describe('ol.size', () => {

  describe('buffer()', () => {

    test('buffers a size', () => {
      const size = [50, 75];
      const bufferedSize = bufferSize(size, 20);
      expect(bufferedSize).toEqual([90, 115]);
    });

    test('reuses an existing array', () => {
      const reuse = [0, 0];
      const size = [50, 50];
      const bufferedSize = bufferSize(size, 20, reuse);
      expect(bufferedSize).toBe(reuse);
    });

  });

  describe('hasArea()', () => {

    test('determines if a size has a positive area', () => {
      expect(hasArea([50, 75])).toBe(true);
      expect(hasArea([0, 75])).toBe(false);
      expect(hasArea([50, 0])).toBe(false);
      expect(hasArea([0, 0])).toBe(false);
      expect(hasArea([-1, 75])).toBe(false);
      expect(hasArea([50, -1])).toBe(false);
      expect(hasArea([-1, -1])).toBe(false);
    });

  });

  describe('scale()', () => {

    test('scales a size and rounds the result', () => {
      const size = [50, 75];
      const scaledSize = scaleSize(size, 1.75);
      expect(scaledSize).toEqual([88, 131]);
    });

    test('reuses an existing array', () => {
      const reuse = [0, 0];
      const size = [50, 50];
      const scaledSize = scaleSize(size, 1.75, reuse);
      expect(scaledSize).toBe(reuse);
    });

  });

  describe('toSize()', () => {

    test('creates a size array from a number', () => {
      const size = toSize(512);
      expect(size).toEqual([512, 512]);
    });

    test('reuses an existing array', () => {
      const sizeArray = [0, 0];
      const size = toSize(512, sizeArray);
      expect(size).toBe(sizeArray);
    });

    test('returns a size array unaltered', () => {
      const sizeArray = [512, 256];
      let size = toSize(sizeArray);
      expect(size).toBe(sizeArray);
      size = toSize(sizeArray, [0, 0]);
      expect(size).toBe(sizeArray);
    });

  });

});
