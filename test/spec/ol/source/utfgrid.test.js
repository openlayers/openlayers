import {get as getProjection, transformExtent, fromLonLat} from '../../../../src/ol/proj.js';
import TileSource from '../../../../src/ol/source/Tile.js';
import UTFGrid, {CustomTile} from '../../../../src/ol/source/UTFGrid.js';
import TileGrid from '../../../../src/ol/tilegrid/TileGrid.js';


describe('ol.source.UTFGrid', () => {
  let testContext;

  beforeEach(() => {
    testContext = {};
  });

  const url = 'spec/ol/data/utfgrid.json';
  let tileJson = null;

  // Load and parse the UTFGrid fixture
  beforeAll(function(done) {
    const client = new XMLHttpRequest();
    client.addEventListener('load', function() {
      tileJson = JSON.parse(this.responseText);
      done();
    });
    client.addEventListener('error', function() {
      done(new Error('Failed to fetch ' + url));
    });
    client.open('GET', url);
    client.send();
  });

  afterAll(function() {
    tileJson = null;
  });

  function getUTFGrid() {
    return new UTFGrid({
      url: url
    });
  }

  describe('constructor', () => {

    test('needs to be constructed with url option', () => {

      const source = new UTFGrid({url: url});
      expect(source).toBeInstanceOf(UTFGrid);
      expect(source).toBeInstanceOf(TileSource);

      expect(function() {
        // no options: will throw
        return new UTFGrid();
      }).toThrow();

      expect(function() {
        // no url-option: will throw
        return new UTFGrid({});
      }).toThrow();

      expect(getUTFGrid()).toBeInstanceOf(UTFGrid);
    });

  });

  describe('change event (ready)', () => {
    test('is fired when the source is ready', done => {
      const source = new UTFGrid({
        url: url
      });
      expect(source.getState()).toBe('loading');
      expect(source.tileGrid).toBe(null);

      source.on('change', function(event) {
        if (source.getState() === 'ready') {
          expect(source.tileGrid).toBeInstanceOf(TileGrid);
          done();
        }
      });
    });
  });

  describe('change event (error)', done => {
    test('is fired when the source fails to initialize', done => {
      const source = new UTFGrid({
        url: 'Bogus UTFGrid URL'
      });
      expect(source.getState()).toBe('loading');
      expect(source.tileGrid).toBe(null);

      source.on('change', function(event) {
        if (source.getState() === 'error') {
          expect(source.tileGrid).toBe(null);
          done();
        }
      });
    });
  });

  describe('#handleTileJSONResponse', () => {

    test('sets up a tileGrid', () => {
      const source = getUTFGrid();
      expect(source.getTileGrid()).toBe(null);
      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      const tileGrid = source.getTileGrid();
      expect(tileGrid).not.toBe(null);
      expect(tileGrid).toBeInstanceOf(TileGrid);
    });

    test('sets up a tilegrid with expected extent', () => {
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
        expectedExtent4326, proj4326, proj3857
      );
      expect(extent).toEqual(proj3857.getExtent());
      expect(extent[0]).to.roughlyEqual(expectedExtent3857[0], 1e-8);
      expect(extent[1]).to.roughlyEqual(expectedExtent3857[1], 1e-8);
      expect(extent[2]).to.roughlyEqual(expectedExtent3857[2], 1e-8);
      expect(extent[3]).to.roughlyEqual(expectedExtent3857[3], 1e-8);
    });

    test('sets up a tilegrid with expected minZoom', () => {
      const source = getUTFGrid();
      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      const tileGrid = source.getTileGrid();
      const minZoom = tileGrid.getMinZoom();
      expect(minZoom).toEqual(tileJson.minzoom);
    });

    test('sets up a tilegrid with expected maxZoom', () => {
      const source = getUTFGrid();
      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      const tileGrid = source.getTileGrid();
      const maxZoom = tileGrid.getMaxZoom();
      expect(maxZoom).toEqual(tileJson.maxzoom);
    });

    test('sets up a template', () => {
      const source = getUTFGrid();
      expect(source.getTemplate()).toBe(undefined);

      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      const template = source.getTemplate();
      expect(template).not.toBe(undefined);
      expect(template).toBe(tileJson.template);
    });

    test('sets up correct attribution', () => {
      const source = getUTFGrid();
      expect(source.getAttributions()).toBe(null);

      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      const attributions = source.getAttributions();
      expect(attributions).not.toBe(null);
      expect(typeof attributions).toBe('function');
    });

    test('sets correct state', () => {
      const source = getUTFGrid();
      expect(source.getState()).toBe('loading');

      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      expect(source.getState()).toBe('ready');
    });

  });

  describe('#forDataAtCoordinateAndResolution', () => {
    let source = null;
    const bonn3857 = fromLonLat([7.099814, 50.733992]);
    const noState3857 = [0, 0];
    const resolutionZoom1 = 78271.51696402048;

    let gridJson110 = null;
    // Called once for this describe section, this method will request a local
    // grid for one tile (1/1/0) and store the result in a variable. This allows
    // us to overwrite getTile in a way that removes the dependency on an
    // external service. See below in the `beforeEach`-method.
    beforeAll(function(done) {
      const client = new XMLHttpRequest();
      client.addEventListener('load', function() {
        gridJson110 = JSON.parse(this.responseText);
        done();
      });
      client.addEventListener('error', function() {
        done(new Error('Failed to fetch local grid.json'));
      });
      client.open('GET', 'spec/ol/data/mapbox-geography-class-1-1-0.grid.json');
      client.send();
    });
    afterAll(function() {
      gridJson110 = null;
    });

    beforeEach(() => {
      source = getUTFGrid();
      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      // Override getTile method to not depend on the external service. The
      // signature of the method is kept the same, but the returned tile will
      // always be for [1, 1, 0].
      source.getTile = function(z, x, y, pixelRatio, projection) {
        const tileCoord = [1, 1, 0]; // overwritten to match our stored JSON
        const urlTileCoord =
            testContext.getTileCoordForTileUrlFunction(tileCoord, projection);
        const tileUrl = testContext.tileUrlFunction_(urlTileCoord, pixelRatio, projection);
        const tile = new CustomTile(
          tileCoord,
          tileUrl !== undefined ? 0 : 4, // IDLE : EMPTY
          tileUrl !== undefined ? tileUrl : '',
          testContext.tileGrid.getTileCoordExtent(tileCoord),
          true); // always preemptive, so loading doesn't happen automatically
        // manually call handleLoad_ with our local JSON data
        tile.handleLoad_(gridJson110);
        return tile;
      };

    });
    afterEach(() => {
      source = null;
    });

    test('calls callback with data if found', done => {
      const callback = function(data) {
        expect(arguments).toHaveLength(1);
        expect(data).not.toBe(null);
        expect('admin' in data).toBe(true);
        expect(data.admin).toBe('Germany');
        done();
      };
      source.forDataAtCoordinateAndResolution(
        bonn3857, resolutionZoom1, callback, true
      );
    });

    test('calls callback with `null` if not found', done => {
      const callback = function(data) {
        expect(arguments).toHaveLength(1);
        expect(data).toBe(null);
        done();
      };
      source.forDataAtCoordinateAndResolution(
        noState3857, resolutionZoom1, callback, true
      );
    });

  });
});
