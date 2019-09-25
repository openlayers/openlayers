import {calculateSourceResolution} from '../../../../src/ol/reproj.js';
import {get as getProjection, transform} from '../../../../src/ol/proj.js';


describe('ol.reproj', () => {

  describe('#calculateSourceResolution', () => {
    const proj3857 = getProjection('EPSG:3857');
    const proj4326 = getProjection('EPSG:4326');
    const origin = [0, 0];
    const point3857 = [50, 40];
    const point4326 = transform(point3857, proj3857, proj4326);

    test('is identity for identical projection', () => {
      let result;
      const resolution = 500;
      result = calculateSourceResolution(
        proj3857, proj3857, origin, resolution);
      expect(result).toBe(resolution);

      result = calculateSourceResolution(
        proj3857, proj3857, point3857, resolution);
      expect(result).toBe(resolution);

      result = calculateSourceResolution(
        proj4326, proj4326, point4326, resolution);
      expect(result).toBe(resolution);
    });

    test('calculates correctly', () => {
      const resolution4326 = 5;

      const resolution3857 = calculateSourceResolution(
        proj3857, proj4326, point4326, resolution4326);
      expect(resolution3857).not.toBe(resolution4326);
      expect(resolution3857).to.roughlyEqual(
        5 * proj4326.getMetersPerUnit(), 1e-4);

      const result = calculateSourceResolution(
        proj4326, proj3857, point3857, resolution3857);
      expect(result).toBe(resolution4326);
    });
  });
});
