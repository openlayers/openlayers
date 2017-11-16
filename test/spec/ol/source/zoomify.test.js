

goog.require('ol');
goog.require('ol.events');
goog.require('ol.proj.Projection');
goog.require('ol.source.Zoomify');
goog.require('ol.tilegrid.TileGrid');


describe('ol.source.Zoomify', function() {
  var w = 1024;
  var h = 512;
  var size = [w, h];
  var zoomifyUrl = 'spec/ol/source/images/zoomify/{TileGroup}/{z}-{x}-{y}.jpg';
  var iipUrl = 'spec/ol/source/images/zoomify?JTL={z},{tileIndex}';
  var proj = new ol.proj.Projection({
    code: 'ZOOMIFY',
    units: 'pixels',
    extent: [0, 0, w, h]
  });
  function getZoomifySource() {
    return new ol.source.Zoomify({
      url: zoomifyUrl,
      size: size
    });
  }
  function getZoomifySourceWithExtentInFirstQuadrant() {
    return new ol.source.Zoomify({
      url: zoomifyUrl,
      size: size,
      extent: [0, 0, size[0], size[1]]
    });
  }
  function getIIPSource() {
    return new ol.source.Zoomify({
      url: iipUrl,
      size: size
    });
  }
  function getZoomifySourceWith1024pxTiles() {
    return new ol.source.Zoomify({
      url: zoomifyUrl,
      size: size,
      tileSize: 1024
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

      // also test our helper methods from above
      expect(function() {
        source = getZoomifySource();
      }).to.not.throwException();
      expect(function() {
        source = getIIPSource();
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

    it('creates a tileGrid for both protocols', function() {
      var sources = [getZoomifySource(), getIIPSource()];
      for (var i = 0; i < sources.length; i++) {
        var tileGrid = sources[i].getTileGrid();
        expect(tileGrid).to.be.a(ol.tilegrid.TileGrid);
      }
    });

  });

  describe('generated tileGrid', function() {

    it('has expected extent', function() {
      var sources = [getZoomifySource(), getIIPSource()];
      for (var i = 0; i < sources.length; i++) {
        var tileGrid = sources[i].getTileGrid();
        var expectedExtent = [0, -h, w, 0];
        expect(tileGrid.getExtent()).to.eql(expectedExtent);
      }
    });

    it('has expected origin', function() {
      var sources = [getZoomifySource(), getIIPSource()];
      for (var i = 0; i < sources.length; i++) {
        var tileGrid = sources[i].getTileGrid();
        var expectedOrigin = [0, 0];
        expect(tileGrid.getOrigin()).to.eql(expectedOrigin);
      }
    });

    it('has expected resolutions', function() {
      var sources = [getZoomifySource(), getIIPSource()];
      for (var i = 0; i < sources.length; i++) {
        var tileGrid = sources[i].getTileGrid();
        var expectedResolutions = [4, 2, 1];
        expect(tileGrid.getResolutions()).to.eql(expectedResolutions);
      }
    });

    it('has expected tileSize', function() {
      var sources = [getZoomifySource(), getZoomifySourceWith1024pxTiles()];
      var expectedTileSizes = [ol.DEFAULT_TILE_SIZE, 1024];
      for (var i = 0; i < sources.length; i++) {
        var tileGrid = sources[i].getTileGrid();
        expect(tileGrid.getTileSize()).to.eql(expectedTileSizes[i]);
      }
    });

    it('has expected extent', function() {
      var sources = [getZoomifySource(), getZoomifySourceWithExtentInFirstQuadrant()];
      var expectedExtents = [
        [0, -size[1], size[0], 0],
        [0, 0, size[0], size[1]]
      ];
      for (var i = 0; i < sources.length; i++) {
        var tileGrid = sources[i].getTileGrid();
        expect(tileGrid.getExtent()).to.eql(expectedExtents[i]);
      }
    });

    it('has expected origin', function() {
      var sources = [getZoomifySource(), getZoomifySourceWithExtentInFirstQuadrant()];
      var expectedOrigins = [
        [0, 0],
        [0, size[1]]
      ];
      for (var i = 0; i < sources.length; i++) {
        var tileGrid = sources[i].getTileGrid();
        expect(tileGrid.getOrigin()).to.eql(expectedOrigins[i]);
      }
    });

  });

  describe('tierSizeCalculation configuration', function() {

    it('influences resolutions', function() {
      // not configured at all
      var source = new ol.source.Zoomify({
        url: zoomifyUrl,
        size: [513, 256]
      });
      var tileGrid = source.getTileGrid();

      // explicitly set as 'default'
      var sourceDefault = new ol.source.Zoomify({
        url: zoomifyUrl,
        size: [513, 256],
        tierSizeCalculation: 'default'
      });
      var tileGridDefault = sourceDefault.getTileGrid();

      // explicitly set to 'truncated'
      var sourceTruncated = new ol.source.Zoomify({
        url: zoomifyUrl,
        size: [513, 256],
        tierSizeCalculation: 'truncated'
      });
      var tileGridTruncated = sourceTruncated.getTileGrid();

      expect(tileGrid.getResolutions()).to.eql([4, 2, 1]);
      expect(tileGridDefault.getResolutions()).to.eql([4, 2, 1]);
      expect(tileGridTruncated.getResolutions()).to.eql([2, 1]);
    });

  });

  describe('generated tileUrlFunction for zoomify protocol', function() {

    it('creates an expected tileUrlFunction with zoomify template', function() {
      var source = getZoomifySource();
      var tileUrlFunction = source.getTileUrlFunction();
      // zoomlevel 0
      expect(tileUrlFunction([0, 0, -1])).to.eql('spec/ol/source/images/zoomify/TileGroup0/0-0-0.jpg');
      // zoomlevel 1
      expect(tileUrlFunction([1, 0, -1])).to.eql('spec/ol/source/images/zoomify/TileGroup0/1-0-0.jpg');
      expect(tileUrlFunction([1, 1, -1])).to.eql('spec/ol/source/images/zoomify/TileGroup0/1-1-0.jpg');
      expect(tileUrlFunction([1, 0, -2])).to.eql('spec/ol/source/images/zoomify/TileGroup0/1-0-1.jpg');
      expect(tileUrlFunction([1, 1, -2])).to.eql('spec/ol/source/images/zoomify/TileGroup0/1-1-1.jpg');
    });
    it('creates an expected tileUrlFunction with IIP template', function() {
      var source = getIIPSource();
      var tileUrlFunction = source.getTileUrlFunction();
      // zoomlevel 0
      expect(tileUrlFunction([0, 0, -1])).to.eql('spec/ol/source/images/zoomify?JTL=0,0');
      // zoomlevel 1
      expect(tileUrlFunction([1, 0, -1])).to.eql('spec/ol/source/images/zoomify?JTL=1,0');
      expect(tileUrlFunction([1, 1, -1])).to.eql('spec/ol/source/images/zoomify?JTL=1,1');
      expect(tileUrlFunction([1, 0, -2])).to.eql('spec/ol/source/images/zoomify?JTL=1,2');
      expect(tileUrlFunction([1, 1, -2])).to.eql('spec/ol/source/images/zoomify?JTL=1,3');
    });

    it('creates an expected tileUrlFunction without template', function() {
      var source = new ol.source.Zoomify({
        url: 'spec/ol/source/images/zoomify/',
        size: size
      });
      var tileUrlFunction = source.getTileUrlFunction();
      // zoomlevel 0
      expect(tileUrlFunction([0, 0, -1])).to.eql('spec/ol/source/images/zoomify/TileGroup0/0-0-0.jpg');
      // zoomlevel 1
      expect(tileUrlFunction([1, 0, -1])).to.eql('spec/ol/source/images/zoomify/TileGroup0/1-0-0.jpg');
      expect(tileUrlFunction([1, 1, -1])).to.eql('spec/ol/source/images/zoomify/TileGroup0/1-1-0.jpg');
      expect(tileUrlFunction([1, 0, -2])).to.eql('spec/ol/source/images/zoomify/TileGroup0/1-0-1.jpg');
      expect(tileUrlFunction([1, 1, -2])).to.eql('spec/ol/source/images/zoomify/TileGroup0/1-1-1.jpg');
    });
    it('returns undefined if no tileCoord passed', function() {
      var source = getZoomifySource();
      var tileUrlFunction = source.getTileUrlFunction();
      expect(tileUrlFunction()).to.be(undefined);
    });

  });

  describe('uses a custom tileClass', function() {

    it('returns expected tileClass instances via "getTile"', function() {
      var source = getZoomifySource();
      var tile = source.getTile(0, 0, -1, 1, proj);
      expect(tile).to.be.an(ol.source.Zoomify.Tile_);
    });

    it('"tile.getImage" returns and caches an unloaded image', function() {
      var source = getZoomifySource();

      var tile = source.getTile(0, 0, -1, 1, proj);
      var img = tile.getImage();

      var tile2 = source.getTile(0, 0, -1, 1, proj);
      var img2 = tile2.getImage();

      expect(img).to.be.a(HTMLImageElement);
      expect(img).to.be(img2);
    });

    it('"tile.getImage" returns and caches a loaded canvas', function(done) {
      var source = getZoomifySource();

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
