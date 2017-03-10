goog.provide('ol.test.source.IIP');

goog.require('ol.dom');
goog.require('ol.events');
goog.require('ol.proj.Projection');
goog.require('ol.source.IIP');
goog.require('ol.tilegrid.TileGrid');


describe('ol.source.IIP', function() {
  var w = 1024;
  var h = 512;
  var size = [w, h];
  var url = 'iip-url/';
  var proj = new ol.proj.Projection({
    code: 'IIP',
    units: 'pixels',
    extent: [0, 0, w, h]
  });
  function getIIPSource() {
    return new ol.source.IIP({
      url: url,
      size: size,
      nbResolutions: 4,
      tileSize: 128
    });
  }

  describe('constructor', function() {

    it('requires config "size"', function() {
      var source;

      // undefined config object
      expect(function() {
        source = new ol.source.IIP();
      }).to.throwException();

      // empty object as config object
      expect(function() {
        source = new ol.source.IIP({});
      }).to.throwException();

      // not passing "size" in config object
      expect(function() {
        source = new ol.source.IIP({
          url: 'some-url'
        });
      }).to.throwException();

      // passing "size" in config object
      expect(function() {
        source = new ol.source.IIP({
          size: [47, 11]
        });
      }).to.not.throwException();
      // we got a source
      expect(source).to.be.a(ol.source.IIP);

      // also test our helper method from above
      expect(function() {
        source = getIIPSource();
      }).to.not.throwException();
      // we got a source
      expect(source).to.be.a(ol.source.IIP);
    });

    it('creates a tileGrid', function() {
      var source = getIIPSource();
      var tileGrid = source.getTileGrid();
      expect(tileGrid).to.be.a(ol.tilegrid.TileGrid);
    });

  });

  describe('generated tileGrid', function() {

    it('has expected extent', function() {
      var source = getIIPSource();
      var tileGrid = source.getTileGrid();
      var expectedExtent = [0, -h, w, 0];
      expect(tileGrid.getExtent()).to.eql(expectedExtent);
    });

    it('has expected origin', function() {
      var source = getIIPSource();
      var tileGrid = source.getTileGrid();
      var expectedOrigin = [0, 0];
      expect(tileGrid.getOrigin()).to.eql(expectedOrigin);
    });

    it('has expected resolutions', function() {
      var source = getIIPSource();
      var tileGrid = source.getTileGrid();
      var expectedResolutions = [8, 4, 2, 1];
      expect(tileGrid.getResolutions()).to.eql(expectedResolutions);
    });

  });

  describe('generated tileUrlFunction', function() {

    it('creates an expected tileUrlFunction', function() {
      var source = getIIPSource();
      var tileUrlFunction = source.getTileUrlFunction();
      // zoomlevel 0
      expect(tileUrlFunction([0, 0, -1])).to.eql('iip-url/&WID=128&JTL=0,0');
      // zoomlevel 1
      expect(tileUrlFunction([1, 0, -1])).to.eql('iip-url/&WID=128&JTL=1,0');
      expect(tileUrlFunction([1, 1, -1])).to.eql('iip-url/&WID=128&JTL=1,1');
      expect(tileUrlFunction([1, 0, -2])).to.eql('iip-url/&WID=128&JTL=1,2');
      expect(tileUrlFunction([1, 1, -2])).to.eql('iip-url/&WID=128&JTL=1,3');
    });

    it('returns undefined if no tileCoord passed', function() {
      var source = getIIPSource();
      var tileUrlFunction = source.getTileUrlFunction();
      expect(tileUrlFunction()).to.be(undefined);
    });

  });

  describe('uses a custom tileClass', function() {

    it('uses "ol.source.IIP.Tile_" as tileClass', function() {
      var source = getIIPSource();
      expect(source.tileClass).to.be(ol.source.IIP.Tile_);
    });

    it('returns expected tileClass instances via "getTile"', function() {
      var source = getIIPSource();
      var tile = source.getTile(0, 0, -1, 1, proj);
      expect(tile).to.be.an(ol.source.IIP.Tile_);
    });

    it('"tile.getImage" returns and caches an unloaded image', function() {
      // It'll only cache if the same context is passed, see below
      var context = ol.dom.createCanvasContext2D(256, 256);
      var source = getIIPSource();

      var tile = source.getTile(0, 0, -1, 1, proj);
      var img = tile.getImage(context);

      var tile2 = source.getTile(0, 0, -1, 1, proj);
      var img2 = tile2.getImage(context);

      expect(img).to.be.a(HTMLImageElement);
      expect(img).to.be(img2);
    });

    it('"tile.getImage" returns and caches a loaded canvas', function(done) {
      var source = getIIPSource();

      var tile = source.getTile(0, 0, -1, 1, proj);

      ol.events.listen(tile, 'change', function() {
        if (tile.getState() == 2) { // LOADED
          var img = tile.getImage();
          expect(img).to.be.a(HTMLCanvasElement);

          var tile2 = source.getTile(0, 0, -1, 1, proj);
          expect(tile2.getState()).to.be(2); // LOADED
          var img2 = tile2.getImage();
          expect(img).to.be(img2);
          done();
        }
      });
      tile.load();
    });

  });

});
