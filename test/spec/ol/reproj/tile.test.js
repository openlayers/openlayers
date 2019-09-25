import ImageTile from '../../../../src/ol/ImageTile.js';
import {listen} from '../../../../src/ol/events.js';
import {addCommon, clearAllProjections, get as getProjection} from '../../../../src/ol/proj.js';
import {register} from '../../../../src/ol/proj/proj4.js';
import ReprojTile from '../../../../src/ol/reproj/Tile.js';
import {createForProjection} from '../../../../src/ol/tilegrid.js';


describe('ol.reproj.Tile', () => {
  beforeEach(() => {
    proj4.defs('EPSG:27700', '+proj=tmerc +lat_0=49 +lon_0=-2 ' +
        '+k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy ' +
        '+towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 ' +
        '+units=m +no_defs');
    register(proj4);
    const proj27700 = getProjection('EPSG:27700');
    proj27700.setExtent([0, 0, 700000, 1300000]);
  });

  afterEach(() => {
    delete proj4.defs['EPSG:27700'];
    clearAllProjections();
    addCommon();
  });


  function createTile(pixelRatio, opt_tileSize) {
    const proj4326 = getProjection('EPSG:4326');
    const proj3857 = getProjection('EPSG:3857');
    return new ReprojTile(
      proj3857, createForProjection(proj3857), proj4326,
      createForProjection(proj4326, 3, opt_tileSize),
      [3, 2, 1], null, pixelRatio, 0, function(z, x, y, pixelRatio) {
        return new ImageTile([z, x, y], 0, // IDLE
          'data:image/gif;base64,' +
              'R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=', null,
          function(tile, src) {
            tile.getImage().src = src;
          });
      });
  }

  test('changes state as expected', done => {
    const tile = createTile(1);
    expect(tile.getState()).toBe(0);
    listen(tile, 'change', function() {
      if (tile.getState() == 2) { // LOADED
        done();
      }
    });
    tile.load();
  });

  test('is empty when outside target tile grid', () => {
    const proj4326 = getProjection('EPSG:4326');
    const proj3857 = getProjection('EPSG:3857');
    const tile = new ReprojTile(
      proj3857, createForProjection(proj3857),
      proj4326, createForProjection(proj4326),
      [0, -1, 0], null, 1, 0, function() {
      throw Error('No tiles should be required');
    });
    expect(tile.getState()).toBe(4);
  });

  test('is empty when outside source tile grid', () => {
    const proj4326 = getProjection('EPSG:4326');
    const proj27700 = getProjection('EPSG:27700');
    const tile = new ReprojTile(
      proj27700, createForProjection(proj27700),
      proj4326, createForProjection(proj4326),
      [3, 2, -2], null, 1, 0, function() {
      throw Error('No tiles should be required');
    });
    expect(tile.getState()).toBe(4);
  });

  test('respects tile size of target tile grid', done => {
    const tile = createTile(1, [100, 40]);
    listen(tile, 'change', function() {
      if (tile.getState() == 2) { // LOADED
        const canvas = tile.getImage();
        expect(canvas.width).toBe(100);
        expect(canvas.height).toBe(40);
        done();
      }
    });
    tile.load();
  });

  test('respects pixelRatio', done => {
    const tile = createTile(3, [60, 20]);
    listen(tile, 'change', function() {
      if (tile.getState() == 2) { // LOADED
        const canvas = tile.getImage();
        expect(canvas.width).toBe(180);
        expect(canvas.height).toBe(60);
        done();
      }
    });
    tile.load();
  });
});
