import TileGrid from '../../../../src/ol/tilegrid/TileGrid.js';
import {
  createFromTemplate,
  createFromTemplates,
  createFromTileUrlFunctions,
} from '../../../../src/ol/tileurlfunction.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';

describe('ol.TileUrlFunction', function () {
  describe('createFromTemplate', function () {
    const tileGrid = createXYZ();
    it('creates expected URL', function () {
      const tileUrl = createFromTemplate('{z}/{x}/{y}', tileGrid);
      expect(tileUrl([3, 2, 1])).to.eql('3/2/1');
      expect(tileUrl(null)).to.be(undefined);
    });
    it('accepts {-y} placeholder', function () {
      const tileUrl = createFromTemplate('{z}/{x}/{-y}', tileGrid);
      expect(tileUrl([3, 2, 2])).to.eql('3/2/5');
    });
    it('returns correct value for {-y} with custom tile grids', function () {
      const customTileGrid = new TileGrid({
        extent: [-180, -90, 180, 90],
        origin: [-180, -90],
        resolutions: [360 / 256, 360 / 512, 360 / 1024, 360 / 2048],
      });
      const tileUrl = createFromTemplate('{z}/{x}/{-y}', customTileGrid);
      expect(tileUrl([3, 2, 2])).to.eql('3/2/1');
    });
    it('replaces multiple placeholder occurrences', function () {
      const tileUrl = createFromTemplate('{z}/{z}{x}{y}', tileGrid);
      expect(tileUrl([3, 2, 1])).to.eql('3/321');
    });
  });

  describe('createFromTemplates', function () {
    const tileGrid = createXYZ();
    it('creates expected URL', function () {
      const templates = ['http://tile-1/{z}/{x}/{y}'];
      const tileUrlFunction = createFromTemplates(templates, tileGrid);
      const tileCoord = [3, 2, 1];

      expect(tileUrlFunction(tileCoord)).to.eql('http://tile-1/3/2/1');
    });
  });

  describe('createFromTileUrlFunctions', function () {
    const tileGrid = createXYZ();
    it('creates expected URL', function () {
      const tileUrl = createFromTileUrlFunctions([
        createFromTemplate('a', tileGrid),
        createFromTemplate('b', tileGrid),
      ]);
      const tileUrl1 = tileUrl([1, 0, 0]);
      const tileUrl2 = tileUrl([1, 0, 1]);
      expect(tileUrl1).not.to.be(tileUrl2);
      expect(tileUrl(null)).to.be(undefined);
    });
  });
});
