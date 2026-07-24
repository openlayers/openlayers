import {assert} from 'chai';
import proj4 from 'proj4';
import ImageTile from '../../../../../src/ol/ImageTile.js';
import {createCanvasContext2D} from '../../../../../src/ol/dom.js';
import {listen} from '../../../../../src/ol/events.js';
import {
  addCommon,
  clearAllProjections,
  get as getProjection,
} from '../../../../../src/ol/proj.js';
import {register} from '../../../../../src/ol/proj/proj4.js';
import ReprojTile from '../../../../../src/ol/reproj/Tile.js';
import {createForProjection} from '../../../../../src/ol/tilegrid.js';

describe('ol.reproj.Tile', function () {
  beforeEach(function () {
    proj4.defs(
      'EPSG:27700',
      '+proj=tmerc +lat_0=49 +lon_0=-2 ' +
        '+k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy ' +
        '+towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 ' +
        '+units=m +no_defs',
    );
    register(proj4);
    const proj27700 = getProjection('EPSG:27700');
    proj27700.setExtent([0, 0, 700000, 1300000]);
  });

  afterEach(function () {
    delete proj4.defs['EPSG:27700'];
    clearAllProjections();
    addCommon();
  });

  function createTile(pixelRatio, opt_tileSize) {
    const proj4326 = getProjection('EPSG:4326');
    const proj3857 = getProjection('EPSG:3857');
    const mapPixelRatio = 1;
    return new ReprojTile(
      proj3857,
      createForProjection(proj3857),
      proj4326,
      createForProjection(proj4326, 3, opt_tileSize),
      [3, 2, 1],
      null,
      mapPixelRatio,
      0,
      function (z, x, y, mapPixelRatio) {
        return new ImageTile(
          [z, x, y],
          0, // IDLE
          createCanvasContext2D(
            256 * pixelRatio,
            256 * pixelRatio,
          ).canvas.toDataURL(),
          null,
          function (tile, src) {
            tile.getImage().src = src;
          },
        );
      },
    );
  }

  it('changes state as expected', () =>
    new Promise((resolve) => {
      const tile = createTile(1);
      assert.strictEqual(tile.getState(), 0);
      listen(tile, 'change', function () {
        if (tile.getState() == 2) {
          // LOADED
          resolve();
        }
      });
      tile.load();
    }));

  it('is empty when outside target tile grid', function () {
    const proj4326 = getProjection('EPSG:4326');
    const proj3857 = getProjection('EPSG:3857');
    const tile = new ReprojTile(
      proj3857,
      createForProjection(proj3857),
      proj4326,
      createForProjection(proj4326),
      [0, -1, 0],
      null,
      1,
      0,
      function () {
        assert.fail();
      },
    );
    assert.strictEqual(tile.getState(), 4);
  });

  it('is empty when outside source tile grid', function () {
    const proj4326 = getProjection('EPSG:4326');
    const proj27700 = getProjection('EPSG:27700');
    const tile = new ReprojTile(
      proj27700,
      createForProjection(proj27700),
      proj4326,
      createForProjection(proj4326),
      [3, 2, -2],
      null,
      1,
      0,
      function () {
        assert.fail();
      },
    );
    assert.strictEqual(tile.getState(), 4);
  });

  it('respects tile size of target tile grid', () =>
    new Promise((resolve) => {
      const tile = createTile(1, [100, 40]);
      listen(tile, 'change', function () {
        if (tile.getState() == 2) {
          // LOADED
          const canvas = tile.getImage();
          assert.strictEqual(canvas.width, 100);
          assert.strictEqual(canvas.height, 40);
          resolve();
        }
      });
      tile.load();
    }));

  it('respects pixelRatio', () =>
    new Promise((resolve) => {
      const tile = createTile(3, [60, 20]);
      listen(tile, 'change', function () {
        if (tile.getState() == 2) {
          // LOADED
          const canvas = tile.getImage();
          assert.strictEqual(canvas.width, 180);
          assert.strictEqual(canvas.height, 60);
          resolve();
        }
      });
      tile.load();
    }));
});
