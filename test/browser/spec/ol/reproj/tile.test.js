import ImageTile from '../../../../../src/ol/ImageTile.js';
import ReprojTile from '../../../../../src/ol/reproj/Tile.js';
import {
  addCommon,
  clearAllProjections,
  get as getProjection,
} from '../../../../../src/ol/proj.js';
import {createForProjection} from '../../../../../src/ol/tilegrid.js';
import {listen} from '../../../../../src/ol/events.js';
import {register} from '../../../../../src/ol/proj/proj4.js';

describe('ol.reproj.Tile', function () {
  beforeEach(function () {
    proj4.defs(
      'EPSG:27700',
      '+proj=tmerc +lat_0=49 +lon_0=-2 ' +
        '+k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy ' +
        '+towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 ' +
        '+units=m +no_defs'
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
    return new ReprojTile(
      proj3857,
      createForProjection(proj3857),
      proj4326,
      createForProjection(proj4326, 3, opt_tileSize),
      [3, 2, 1],
      null,
      pixelRatio,
      0,
      function (z, x, y, pixelRatio) {
        return new ImageTile(
          [z, x, y],
          0, // IDLE
          'data:image/gif;base64,' +
            'R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=',
          null,
          function (tile, src) {
            tile.getImage().src = src;
          }
        );
      }
    );
  }

  it('changes state as expected', function (done) {
    const tile = createTile(1);
    expect(tile.getState()).to.be(0); // IDLE
    listen(tile, 'change', function () {
      if (tile.getState() == 2) {
        // LOADED
        done();
      }
    });
    tile.load();
  });

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
        expect().fail('No tiles should be required');
      }
    );
    expect(tile.getState()).to.be(4); // EMPTY
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
        expect().fail('No tiles should be required');
      }
    );
    expect(tile.getState()).to.be(4); // EMPTY
  });

  it('respects tile size of target tile grid', function (done) {
    const tile = createTile(1, [100, 40]);
    listen(tile, 'change', function () {
      if (tile.getState() == 2) {
        // LOADED
        const canvas = tile.getImage();
        expect(canvas.width).to.be(100);
        expect(canvas.height).to.be(40);
        done();
      }
    });
    tile.load();
  });

  it('respects pixelRatio', function (done) {
    const tile = createTile(3, [60, 20]);
    listen(tile, 'change', function () {
      if (tile.getState() == 2) {
        // LOADED
        const canvas = tile.getImage();
        expect(canvas.width).to.be(180);
        expect(canvas.height).to.be(60);
        done();
      }
    });
    tile.load();
  });
});
