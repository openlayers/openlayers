import {fromExtent} from '../../../../src/ol/geom/Polygon.js';
import {getArea} from '../../../../src/ol/geodesy.js';
import {getArea as getSphereArea} from '../../../../src/ol/sphere.js';

describe('ol/geodesy', function () {
  describe('getArea() vs Sphere', function () {
    it('checks that the sphere area is greater than the ellipse near the equator', function () {
      const poly = fromExtent([
        -75.5373443264917, 6.39356213848593, -75.2552891711363,
        8.65373933348684,
      ]);

      const options = {
        projection: 'EPSG:4326',
      };

      expect(getArea(poly, options)).to.be.below(getSphereArea(poly, options));
    });
  });
});
