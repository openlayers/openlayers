import {approximatelyEquals} from '../../../../src/ol/extent.js';
import {
  clearUserProjection,
  get,
  toUserExtent,
  toUserResolution,
  transformExtent,
  useGeographic,
} from '../../../../src/ol/proj.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';
import {tile} from '../../../../src/ol/loadingstrategy.js';

describe('ol/loadingstrategy', function () {
  describe('tile', function () {
    afterEach(function () {
      clearUserProjection();
    });
    it('uses a tile grid in view projection', function () {
      useGeographic();
      const tileGrid = createXYZ();
      const strategy = tile(tileGrid);
      const extent = tileGrid.getTileCoordExtent([1, 1, 1]);
      const userExtent = toUserExtent(extent, get('EPSG:3857'));
      const userResolution = toUserResolution(
        tileGrid.getResolution(1),
        get('EPSG:3857')
      );
      const extents = strategy(userExtent, userResolution, get('EPSG:3857'));
      expect(
        approximatelyEquals(
          transformExtent(extents[0], 'EPSG:4326', 'EPSG:3857'),
          extent,
          1e-8
        )
      ).to.be(true);
    });
  });
});
