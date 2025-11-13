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
import expect from '../expect.js';

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
      expect(point[0]).to.roughlyEqual(center[0], 1e-9);
      expect(point[1]).to.roughlyEqual(center[1], 1e-9);
    });
  });

  describe('withZoom()', () => {
    it('adds a zoom to view properties', () => {
      const config = {zoom: 2};
      const transform = withZoom(42);
      const transformed = transform(config);
      expect(transformed.zoom).to.eql(42);
    });
  });

  describe('withZoom()', () => {
    it('adds a zoom to view properties', () => {
      const config = {zoom: 2};
      const transform = withZoom(42);
      const transformed = transform(config);
      expect(transformed.zoom).to.eql(42);
    });
  });

  describe('withExtentCenter()', () => {
    it('adds a center given an extent', () => {
      const config = {extent: [-180, 0, 0, 90]};
      const transform = withExtentCenter();
      const transformed = transform(config);
      expect(transformed.center).to.eql([-90, 45]);
      expect(transformed.extent).to.be(undefined);
    });
  });

  describe('withHigherResolutions()', () => {
    it('adds higher resolutions', () => {
      const config = {resolutions: [100, 50]};
      const transform = withHigherResolutions(2);
      const transformed = transform(config);
      expect(transformed.resolutions).to.eql([100, 50, 25, 12.5]);
    });
  });

  describe('withLowerResolutions()', () => {
    it('adds lower resolutions', () => {
      const config = {resolutions: [100, 50]};
      const transform = withLowerResolutions(3);
      const transformed = transform(config);
      expect(transformed.resolutions).to.eql([800, 400, 200, 100, 50]);
    });
  });
});
