goog.provide('ol.test.source.Zoomify');

goog.require('ol.dom');
goog.require('ol.events');
goog.require('ol.proj.Projection');
goog.require('ol.source.Zoomify');
goog.require('ol.tilegrid.TileGrid');


describe('ol.source.Zoomify', function() {
  var w = 1024;
  var h = 512;
  var size = [w, h];
  var url = 'zoomify-url/';
  var proj = new ol.proj.Projection({
    code: 'ZOOMIFY',
    units: 'pixels',
    extent: [0, 0, w, h]
  });
  function getZoomifySource() {
    return new ol.source.Zoomify({
      url: url,
      size: size
    });
  }

  describe('constructor', function() {

    it('requires config "size"', function() {
      var source;

      // undefined config object
      expect(function() {
        source = new ol.source.Zoomify();
      }).to.throwException();

      // empty object as config object
      expect(function() {
        source = new ol.source.Zoomify({});
      }).to.throwException();

      // not passing "size" in config object
      expect(function() {
        source = new ol.source.Zoomify({
          url: 'some-url'
        });
      }).to.throwException();

      // passing "size" in config object
      expect(function() {
        source = new ol.source.Zoomify({
          size: [47, 11]
        });
      }).to.not.throwException();
      // we got a source
      expect(source).to.be.a(ol.source.Zoomify);

      // also test our helper method from above
      expect(function() {
        source = getZoomifySource();
      }).to.not.throwException();
      // we got a source
      expect(source).to.be.a(ol.source.Zoomify);
    });

    it('does not need "tierSizeCalculation" option', function() {
      expect(function() {
        new ol.source.Zoomify({
          size: [47, 11]
        });
      }).to.not.throwException();
    });

    it('accepts "tierSizeCalculation" option "default"', function() {
      expect(function() {
        new ol.source.Zoomify({
          size: [47, 11],
          tierSizeCalculation: 'default'
        });
      }).to.not.throwException();
    });

    it('accepts "tierSizeCalculation" option "truncated"', function() {
      expect(function() {
        new ol.source.Zoomify({
          size: [47, 11],
          tierSizeCalculation: 'truncated'
        });
      }).to.not.throwException();
    });

    it('throws on unexpected "tierSizeCalculation" ', function() {
      // passing unknown string will throw
      expect(function() {
        new ol.source.Zoomify({
          size: [47, 11],
          tierSizeCalculation: 'ace-of-spades'
        });
      }).to.throwException();
    });

    it('creates a tileGrid', function() {
      var source = getZoomifySource();
      var tileGrid = source.getTileGrid();
      expect(tileGrid).to.be.a(ol.tilegrid.TileGrid);
    });

  });

  describe('generated tileGrid', function() {

    it('has expected extent', function() {
      var source = getZoomifySource();
      var tileGrid = source.getTileGrid();
      var expectedExtent = [0, -h, w, 0];
      expect(tileGrid.getExtent()).to.eql(expectedExtent);
    });

    it('has expected origin', function() {
      var source = getZoomifySource();
      var tileGrid = source.getTileGrid();
      var expectedOrigin = [0, 0];
      expect(tileGrid.getOrigin()).to.eql(expectedOrigin);
    });

    it('has expected resolutions', function() {
      var source = getZoomifySource();
      var tileGrid = source.getTileGrid();
      var expectedResolutions = [4, 2, 1];
      expect(tileGrid.getResolutions()).to.eql(expectedResolutions);
    });

  });

  describe('tierSizeCalculation configuration', function() {

    it('influences resolutions', function() {
      // not configured at all
      var source = new ol.source.Zoomify({
        url: url,
        size: [513, 256]
      });
      var tileGrid = source.getTileGrid();

      // explicitly set as 'default'
      var sourceDefault = new ol.source.Zoomify({
        url: url,
        size: [513, 256],
        tierSizeCalculation: 'default'
      });
      var tileGridDefault = sourceDefault.getTileGrid();

      // explicitly set to 'truncated'
      var sourceTruncated = new ol.source.Zoomify({
        url: url,
        size: [513, 256],
        tierSizeCalculation: 'truncated'
      });
      var tileGridTruncated = sourceTruncated.getTileGrid();

      expect(tileGrid.getResolutions()).to.eql([4, 2, 1]);
      expect(tileGridDefault.getResolutions()).to.eql([4, 2, 1]);
      expect(tileGridTruncated.getResolutions()).to.eql([2, 1]);
    });

  });

  describe('generated tileUrlFunction', function() {

    it('creates an expected tileUrlFunction', function() {
      var source = getZoomifySource();
      var tileUrlFunction = source.getTileUrlFunction();
      // zoomlevel 0
      expect(tileUrlFunction([0, 0, -1])).to.eql('zoomify-url/TileGroup0/0-0-0.jpg');
      // zoomlevel 1
      expect(tileUrlFunction([1, 0, -1])).to.eql('zoomify-url/TileGroup0/1-0-0.jpg');
      expect(tileUrlFunction([1, 1, -1])).to.eql('zoomify-url/TileGroup0/1-1-0.jpg');
      expect(tileUrlFunction([1, 0, -2])).to.eql('zoomify-url/TileGroup0/1-0-1.jpg');
      expect(tileUrlFunction([1, 1, -2])).to.eql('zoomify-url/TileGroup0/1-1-1.jpg');
    });

    it('returns undefined if no tileCoord passed', function() {
      var source = getZoomifySource();
      var tileUrlFunction = source.getTileUrlFunction();
      expect(tileUrlFunction()).to.be(undefined);
    });

  });

  describe('uses a custom tileClass', function() {

    it('uses "ol.source.ZoomifyTile_" as tileClass', function() {
      var source = getZoomifySource();
      expect(source.tileClass).to.be(ol.source.ZoomifyTile_);
    });

    it('returns expected tileClass instances via "getTile"', function() {
      var source = getZoomifySource();
      var tile = source.getTile(0, 0, -1, 1, proj);
      expect(tile).to.be.an(ol.source.ZoomifyTile_);
    });

    it('"tile.getImage" returns and caches an unloaded image', function() {
      // It'll only cache if the same context is passed, see below
      var context = ol.dom.createCanvasContext2D(256, 256);
      var source = getZoomifySource();

      var tile = source.getTile(0, 0, -1, 1, proj);
      var img = tile.getImage(context);

      var tile2 = source.getTile(0, 0, -1, 1, proj);
      var img2 = tile2.getImage(context);

      expect(img).to.be.a(HTMLImageElement);
      expect(img).to.be(img2);
    });

    it('"tile.getImage" returns and caches a loaded canvas', function(done) {
      // It'll only cache if the same context is passed, see below
      var context = ol.dom.createCanvasContext2D(256, 256);
      var source = getZoomifySource();

      var tile = source.getTile(0, 0, -1, 1, proj);

      ol.events.listen(tile, 'change', function() {
        if (tile.getState() == 2) { // LOADED
          var img = tile.getImage(context);
          expect(img).to.be.a(HTMLCanvasElement);

          var tile2 = source.getTile(0, 0, -1, 1, proj);
          expect(tile2.getState()).to.be(2); // LOADED
          var img2 = tile2.getImage(context);
          expect(img).to.be(img2);
          done();
        }
      });
      tile.load();
    });

    it('"tile.getImage" returns and caches an image only for same context', function() {
      var source = getZoomifySource();

      var tile = source.getTile(0, 0, -1, 1, proj);
      var img = tile.getImage(ol.dom.createCanvasContext2D(256, 256));

      var tile2 = source.getTile(0, 0, -1, 1, proj);
      var img2 = tile2.getImage(ol.dom.createCanvasContext2D(256, 256));

      expect(img).to.be.a(HTMLImageElement);
      expect(img).to.not.be(img2);
    });

    it('passing the context to "tile.getImage" is optional', function() {
      var source = getZoomifySource();

      var tile = source.getTile(0, 0, -1, 1, proj);
      var img = tile.getImage();

      expect(img).to.be.a(HTMLImageElement);
    });

  });

});
