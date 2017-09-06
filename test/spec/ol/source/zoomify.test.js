

import _ol_dom_ from '../../../../src/ol/dom';
import _ol_events_ from '../../../../src/ol/events';
import _ol_proj_Projection_ from '../../../../src/ol/proj/projection';
import _ol_source_Zoomify_ from '../../../../src/ol/source/zoomify';
import _ol_tilegrid_TileGrid_ from '../../../../src/ol/tilegrid/tilegrid';


describe('ol.source.Zoomify', function() {
  var w = 1024;
  var h = 512;
  var size = [w, h];
  var url = 'spec/ol/source/images/zoomify/{TileGroup}/{z}-{x}-{y}.jpg';
  var proj = new _ol_proj_Projection_({
    code: 'ZOOMIFY',
    units: 'pixels',
    extent: [0, 0, w, h]
  });
  function getZoomifySource() {
    return new _ol_source_Zoomify_({
      url: url,
      size: size
    });
  }

  describe('constructor', function() {

    it('requires config "size"', function() {
      var source;

      // undefined config object
      expect(function() {
        source = new _ol_source_Zoomify_();
      }).to.throwException();

      // empty object as config object
      expect(function() {
        source = new _ol_source_Zoomify_({});
      }).to.throwException();

      // not passing "size" in config object
      expect(function() {
        source = new _ol_source_Zoomify_({
          url: 'some-url'
        });
      }).to.throwException();

      // passing "size" in config object
      expect(function() {
        source = new _ol_source_Zoomify_({
          size: [47, 11]
        });
      }).to.not.throwException();
      // we got a source
      expect(source).to.be.a(_ol_source_Zoomify_);

      // also test our helper method from above
      expect(function() {
        source = getZoomifySource();
      }).to.not.throwException();
      // we got a source
      expect(source).to.be.a(_ol_source_Zoomify_);
    });

    it('does not need "tierSizeCalculation" option', function() {
      expect(function() {
        new _ol_source_Zoomify_({
          size: [47, 11]
        });
      }).to.not.throwException();
    });

    it('accepts "tierSizeCalculation" option "default"', function() {
      expect(function() {
        new _ol_source_Zoomify_({
          size: [47, 11],
          tierSizeCalculation: 'default'
        });
      }).to.not.throwException();
    });

    it('accepts "tierSizeCalculation" option "truncated"', function() {
      expect(function() {
        new _ol_source_Zoomify_({
          size: [47, 11],
          tierSizeCalculation: 'truncated'
        });
      }).to.not.throwException();
    });

    it('throws on unexpected "tierSizeCalculation" ', function() {
      // passing unknown string will throw
      expect(function() {
        new _ol_source_Zoomify_({
          size: [47, 11],
          tierSizeCalculation: 'ace-of-spades'
        });
      }).to.throwException();
    });

    it('creates a tileGrid', function() {
      var source = getZoomifySource();
      var tileGrid = source.getTileGrid();
      expect(tileGrid).to.be.a(_ol_tilegrid_TileGrid_);
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
      var source = new _ol_source_Zoomify_({
        url: url,
        size: [513, 256]
      });
      var tileGrid = source.getTileGrid();

      // explicitly set as 'default'
      var sourceDefault = new _ol_source_Zoomify_({
        url: url,
        size: [513, 256],
        tierSizeCalculation: 'default'
      });
      var tileGridDefault = sourceDefault.getTileGrid();

      // explicitly set to 'truncated'
      var sourceTruncated = new _ol_source_Zoomify_({
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

    it('creates an expected tileUrlFunction with template', function() {
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

    it('creates an expected tileUrlFunction without template', function() {
      var source = new _ol_source_Zoomify_({
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

    it('uses "ol.source.Zoomify.Tile_" as tileClass', function() {
      var source = getZoomifySource();
      expect(source.tileClass).to.be(_ol_source_Zoomify_.Tile_);
    });

    it('returns expected tileClass instances via "getTile"', function() {
      var source = getZoomifySource();
      var tile = source.getTile(0, 0, -1, 1, proj);
      expect(tile).to.be.an(_ol_source_Zoomify_.Tile_);
    });

    it('"tile.getImage" returns and caches an unloaded image', function() {
      // It'll only cache if the same context is passed, see below
      var context = _ol_dom_.createCanvasContext2D(256, 256);
      var source = getZoomifySource();

      var tile = source.getTile(0, 0, -1, 1, proj);
      var img = tile.getImage(context);

      var tile2 = source.getTile(0, 0, -1, 1, proj);
      var img2 = tile2.getImage(context);

      expect(img).to.be.a(HTMLImageElement);
      expect(img).to.be(img2);
    });

    it('"tile.getImage" returns and caches a loaded canvas', function(done) {
      var source = getZoomifySource();

      var tile = source.getTile(0, 0, -1, 1, proj);

      _ol_events_.listen(tile, 'change', function() {
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
