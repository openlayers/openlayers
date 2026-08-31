import {expect} from 'vitest';
import Feature from '../../../../../../src/ol/Feature.js';
import Polygon from '../../../../../../src/ol/geom/Polygon.js';
import {
  fromLonLat,
  get as getProjection,
} from '../../../../../../src/ol/proj.js';
import {featuresForExtent} from '../../../../../../src/ol/renderer/webgpu/VectorLayer.js';
import VectorSource from '../../../../../../src/ol/source/Vector.js';

describe('ol/renderer/webgpu/VectorLayer', () => {
  const world = 20037508.342789244;

  /**
   * A polygon wide enough to sit in the world either side of the antimeridian.
   * @return {VectorSource} Source holding it.
   */
  function wideSource() {
    const ring = [];
    for (let lon = -170; lon <= 170; lon += 10) {
      ring.push(fromLonLat([lon, 40]));
    }
    for (let lon = 170; lon >= -170; lon -= 10) {
      ring.push(fromLonLat([lon, -40]));
    }
    ring.push(ring[0]);
    return new VectorSource({features: [new Feature(new Polygon([ring]))]});
  }

  describe('featuresForExtent()', () => {
    it('returns a feature once for an extent that reaches past the world', () => {
      // The source answers such an extent one world at a time, so a feature in
      // two of them comes back twice, and building it twice doubles the alpha
      // of a translucent fill.
      const source = wideSource();
      const mercator = getProjection('EPSG:3857');
      const extent = [world * 0.5, -world, world * 1.5, world];

      expect(source.getFeaturesInExtent(extent, mercator)).to.have.length(2);
      expect(featuresForExtent(source, extent, mercator)).to.have.length(1);
    });

    it('leaves an extent within one world alone', () => {
      const source = wideSource();
      const mercator = getProjection('EPSG:3857');
      const extent = [0, -world, world, world];

      expect(featuresForExtent(source, extent, mercator)).to.have.length(1);
    });

    it('falls back to every feature when the source has no index', () => {
      const source = wideSource();
      source.getFeaturesInExtent = null;

      expect(
        featuresForExtent(source, [0, 0, 1, 1], getProjection('EPSG:3857')),
      ).to.have.length(1);
    });
  });
});
