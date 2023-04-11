import Projection from '../../../../../src/ol/proj/Projection.js';
import TileGrid from '../../../../../src/ol/tilegrid/TileGrid.js';
import Zoomify, {CustomTile} from '../../../../../src/ol/source/Zoomify.js';
import {DEFAULT_TILE_SIZE} from '../../../../../src/ol/tilegrid/common.js';
import {listen} from '../../../../../src/ol/events.js';

describe('ol/source/Zoomify', function () {
  const w = 1024;
  const h = 512;
  const size = [w, h];
  const zoomifyUrl =
    'spec/ol/source/images/zoomify/{TileGroup}/{z}-{x}-{y}.jpg';
  const iipUrl = 'spec/ol/source/images/zoomify?JTL={z},{tileIndex}';
  const proj = new Projection({
    code: 'ZOOMIFY',
    units: 'pixels',
    extent: [0, 0, w, h],
  });
  function getZoomifySource() {
    return new Zoomify({
      url: zoomifyUrl,
      size: size,
    });
  }
  function getZoomifySourceWithExtentInFirstQuadrant() {
    return new Zoomify({
      url: zoomifyUrl,
      size: size,
      extent: [0, 0, size[0], size[1]],
    });
  }
  function getIIPSource() {
    return new Zoomify({
      url: iipUrl,
      size: size,
    });
  }
  function getZoomifySourceWith1024pxTiles() {
    return new Zoomify({
      url: zoomifyUrl,
      size: size,
      tileSize: 1024,
    });
  }

  describe('constructor', function () {
    it('requires config "size" and "url"', function () {
      let source;

      // undefined config object
      expect(function () {
        source = new Zoomify();
      }).to.throwException();

      // empty object as config object
      expect(function () {
        source = new Zoomify({});
      }).to.throwException();

      // passing "url" in config object
      expect(function () {
        source = new Zoomify({
          url: 'some-url',
        });
      }).to.throwException();

      // passing "size" in config object
      expect(function () {
        source = new Zoomify({
          size: [47, 11],
        });
      }).to.throwException();

      // passing "size" and "url" in config object
      expect(function () {
        source = new Zoomify({
          url: '',
          size: [47, 11],
        });
      }).to.not.throwException();
      // we got a source
      expect(source).to.be.a(Zoomify);

      // also test our helper methods from above
      expect(function () {
        source = getZoomifySource();
      }).to.not.throwException();
      expect(function () {
        source = getIIPSource();
      }).to.not.throwException();
      // we got a source
      expect(source).to.be.a(Zoomify);
    });

    it('does not need "tierSizeCalculation" option', function () {
      expect(function () {
        new Zoomify({
          url: '',
          size: [47, 11],
        });
      }).to.not.throwException();
    });

    it('accepts "tierSizeCalculation" option "default"', function () {
      expect(function () {
        new Zoomify({
          url: '',
          size: [47, 11],
          tierSizeCalculation: 'default',
        });
      }).to.not.throwException();
    });

    it('accepts "tierSizeCalculation" option "truncated"', function () {
      expect(function () {
        new Zoomify({
          url: '',
          size: [47, 11],
          tierSizeCalculation: 'truncated',
        });
      }).to.not.throwException();
    });

    it('throws on unexpected "tierSizeCalculation" ', function () {
      // passing unknown string will throw
      expect(function () {
        new Zoomify({
          url: '',
          size: [47, 11],
          tierSizeCalculation: 'ace-of-spades',
        });
      }).to.throwException();
    });

    it('creates a tileGrid for both protocols', function () {
      const sources = [getZoomifySource(), getIIPSource()];
      for (let i = 0; i < sources.length; i++) {
        const tileGrid = sources[i].getTileGrid();
        expect(tileGrid).to.be.a(TileGrid);
      }
    });
  });

  describe('#getInterpolate()', function () {
    it('is true by default', function () {
      const source = new Zoomify({url: '', size: [47, 11]});
      expect(source.getInterpolate()).to.be(true);
    });

    it('is false if constructed with interpolate: false', function () {
      const source = new Zoomify({interpolate: false, url: '', size: [47, 11]});
      expect(source.getInterpolate()).to.be(false);
    });
  });

  describe('generated tileGrid', function () {
    it('has expected extent', function () {
      const sources = [getZoomifySource(), getIIPSource()];
      for (let i = 0; i < sources.length; i++) {
        const tileGrid = sources[i].getTileGrid();
        const expectedExtent = [0, -h, w, 0];
        expect(tileGrid.getExtent()).to.eql(expectedExtent);
      }
    });

    it('has expected origin', function () {
      const sources = [getZoomifySource(), getIIPSource()];
      for (let i = 0; i < sources.length; i++) {
        const tileGrid = sources[i].getTileGrid();
        const expectedOrigin = [0, 0];
        expect(tileGrid.getOrigin()).to.eql(expectedOrigin);
      }
    });

    it('has expected resolutions', function () {
      const sources = [getZoomifySource(), getIIPSource()];
      for (let i = 0; i < sources.length; i++) {
        const tileGrid = sources[i].getTileGrid();
        const expectedResolutions = [4, 2, 1];
        expect(tileGrid.getResolutions()).to.eql(expectedResolutions);
      }
    });

    it('has expected tileSize', function () {
      const sources = [getZoomifySource(), getZoomifySourceWith1024pxTiles()];
      const expectedTileSizes = [DEFAULT_TILE_SIZE, 1024];
      for (let i = 0; i < sources.length; i++) {
        const tileGrid = sources[i].getTileGrid();
        expect(tileGrid.getTileSize()).to.eql(expectedTileSizes[i]);
      }
    });

    it('has expected extent', function () {
      const sources = [
        getZoomifySource(),
        getZoomifySourceWithExtentInFirstQuadrant(),
      ];
      const expectedExtents = [
        [0, -size[1], size[0], 0],
        [0, 0, size[0], size[1]],
      ];
      for (let i = 0; i < sources.length; i++) {
        const tileGrid = sources[i].getTileGrid();
        expect(tileGrid.getExtent()).to.eql(expectedExtents[i]);
      }
    });

    it('has expected origin', function () {
      const sources = [
        getZoomifySource(),
        getZoomifySourceWithExtentInFirstQuadrant(),
      ];
      const expectedOrigins = [
        [0, 0],
        [0, size[1]],
      ];
      for (let i = 0; i < sources.length; i++) {
        const tileGrid = sources[i].getTileGrid();
        expect(tileGrid.getOrigin()).to.eql(expectedOrigins[i]);
      }
    });
  });

  describe('tierSizeCalculation configuration', function () {
    it('influences resolutions', function () {
      // not configured at all
      const source = new Zoomify({
        url: zoomifyUrl,
        size: [513, 256],
      });
      const tileGrid = source.getTileGrid();

      // explicitly set as 'default'
      const sourceDefault = new Zoomify({
        url: zoomifyUrl,
        size: [513, 256],
        tierSizeCalculation: 'default',
      });
      const tileGridDefault = sourceDefault.getTileGrid();

      // explicitly set to 'truncated'
      const sourceTruncated = new Zoomify({
        url: zoomifyUrl,
        size: [513, 256],
        tierSizeCalculation: 'truncated',
      });
      const tileGridTruncated = sourceTruncated.getTileGrid();

      expect(tileGrid.getResolutions()).to.eql([4, 2, 1]);
      expect(tileGridDefault.getResolutions()).to.eql([4, 2, 1]);
      expect(tileGridTruncated.getResolutions()).to.eql([2, 1]);
    });
  });

  describe('generated tileUrlFunction for zoomify protocol', function () {
    it('creates an expected tileUrlFunction with zoomify template', function () {
      const source = getZoomifySource();
      const tileUrlFunction = source.getTileUrlFunction();
      // zoomlevel 0
      expect(tileUrlFunction([0, 0, 0])).to.eql(
        'spec/ol/source/images/zoomify/TileGroup0/0-0-0.jpg'
      );
      // zoomlevel 1
      expect(tileUrlFunction([1, 0, 0])).to.eql(
        'spec/ol/source/images/zoomify/TileGroup0/1-0-0.jpg'
      );
      expect(tileUrlFunction([1, 1, 0])).to.eql(
        'spec/ol/source/images/zoomify/TileGroup0/1-1-0.jpg'
      );
      expect(tileUrlFunction([1, 0, 1])).to.eql(
        'spec/ol/source/images/zoomify/TileGroup0/1-0-1.jpg'
      );
      expect(tileUrlFunction([1, 1, 1])).to.eql(
        'spec/ol/source/images/zoomify/TileGroup0/1-1-1.jpg'
      );
    });
    it('creates an expected tileUrlFunction with IIP template', function () {
      const source = getIIPSource();
      const tileUrlFunction = source.getTileUrlFunction();
      // zoomlevel 0
      expect(tileUrlFunction([0, 0, 0])).to.eql(
        'spec/ol/source/images/zoomify?JTL=0,0'
      );
      // zoomlevel 1
      expect(tileUrlFunction([1, 0, 0])).to.eql(
        'spec/ol/source/images/zoomify?JTL=1,0'
      );
      expect(tileUrlFunction([1, 1, 0])).to.eql(
        'spec/ol/source/images/zoomify?JTL=1,1'
      );
      expect(tileUrlFunction([1, 0, 1])).to.eql(
        'spec/ol/source/images/zoomify?JTL=1,2'
      );
      expect(tileUrlFunction([1, 1, 1])).to.eql(
        'spec/ol/source/images/zoomify?JTL=1,3'
      );
    });

    it('creates an expected tileUrlFunction without template', function () {
      const source = new Zoomify({
        url: 'spec/ol/source/images/zoomify/',
        size: size,
      });
      const tileUrlFunction = source.getTileUrlFunction();
      // zoomlevel 0
      expect(tileUrlFunction([0, 0, 0])).to.eql(
        'spec/ol/source/images/zoomify/TileGroup0/0-0-0.jpg'
      );
      // zoomlevel 1
      expect(tileUrlFunction([1, 0, 0])).to.eql(
        'spec/ol/source/images/zoomify/TileGroup0/1-0-0.jpg'
      );
      expect(tileUrlFunction([1, 1, 0])).to.eql(
        'spec/ol/source/images/zoomify/TileGroup0/1-1-0.jpg'
      );
      expect(tileUrlFunction([1, 0, 1])).to.eql(
        'spec/ol/source/images/zoomify/TileGroup0/1-0-1.jpg'
      );
      expect(tileUrlFunction([1, 1, 1])).to.eql(
        'spec/ol/source/images/zoomify/TileGroup0/1-1-1.jpg'
      );
    });
    it('returns undefined if no tileCoord passed', function () {
      const source = getZoomifySource();
      const tileUrlFunction = source.getTileUrlFunction();
      expect(tileUrlFunction()).to.be(undefined);
    });
  });

  describe('uses a custom tileClass', function () {
    it('returns expected tileClass instances via "getTile"', function () {
      const source = getZoomifySource();
      const tile = source.getTile(0, 0, 0, 1, proj);
      expect(tile).to.be.a(CustomTile);
    });

    it('"tile.getImage" returns and caches an unloaded image', function () {
      const source = getZoomifySource();

      const tile = source.getTile(0, 0, 0, 1, proj);
      const img = tile.getImage();

      const tile2 = source.getTile(0, 0, 0, 1, proj);
      const img2 = tile2.getImage();

      expect(img).to.be.a(HTMLImageElement);
      expect(img).to.be(img2);
    });

    it('"tile.getImage" returns and caches a loaded canvas', function (done) {
      const source = getZoomifySource();

      const tile = source.getTile(0, 0, 0, 1, proj);

      listen(tile, 'change', function () {
        if (tile.getState() == 2) {
          // LOADED
          const img = tile.getImage();
          expect(img).to.be.a(HTMLCanvasElement);

          const tile2 = source.getTile(0, 0, 0, 1, proj);
          expect(tile2.getState()).to.be(2); // LOADED
          const img2 = tile2.getImage();
          expect(img).to.be(img2);
          done();
        }
      });
      tile.load();
    });
  });
});
