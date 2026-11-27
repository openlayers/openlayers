import {assert} from 'chai';
import View, {
  withExtentCenter,
  withHigherResolutions,
  withLowerResolutions,
  withZoom,
} from '../../../src/ol/View.js';
import {
  addCommon,
  clearAllProjections,
  clearUserProjection,
  useGeographic,
} from '../../../src/ol/proj.js';

describe('ol/View.js', function () {
  afterEach(function () {
    clearAllProjections();
    clearUserProjection();
    addCommon();
  });

  describe('padding', function () {
    it('returns the same coordinates after padding reset', function () {
      useGeographic();
      const view = new View({
        center: [135, 35],
        zoom: 6,
      });
      const center = view.getCenter();
      view.padding = [0, 0, 0, 0];
      const point = view.getCenter();
      assert.approximately(point[0], center[0], 1e-9);
      assert.approximately(point[1], center[1], 1e-9);
    });
  });

  describe('withZoom()', () => {
    it('adds a zoom to view properties', () => {
      const config = {zoom: 2};
      const transform = withZoom(42);
      const transformed = transform(config);
      assert.deepEqual(transformed.zoom, 42);
    });
  });

  describe('withZoom()', () => {
    it('adds a zoom to view properties', () => {
      const config = {zoom: 2};
      const transform = withZoom(42);
      const transformed = transform(config);
      assert.deepEqual(transformed.zoom, 42);
    });
  });

  describe('withExtentCenter()', () => {
    it('adds a center given an extent', () => {
      const config = {extent: [-180, 0, 0, 90]};
      const transform = withExtentCenter();
      const transformed = transform(config);
      assert.deepEqual(transformed.center, [-90, 45]);
      assert.strictEqual(transformed.extent, undefined);
    });
  });

  describe('withHigherResolutions()', () => {
    it('adds higher resolutions', () => {
      const config = {resolutions: [100, 50]};
      const transform = withHigherResolutions(2);
      const transformed = transform(config);
      assert.deepEqual(transformed.resolutions, [100, 50, 25, 12.5]);
    });
  });

  describe('withLowerResolutions()', () => {
    it('adds lower resolutions', () => {
      const config = {resolutions: [100, 50]};
      const transform = withLowerResolutions(3);
      const transformed = transform(config);
      assert.deepEqual(transformed.resolutions, [800, 400, 200, 100, 50]);
    });
  });

  describe('#setMaxResolution()', () => {
    it('has no effect when resolutions are configured', () => {
      const view = new View({
        resolutions: [100000, 50000, 25000, 12500, 6250, 3125],
        resolution: 50000,
      });
      view.setMaxResolution(25000);
      assert.strictEqual(view.getMaxResolution(), 100000);
      assert.strictEqual(view.getResolution(), 50000);
    });

    it('constrains the resolution to the new maximum', () => {
      const view = new View({maxResolution: 100000, resolution: 50000});
      view.setMaxResolution(25000);
      assert.strictEqual(view.getMaxResolution(), 25000);
      assert.strictEqual(view.getResolution(), 25000);
    });
  });

  describe('#setMinResolution()', () => {
    it('has no effect when resolutions are configured', () => {
      const view = new View({
        resolutions: [100000, 50000, 25000, 12500, 6250, 3125],
        zoom: 4,
      });
      view.setMinResolution(25000);
      assert.strictEqual(view.getMinResolution(), 3125);
      assert.strictEqual(view.getZoom(), 4);
    });

    it('constrains the resolution to the new minimum', () => {
      const view = new View({maxResolution: 100000, zoom: 4});
      view.setMinResolution(25000);
      assert.strictEqual(view.getMinResolution(), 25000);
      assert.strictEqual(view.getZoom(), 2);
    });
  });

  describe('#setResolutions()', () => {
    it('clamps minZoom when its resolution is absent', () => {
      const view = new View({resolutions: [8, 4, 2, 1], minZoom: 2, zoom: 2});
      view.setResolutions([8, 4]);
      assert.deepEqual(view.getResolutions(), [8, 4]);
      assert.strictEqual(view.getMinZoom(), 1);
      assert.strictEqual(view.getZoom(), 1);
    });

    it('clamps maxZoom when its resolution is absent', () => {
      const view = new View({
        resolutions: [8, 4, 2, 1],
        minZoom: 1,
        maxZoom: 3,
        zoom: 2,
      });
      view.setResolutions([8, 4, 2]);
      assert.strictEqual(view.getMinZoom(), 1);
      assert.strictEqual(view.get('maxZoom'), 2);
    });

    it('keeps a matched minZoom when maxZoom would cross it', () => {
      const view = new View({
        resolutions: [8, 4, 2, 1],
        minZoom: 1,
        maxZoom: 2,
        zoom: 2,
      });
      view.setResolutions([32, 16, 8, 4, 1]);
      assert.strictEqual(view.getMinZoom(), 3);
      assert.strictEqual(view.getMaxZoom(), 3);
    });

    it('keeps a matched maxZoom when minZoom would cross it', () => {
      const view = new View({
        resolutions: [8, 4, 2, 1],
        minZoom: 1,
        maxZoom: 2,
        zoom: 2,
      });
      view.setResolutions([2, 1]);
      assert.strictEqual(view.getMinZoom(), 0);
      assert.strictEqual(view.getMaxZoom(), 0);
    });

    it('removes the resolutions when called with undefined', () => {
      const view = new View({resolutions: [8, 4, 2, 1], zoom: 2});
      view.setResolutions(undefined);
      assert.isUndefined(view.getResolutions());
      assert.strictEqual(view.getResolution(), 2);
    });
  });

  describe('#setExtent()', () => {
    it('constrains center and resolution to the new extent', () => {
      const view = new View({center: [200, 200], maxResolution: 4, zoom: 2});
      view.setExtent([0, 0, 100, 100]);
      assert.deepEqual(view.getCenter(), [50, 50]);
      assert.strictEqual(view.getResolution(), 1);
    });

    it('takes the extent in user coordinates', () => {
      useGeographic();
      const view = new View({
        center: [0, 0],
        constrainOnlyCenter: true,
        zoom: 2,
      });
      view.setExtent([10, 10, 20, 20]);
      const center = view.getCenter();
      assert.approximately(center[0], 10, 1e-10);
      assert.approximately(center[1], 10, 1e-10);
    });
  });
});
