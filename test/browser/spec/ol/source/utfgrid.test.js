import {assert} from 'chai';
import {
  fromLonLat,
  get as getProjection,
  transformExtent,
} from '../../../../../src/ol/proj.js';
import TileSource from '../../../../../src/ol/source/Tile.js';
import UTFGrid, {CustomTile} from '../../../../../src/ol/source/UTFGrid.js';
import TileGrid from '../../../../../src/ol/tilegrid/TileGrid.js';

describe('ol.source.UTFGrid', function () {
  const url = 'spec/ol/data/utfgrid.json';
  let tileJson = null;

  // Load and parse the UTFGrid fixture
  beforeAll(
    () =>
      new Promise((resolve, reject) => {
        const client = new XMLHttpRequest();
        client.addEventListener('load', function () {
          tileJson = JSON.parse(this.responseText);
          resolve();
        });
        client.addEventListener('error', function () {
          reject(new Error('Failed to fetch ' + url));
        });
        client.open('GET', url);
        client.send();
      }),
  );

  afterAll(function () {
    tileJson = null;
  });

  function getUTFGrid() {
    return new UTFGrid({
      url: url,
    });
  }

  describe('constructor', function () {
    it('needs to be constructed with url option', function () {
      const source = new UTFGrid({url: url});
      assert.instanceOf(source, UTFGrid);
      assert.instanceOf(source, TileSource);

      assert.throws(function () {
        // no options: will throw
        return new UTFGrid();
      });

      assert.throws(function () {
        // no url-option: will throw
        return new UTFGrid({});
      });

      assert.instanceOf(getUTFGrid(), UTFGrid);
    });
  });

  describe('change event (ready)', function () {
    it('is fired when the source is ready', () =>
      new Promise((resolve) => {
        const source = new UTFGrid({
          url: url,
        });
        assert.strictEqual(source.getState(), 'loading');
        assert.strictEqual(source.tileGrid, null);

        source.on('change', function (event) {
          if (source.getState() === 'ready') {
            assert.instanceOf(source.tileGrid, TileGrid);
            resolve();
          }
        });
      }));
  });

  describe('change event (error)', function () {
    it('is fired when the source fails to initialize', () =>
      new Promise((resolve) => {
        const source = new UTFGrid({
          url: 'Bogus UTFGrid URL',
        });
        assert.strictEqual(source.getState(), 'loading');
        assert.strictEqual(source.tileGrid, null);

        source.on('change', function (event) {
          if (source.getState() === 'error') {
            assert.strictEqual(source.tileGrid, null);
            resolve();
          }
        });
      }));
  });

  describe('#handleTileJSONResponse', function () {
    it('sets up a tileGrid', function () {
      const source = getUTFGrid();
      assert.strictEqual(source.getTileGrid(), null);
      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      const tileGrid = source.getTileGrid();
      assert.notEqual(tileGrid, null);
      assert.instanceOf(tileGrid, TileGrid);
    });

    it('sets up a tilegrid with expected extent', function () {
      const source = getUTFGrid();
      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      const tileGrid = source.getTileGrid();
      const extent = tileGrid.getExtent();

      const proj4326 = getProjection('EPSG:4326');
      const proj3857 = getProjection('EPSG:3857');
      const expectedExtent4326 = tileJson.bounds;
      const expectedExtent3857 = transformExtent(
        expectedExtent4326,
        proj4326,
        proj3857,
      );
      assert.deepEqual(extent, proj3857.getExtent());
      assert.approximately(extent[0], expectedExtent3857[0], 1e-8);
      assert.approximately(extent[1], expectedExtent3857[1], 1e-8);
      assert.approximately(extent[2], expectedExtent3857[2], 1e-8);
      assert.approximately(extent[3], expectedExtent3857[3], 1e-8);
    });

    it('sets up a tilegrid with expected minZoom', function () {
      const source = getUTFGrid();
      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      const tileGrid = source.getTileGrid();
      const minZoom = tileGrid.getMinZoom();
      assert.deepEqual(minZoom, tileJson.minzoom);
    });

    it('sets up a tilegrid with expected maxZoom', function () {
      const source = getUTFGrid();
      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      const tileGrid = source.getTileGrid();
      const maxZoom = tileGrid.getMaxZoom();
      assert.deepEqual(maxZoom, tileJson.maxzoom);
    });

    it('sets up a template', function () {
      const source = getUTFGrid();
      assert.strictEqual(source.getTemplate(), undefined);

      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      const template = source.getTemplate();
      assert.notEqual(template, undefined);
      assert.strictEqual(template, tileJson.template);
    });

    it('sets up correct attribution', function () {
      const source = getUTFGrid();
      assert.strictEqual(source.getAttributions(), null);

      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      const attributions = source.getAttributions();
      assert.notEqual(attributions, null);
      assert.strictEqual(typeof attributions, 'function');
    });

    it('sets correct state', function () {
      const source = getUTFGrid();
      assert.strictEqual(source.getState(), 'loading');

      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      assert.strictEqual(source.getState(), 'ready');
    });
  });

  describe('#forDataAtCoordinateAndResolution', function () {
    let source = null;
    const bonn3857 = fromLonLat([7.099814, 50.733992]);
    const noState3857 = [0, 0];
    const resolutionZoom1 = 78271.51696402048;

    let gridJson110 = null;
    // Called once for this describe section, this method will request a local
    // grid for one tile (1/1/0) and store the result in a variable. This allows
    // us to overwrite getTile in a way that removes the dependency on an
    // external service. See below in the `beforeEach`-method.
    beforeAll(
      () =>
        new Promise((resolve, reject) => {
          const client = new XMLHttpRequest();
          client.addEventListener('load', function () {
            gridJson110 = JSON.parse(this.responseText);
            resolve();
          });
          client.addEventListener('error', function () {
            reject(new Error('Failed to fetch local grid.json'));
          });
          client.open(
            'GET',
            'spec/ol/data/mapbox-geography-class-1-1-0.grid.json',
          );
          client.send();
        }),
    );
    afterAll(function () {
      gridJson110 = null;
    });

    beforeEach(function () {
      source = getUTFGrid();
      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      // Override getTile method to not depend on the external service. The
      // signature of the method is kept the same, but the returned tile will
      // always be for [1, 1, 0].
      source.getTile = function (z, x, y, pixelRatio, projection) {
        const tileCoord = [1, 1, 0]; // overwritten to match our stored JSON
        const urlTileCoord = this.getTileCoordForTileUrlFunction(
          tileCoord,
          projection,
        );
        const tileUrl = this.tileUrlFunction_(
          urlTileCoord,
          pixelRatio,
          projection,
        );
        const tile = new CustomTile(
          tileCoord,
          tileUrl !== undefined ? 0 : 4, // IDLE : EMPTY
          tileUrl !== undefined ? tileUrl : '',
          this.tileGrid.getTileCoordExtent(tileCoord),
          true,
        ); // always preemptive, so loading doesn't happen automatically
        // manually call handleLoad_ with our local JSON data
        tile.handleLoad_(gridJson110);
        return tile;
      };
    });
    afterEach(function () {
      source = null;
    });

    it('calls callback with data if found', () =>
      new Promise((resolve) => {
        const callback = function (data) {
          assert.lengthOf(arguments, 1);
          assert.notEqual(data, null);
          assert.strictEqual('admin' in data, true);
          assert.strictEqual(data.admin, 'Germany');
          resolve();
        };
        source.forDataAtCoordinateAndResolution(
          bonn3857,
          resolutionZoom1,
          callback,
          true,
        );
      }));

    it('calls callback with `null` if not found', () =>
      new Promise((resolve) => {
        const callback = function (data) {
          assert.lengthOf(arguments, 1);
          assert.strictEqual(data, null);
          resolve();
        };
        source.forDataAtCoordinateAndResolution(
          noState3857,
          resolutionZoom1,
          callback,
          true,
        );
      }));
  });
});
