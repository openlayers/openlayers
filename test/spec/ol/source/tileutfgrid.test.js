goog.provide('ol.test.source.TileUTFGrid');

goog.require('ol.proj');
goog.require('ol.source.Tile');
goog.require('ol.source.TileUTFGrid');
goog.require('ol.tilegrid.TileGrid');


describe('ol.source.TileUTFGrid', function() {

  var url = 'spec/ol/data/tileutfgrid.json';
  var tileJson = null;

  // Load and parse the UTFGrid fixture
  before(function(done) {
    var client = new XMLHttpRequest();
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

  function getTileUTFGrid() {
    return new ol.source.TileUTFGrid({
      url: url
    });
  }

  describe('constructor', function() {

    it('needs to be constructed with url option', function() {

      var source = new ol.source.TileUTFGrid({url: url});
      expect(source).to.be.an(ol.source.TileUTFGrid);
      expect(source).to.be.an(ol.source.Tile);

      expect(function() {
        // no options: will throw
        return new ol.source.TileUTFGrid();
      }).to.throwException();

      expect(function() {
        // no url-option: will throw
        return new ol.source.TileUTFGrid({});
      }).to.throwException();

      expect(getTileUTFGrid()).to.be.an(ol.source.TileUTFGrid);
    });

  });

  describe('change event (ready)', function() {
    it('is fired when the source is ready', function(done) {
      var source = new ol.source.TileUTFGrid({
        url: url
      });
      expect(source.getState()).to.be('loading');
      expect(source.tileGrid).to.be(null);

      source.on('change', function(event) {
        if (source.getState() === 'ready') {
          expect(source.tileGrid).to.be.an(ol.tilegrid.TileGrid);
          done();
        }
      });
    });
  });

  describe('change event (error)', function(done) {
    it('is fired when the source fails to initialize', function(done) {
      var source = new ol.source.TileUTFGrid({
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
      var source = getTileUTFGrid();
      expect(source.getTileGrid()).to.be(null);
      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      var tileGrid = source.getTileGrid();
      expect(tileGrid).to.not.be(null);
      expect(tileGrid).to.be.an(ol.tilegrid.TileGrid);
    });

    it('sets up a tilegrid with expected extent', function() {
      var source = getTileUTFGrid();
      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      var tileGrid = source.getTileGrid();
      var extent = tileGrid.getExtent();

      var proj4326 = ol.proj.get('EPSG:4326');
      var proj3857 = ol.proj.get('EPSG:3857');
      var expectedExtent4326 = tileJson.bounds;
      var expectedExtent3857 = ol.proj.transformExtent(
        expectedExtent4326, proj4326, proj3857
      );
      expect(extent).to.eql(proj3857.getExtent());
      expect(extent[0]).to.roughlyEqual(expectedExtent3857[0], 1e-8);
      expect(extent[1]).to.roughlyEqual(expectedExtent3857[1], 1e-8);
      expect(extent[2]).to.roughlyEqual(expectedExtent3857[2], 1e-8);
      expect(extent[3]).to.roughlyEqual(expectedExtent3857[3], 1e-8);
    });

    it('sets up a tilegrid with expected minZoom', function() {
      var source = getTileUTFGrid();
      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      var tileGrid = source.getTileGrid();
      var minZoom = tileGrid.getMinZoom();
      expect(minZoom).to.eql(tileJson.minzoom);
    });

    it('sets up a tilegrid with expected maxZoom', function() {
      var source = getTileUTFGrid();
      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      var tileGrid = source.getTileGrid();
      var maxZoom = tileGrid.getMaxZoom();
      expect(maxZoom).to.eql(tileJson.maxzoom);
    });

    it('sets up a template', function() {
      var source = getTileUTFGrid();
      expect(source.getTemplate()).to.be(undefined);

      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      var template = source.getTemplate();
      expect(template).to.not.be(undefined);
      expect(template).to.be(tileJson.template);
    });

    it('sets up correct attribution', function() {
      var source = getTileUTFGrid();
      expect(source.getAttributions()).to.be(null);

      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      var attributions = source.getAttributions();
      expect(attributions).to.not.be(null);
      expect(attributions).to.have.length(1);
      expect(attributions[0].getHTML()).to.be(tileJson.attribution);
      var tileRanges = attributions[0].tileRanges_;
      for (var z = tileJson.minzoom; z <= tileJson.maxzoom; z++) {
        var key = z.toString();
        expect(key in tileRanges).to.be(true);
      }
    });

    it('sets correct state', function() {
      var source = getTileUTFGrid();
      expect(source.getState()).to.be('loading');

      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      expect(source.getState()).to.be('ready');
    });

  });

  describe('#forDataAtCoordinateAndResolution', function() {
    var source = null;
    var bonn3857 = ol.proj.fromLonLat([7.099814, 50.733992]);
    var noState3857 = [0, 0];
    var resolutionZoom1 = 78271.51696402048;

    var gridJson110 = null;
    // Called once for this describe section, this method will request a local
    // grid for one tile (1/1/0) and store the result in a variable. This allows
    // us to overwrite getTile in a way that removes the dependency on an
    // external service. See below in the `beforeEach`-method.
    before(function(done) {
      var client = new XMLHttpRequest();
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
      source = getTileUTFGrid();
      // call the handleTileJSONResponse method with our
      // locally available tileJson (from `before`)
      source.handleTileJSONResponse(tileJson);

      // Override getTile method to not depend on the external service. The
      // signature of the method is kept the same, but the returned tile will
      // always be for [1, 1 -1].
      source.getTile = function(z, x, y, pixelRatio, projection) {
        var tileCoord = [1, 1, -1]; // overwritten to match our stored JSON
        var urlTileCoord =
            this.getTileCoordForTileUrlFunction(tileCoord, projection);
        var tileUrl = this.tileUrlFunction_(urlTileCoord, pixelRatio, projection);
        var tile = new ol.source.TileUTFGridTile_(
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
      var callback = function(data) {
        expect(arguments).to.have.length(1);
        expect(data).to.not.be(null);
        expect('admin' in data).to.be(true);
        expect(data.admin).to.be('Germany');
        done();
      };
      source.forDataAtCoordinateAndResolution(
        bonn3857, resolutionZoom1, callback, null, true
      );
    });

    it('calls callback with correct `this` bound', function(done) {
      var scope = {foo: 'bar'};
      var callback = function(data) {
        expect(this).to.be(scope);
        done();
      };
      source.forDataAtCoordinateAndResolution(
        bonn3857, resolutionZoom1, callback, scope, true
      );
    });

    it('calls callback with `null` if not found', function(done) {
      var callback = function(data) {
        expect(arguments).to.have.length(1);
        expect(data).to.be(null);
        done();
      };
      source.forDataAtCoordinateAndResolution(
        noState3857, resolutionZoom1, callback, null, true
      );
    });

  });

});
