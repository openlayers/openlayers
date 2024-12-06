import View from '../../../src/ol/View.js';
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
});
