import {expandUrl, createFromTemplate, createFromTemplates, createFromTileUrlFunctions} from '../../../src/ol/tileurlfunction.js';
import {createXYZ} from '../../../src/ol/tilegrid.js';
import TileGrid from '../../../src/ol/tilegrid/TileGrid.js';

describe('ol.TileUrlFunction', () => {

  describe('expandUrl', () => {
    describe('with number range', () => {
      test('creates expected URLs', () => {
        const template = 'http://tile-{1-3}/{z}/{x}/{y}';
        const urls = expandUrl(template);
        expect(urls).toEqual([
          'http://tile-1/{z}/{x}/{y}',
          'http://tile-2/{z}/{x}/{y}',
          'http://tile-3/{z}/{x}/{y}'
        ]);
      });
      test('creates expected URLs', () => {
        const template = 'http://tile-{9-11}/{z}/{x}/{y}';
        const urls = expandUrl(template);
        expect(urls).toEqual([
          'http://tile-9/{z}/{x}/{y}',
          'http://tile-10/{z}/{x}/{y}',
          'http://tile-11/{z}/{x}/{y}'
        ]);
      });
    });
    describe('with character range', () => {
      test('creates expected URLs', () => {
        const template = 'http://tile-{c-e}/{z}/{x}/{y}';
        const urls = expandUrl(template);
        expect(urls).toEqual([
          'http://tile-c/{z}/{x}/{y}',
          'http://tile-d/{z}/{x}/{y}',
          'http://tile-e/{z}/{x}/{y}'
        ]);
      });
    });
    describe('without range', () => {
      test('creates expected URLs', () => {
        const template = 'http://tiles.example.com/{z}/{x}/{y}';
        const urls = expandUrl(template);
        expect(urls).toEqual([
          'http://tiles.example.com/{z}/{x}/{y}'
        ]);
      });
    });
  });

  describe('createFromTemplate', () => {
    const tileGrid = createXYZ();
    test('creates expected URL', () => {
      const tileUrl = createFromTemplate('{z}/{x}/{y}', tileGrid);
      expect(tileUrl([3, 2, 1])).toEqual('3/2/1');
      expect(tileUrl(null)).toBe(undefined);
    });
    test('accepts {-y} placeholder', () => {
      const tileUrl = createFromTemplate('{z}/{x}/{-y}', tileGrid);
      expect(tileUrl([3, 2, 2])).toEqual('3/2/5');
    });
    test('returns correct value for {-y} with custom tile grids', () => {
      const customTileGrid = new TileGrid({
        extent: [-180, -90, 180, 90],
        origin: [-180, -90],
        resolutions: [360 / 256, 360 / 512, 360 / 1024, 360 / 2048]
      });
      const tileUrl = createFromTemplate('{z}/{x}/{-y}', customTileGrid);
      expect(tileUrl([3, 2, 2])).toEqual('3/2/1');
    });
    test('replaces multiple placeholder occurrences', () => {
      const tileUrl = createFromTemplate('{z}/{z}{x}{y}', tileGrid);
      expect(tileUrl([3, 2, 1])).toEqual('3/321');
    });
  });

  describe('createFromTemplates', () => {
    const tileGrid = createXYZ();
    test('creates expected URL', () => {
      const templates = [
        'http://tile-1/{z}/{x}/{y}'
      ];
      const tileUrlFunction = createFromTemplates(templates, tileGrid);
      const tileCoord = [3, 2, 1];

      expect(tileUrlFunction(tileCoord)).toEqual('http://tile-1/3/2/1');
    });
  });

  describe('createFromTileUrlFunctions', () => {
    const tileGrid = createXYZ();
    test('creates expected URL', () => {
      const tileUrl = createFromTileUrlFunctions([
        createFromTemplate('a', tileGrid),
        createFromTemplate('b', tileGrid)
      ]);
      const tileUrl1 = tileUrl([1, 0, 0]);
      const tileUrl2 = tileUrl([1, 0, 1]);
      expect(tileUrl1).not.toBe(tileUrl2);
      expect(tileUrl(null)).toBe(undefined);
    });
  });

});
