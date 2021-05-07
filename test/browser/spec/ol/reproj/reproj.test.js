import {calculateSourceResolution} from '../../../../../src/ol/reproj.js';
import {get as getProjection, transform} from '../../../../../src/ol/proj.js';

describe('ol.reproj', function () {
  describe('#calculateSourceResolution', function () {
    const proj3857 = getProjection('EPSG:3857');
    const proj4326 = getProjection('EPSG:4326');
    const origin = [0, 0];
    const point3857 = [50, 40];
    const point4326 = transform(point3857, proj3857, proj4326);

    it('is identity for identical projection', function () {
      let result;
      const resolution = 500;
      result = calculateSourceResolution(
        proj3857,
        proj3857,
        origin,
        resolution
      );
      expect(result).to.be(resolution);

      result = calculateSourceResolution(
        proj3857,
        proj3857,
        point3857,
        resolution
      );
      expect(result).to.be(resolution);

      result = calculateSourceResolution(
        proj4326,
        proj4326,
        point4326,
        resolution
      );
      expect(result).to.be(resolution);
    });

    it('calculates correctly', function () {
      const resolution4326 = 5;

      const resolution3857 = calculateSourceResolution(
        proj3857,
        proj4326,
        point4326,
        resolution4326
      );
      expect(resolution3857).not.to.be(resolution4326);
      expect(resolution3857).to.roughlyEqual(
        5 * proj4326.getMetersPerUnit(),
        1e-4
      );

      const result = calculateSourceResolution(
        proj4326,
        proj3857,
        point3857,
        resolution3857
      );
      expect(result).to.be(resolution4326);
    });
  });
});
