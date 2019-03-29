import {get as getProjection, transformExtent, fromLonLat} from '../../../../src/ol/proj.js';
import TileSource from '../../../../src/ol/source/Tile.js';
import UTFGrid, {CustomTile} from '../../../../src/ol/source/UTFGrid.js';
import TileGrid from '../../../../src/ol/tilegrid/TileGrid.js';


describe('ol.source.UTFGrid', function() {

  const url = 'spec/ol/data/utfgrid.json';
  let tileJson = null;

  // Load and parse the UTFGrid fixture
  before(function(done) {
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

  after(function() {
    tileJson = null;
  });

  function getUTFGrid() {
    return new UTFGrid({
      url: url
    });
  }

  describe('constructor', function() {

    it('needs to be constructed with url option', function() {

      const source = new UTFGrid({url: url});
      expect(source).to.be.an(UTFGrid);
      expect(source).to.be.an(TileSource);

      expect(function() {
        // no options: will throw
        return new UTFGrid();
      }).to.throwException();

      expect(function() {
        // no url-option: will throw
        return new UTFGrid({});
      }).to.throwException();

      expect(getUTFGrid()).to.be.an(UTFGrid);
    });

  });

  describe('change event (ready)', function() {
    it('is fired when the source is ready', function(done) {
      const source = new UTFGrid({
        url: url
      });
      expect(source.getState()).to.be('loading');
      expect(source.tileGrid).to.be(null);

      source.on('change', function(event) {
        if (source.getState() === 'ready') {
          expect(source.tileGrid).to.be.an(TileGrid);
          done();
        }
      });
    });
  });

  describe('change event (error)', function(done) {
    it('is fired when the source fails to initialize', function(done) {
      const source = new UTFGrid({
        url: 'Bogus UTFGrid URL'
      });
      expect(source.getState()).to.be('loading');
      expect(source.tileGrid).to.be(null);

      source.on('change', function(event) {
        if (source.getState() === 'error') {
          expect(source.tileGrid).to.be(null);
          done();
        }
      });
    });
  });

  describe('#handleTileJSONResponse', function() {

    it('sets up a tileGrid', function() {
      const source = getUTFGrid();
      expect(source.getTileGrid()).to.be(null);
      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      const tileGrid = source.getTileGrid();
      expect(tileGrid).to.not.be(null);
      expect(tileGrid).to.be.an(TileGrid);
    });

    it('sets up a tilegrid with expected extent', function() {
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
      expect(extent).to.eql(proj3857.getExtent());
      expect(extent[0]).to.roughlyEqual(expectedExtent3857[0], 1e-8);
      expect(extent[1]).to.roughlyEqual(expectedExtent3857[1], 1e-8);
      expect(extent[2]).to.roughlyEqual(expectedExtent3857[2], 1e-8);
      expect(extent[3]).to.roughlyEqual(expectedExtent3857[3], 1e-8);
    });

    it('sets up a tilegrid with expected minZoom', function() {
      const source = getUTFGrid();
      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      const tileGrid = source.getTileGrid();
      const minZoom = tileGrid.getMinZoom();
      expect(minZoom).to.eql(tileJson.minzoom);
    });

    it('sets up a tilegrid with expected maxZoom', function() {
      const source = getUTFGrid();
      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      const tileGrid = source.getTileGrid();
      const maxZoom = tileGrid.getMaxZoom();
      expect(maxZoom).to.eql(tileJson.maxzoom);
    });

    it('sets up a template', function() {
      const source = getUTFGrid();
      expect(source.getTemplate()).to.be(undefined);

      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      const template = source.getTemplate();
      expect(template).to.not.be(undefined);
      expect(template).to.be(tileJson.template);
    });

    it('sets up correct attribution', function() {
      const source = getUTFGrid();
      expect(source.getAttributions()).to.be(null);

      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      const attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(typeof attributions).to.be('function');
    });

    it('sets correct state', function() {
      const source = getUTFGrid();
      expect(source.getState()).to.be('loading');

      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      expect(source.getState()).to.be('ready');
    });

  });

  describe('#forDataAtCoordinateAndResolution', function() {
    let source = null;
    const bonn3857 = fromLonLat([7.099814, 50.733992]);
    const noState3857 = [0, 0];
    const resolutionZoom1 = 78271.51696402048;

    let gridJson110 = null;
    // Called once for this describe section, this method will request a local
    // grid for one tile (1/1/0) and store the result in a variable. This allows
    // us to overwrite getTile in a way that removes the dependency on an
    // external service. See below in the `beforeEach`-method.
    before(function(done) {
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
    after(function() {
      gridJson110 = null;
    });

    beforeEach(function() {
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
            this.getTileCoordForTileUrlFunction(tileCoord, projection);
        const tileUrl = this.tileUrlFunction_(urlTileCoord, pixelRatio, projection);
        const tile = new CustomTile(
          tileCoord,
          tileUrl !== undefined ? 0 : 4, // IDLE : EMPTY
          tileUrl !== undefined ? tileUrl : '',
          this.tileGrid.getTileCoordExtent(tileCoord),
          true); // always preemptive, so loading doesn't happen automatically
        // manually call handleLoad_ with our local JSON data
        tile.handleLoad_(gridJson110);
        return tile;
      };

    });
    afterEach(function() {
      source = null;
    });

    it('calls callback with data if found', function(done) {
      const callback = function(data) {
        expect(arguments).to.have.length(1);
        expect(data).to.not.be(null);
        expect('admin' in data).to.be(true);
        expect(data.admin).to.be('Germany');
        done();
      };
      source.forDataAtCoordinateAndResolution(
        bonn3857, resolutionZoom1, callback, true
      );
    });

    it('calls callback with `null` if not found', function(done) {
      const callback = function(data) {
        expect(arguments).to.have.length(1);
        expect(data).to.be(null);
        done();
      };
      source.forDataAtCoordinateAndResolution(
        noState3857, resolutionZoom1, callback, true
      );
    });

  });

});
