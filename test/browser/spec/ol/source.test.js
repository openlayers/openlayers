import TileGrid from '../../../../src/ol/tilegrid/TileGrid.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';
import {get} from '../../../../src/ol/proj.js';
import {sourcesFromTileGrid} from '../../../../src/ol/source.js';

describe('ol/source', function () {
  describe('sourcesFromTileGrid()', function () {
    it('returns a function that returns the correct source', function () {
      const resolutions = createXYZ({maxZoom: 1}).getResolutions();
      const tileGrid = new TileGrid({
        extent: get('EPSG:3857').getExtent(),
        resolutions: [resolutions[1]],
        tileSizes: [[256, 512]],
      });
      const factory = function (tileCoord) {
        return new XYZ({
          url: tileCoord.join('-') + '/{z}/{x}/{y}.png',
          tileGrid: new TileGrid({
            resolutions,
            minZoom: tileCoord[0],
            maxZoom: tileCoord[0] + 1,
            extent: tileGrid.getTileCoordExtent(tileCoord),
            origin: [-20037508.342789244, 20037508.342789244],
          }),
        });
      };
      const getSources = sourcesFromTileGrid(tileGrid, factory);
      expect(getSources(tileGrid.getExtent(), resolutions[1]).length).to.be(2);
      expect(
        getSources(
          [-10000, -10000, -5000, 10000],
          resolutions[1]
        )[0].getUrls()[0]
      ).to.be('0-0-0/{z}/{x}/{y}.png');
      expect(
        getSources([5000, -10000, 10000, 10000], resolutions[1])[0].getUrls()[0]
      ).to.be('0-1-0/{z}/{x}/{y}.png');
    });
  });
});
