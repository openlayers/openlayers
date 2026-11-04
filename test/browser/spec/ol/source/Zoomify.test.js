import {assert} from 'chai';
import Projection from '../../../../../src/ol/proj/Projection.js';
import Zoomify, {CustomTile} from '../../../../../src/ol/source/Zoomify.js';
import TileGrid from '../../../../../src/ol/tilegrid/TileGrid.js';
import {DEFAULT_TILE_SIZE} from '../../../../../src/ol/tilegrid/common.js';

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

      assert.throws(function () {
        source = new Zoomify();
      });

      assert.throws(function () {
        source = new Zoomify({});
      });

      assert.throws(function () {
        source = new Zoomify({
          url: 'some-url',
        });
      });

      assert.throws(function () {
        source = new Zoomify({
          size: [47, 11],
        });
      });

      assert.doesNotThrow(function () {
        source = new Zoomify({
          url: '',
          size: [47, 11],
        });
      });
      assert.instanceOf(source, Zoomify);

      assert.doesNotThrow(function () {
        source = getZoomifySource();
      });
      assert.doesNotThrow(function () {
        source = getIIPSource();
      });
      assert.instanceOf(source, Zoomify);
    });

    it('does not need "tierSizeCalculation" option', function () {
      assert.doesNotThrow(function () {
        new Zoomify({
          url: '',
          size: [47, 11],
        });
      });
    });

    it('accepts "tierSizeCalculation" option "default"', function () {
      assert.doesNotThrow(function () {
        new Zoomify({
          url: '',
          size: [47, 11],
          tierSizeCalculation: 'default',
        });
      });
    });

    it('accepts "tierSizeCalculation" option "truncated"', function () {
      assert.doesNotThrow(function () {
        new Zoomify({
          url: '',
          size: [47, 11],
          tierSizeCalculation: 'truncated',
        });
      });
    });

    it('throws on unexpected "tierSizeCalculation" ', function () {
      assert.throws(function () {
        new Zoomify({
          url: '',
          size: [47, 11],
          tierSizeCalculation: 'ace-of-spades',
        });
      });
    });

    it('creates a tileGrid for both protocols', function () {
      const sources = [getZoomifySource(), getIIPSource()];
      for (let i = 0; i < sources.length; i++) {
        const tileGrid = sources[i].getTileGrid();
        assert.instanceOf(tileGrid, TileGrid);
      }
    });
  });

  describe('#getInterpolate()', function () {
    it('is true by default', function () {
      const source = new Zoomify({url: '', size: [47, 11]});
      assert.strictEqual(source.getInterpolate(), true);
    });

    it('is false if constructed with interpolate: false', function () {
      const source = new Zoomify({interpolate: false, url: '', size: [47, 11]});
      assert.strictEqual(source.getInterpolate(), false);
    });
  });

  describe('generated tileGrid', function () {
    it('has expected extent', function () {
      const sources = [getZoomifySource(), getIIPSource()];
      for (let i = 0; i < sources.length; i++) {
        const tileGrid = sources[i].getTileGrid();
        const expectedExtent = [0, -h, w, 0];
        assert.deepEqual(tileGrid.getExtent(), expectedExtent);
      }
    });

    it('has expected origin', function () {
      const sources = [getZoomifySource(), getIIPSource()];
      for (let i = 0; i < sources.length; i++) {
        const tileGrid = sources[i].getTileGrid();
        const expectedOrigin = [0, 0];
        assert.deepEqual(tileGrid.getOrigin(), expectedOrigin);
      }
    });

    it('has expected resolutions', function () {
      const sources = [getZoomifySource(), getIIPSource()];
      for (let i = 0; i < sources.length; i++) {
        const tileGrid = sources[i].getTileGrid();
        const expectedResolutions = [4, 2, 1];
        assert.deepEqual(tileGrid.getResolutions(), expectedResolutions);
      }
    });

    it('has expected tileSize', function () {
      const sources = [getZoomifySource(), getZoomifySourceWith1024pxTiles()];
      const expectedTileSizes = [DEFAULT_TILE_SIZE, 1024];
      for (let i = 0; i < sources.length; i++) {
        const tileGrid = sources[i].getTileGrid();
        assert.deepEqual(tileGrid.getTileSize(), expectedTileSizes[i]);
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
        assert.deepEqual(tileGrid.getExtent(), expectedExtents[i]);
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
        assert.deepEqual(tileGrid.getOrigin(), expectedOrigins[i]);
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

      assert.deepEqual(tileGrid.getResolutions(), [4, 2, 1]);
      assert.deepEqual(tileGridDefault.getResolutions(), [4, 2, 1]);
      assert.deepEqual(tileGridTruncated.getResolutions(), [2, 1]);
    });
  });

  describe('generated tileUrlFunction for zoomify protocol', function () {
    it('creates an expected tileUrlFunction with zoomify template', function () {
      const source = getZoomifySource();
      const tileUrlFunction = source.getTileUrlFunction();
      assert.deepEqual(
        tileUrlFunction([0, 0, 0]),
        'spec/ol/source/images/zoomify/TileGroup0/0-0-0.jpg',
      );
      assert.deepEqual(
        tileUrlFunction([1, 0, 0]),
        'spec/ol/source/images/zoomify/TileGroup0/1-0-0.jpg',
      );
      assert.deepEqual(
        tileUrlFunction([1, 1, 0]),
        'spec/ol/source/images/zoomify/TileGroup0/1-1-0.jpg',
      );
      assert.deepEqual(
        tileUrlFunction([1, 0, 1]),
        'spec/ol/source/images/zoomify/TileGroup0/1-0-1.jpg',
      );
      assert.deepEqual(
        tileUrlFunction([1, 1, 1]),
        'spec/ol/source/images/zoomify/TileGroup0/1-1-1.jpg',
      );
    });
    it('creates an expected tileUrlFunction with IIP template', function () {
      const source = getIIPSource();
      const tileUrlFunction = source.getTileUrlFunction();
      assert.deepEqual(
        tileUrlFunction([0, 0, 0]),
        'spec/ol/source/images/zoomify?JTL=0,0',
      );
      assert.deepEqual(
        tileUrlFunction([1, 0, 0]),
        'spec/ol/source/images/zoomify?JTL=1,0',
      );
      assert.deepEqual(
        tileUrlFunction([1, 1, 0]),
        'spec/ol/source/images/zoomify?JTL=1,1',
      );
      assert.deepEqual(
        tileUrlFunction([1, 0, 1]),
        'spec/ol/source/images/zoomify?JTL=1,2',
      );
      assert.deepEqual(
        tileUrlFunction([1, 1, 1]),
        'spec/ol/source/images/zoomify?JTL=1,3',
      );
    });
    it('creates an expected tileUrlFunction with custom template', function () {
      const source = new Zoomify({
        url: 'spec/ol/source/images/zoomify/{z}/{x}/{y}.jpg',
        size: size,
      });
      const tileUrlFunction = source.getTileUrlFunction();
      // zoomlevel 0
      expect(tileUrlFunction([0, 0, 0])).to.eql(
        'spec/ol/source/images/zoomify/0/0/0.jpg'
      );
      // zoomlevel 1
      expect(tileUrlFunction([1, 0, 0])).to.eql(
        'spec/ol/source/images/zoomify/1/0/0.jpg'
      );
      expect(tileUrlFunction([1, 1, 0])).to.eql(
        'spec/ol/source/images/zoomify/1/1/0.jpg'
      );
      expect(tileUrlFunction([1, 0, 1])).to.eql(
        'spec/ol/source/images/zoomify/1/0/1.jpg'
      );
      expect(tileUrlFunction([1, 1, 1])).to.eql(
        'spec/ol/source/images/zoomify/1/1/1.jpg'
      );
    });

    it('creates an expected tileUrlFunction without template', function () {
      const source = new Zoomify({
        url: 'spec/ol/source/images/zoomify/',
        size: size,
      });
      const tileUrlFunction = source.getTileUrlFunction();
      assert.deepEqual(
        tileUrlFunction([0, 0, 0]),
        'spec/ol/source/images/zoomify/TileGroup0/0-0-0.jpg',
      );
      assert.deepEqual(
        tileUrlFunction([1, 0, 0]),
        'spec/ol/source/images/zoomify/TileGroup0/1-0-0.jpg',
      );
      assert.deepEqual(
        tileUrlFunction([1, 1, 0]),
        'spec/ol/source/images/zoomify/TileGroup0/1-1-0.jpg',
      );
      assert.deepEqual(
        tileUrlFunction([1, 0, 1]),
        'spec/ol/source/images/zoomify/TileGroup0/1-0-1.jpg',
      );
      assert.deepEqual(
        tileUrlFunction([1, 1, 1]),
        'spec/ol/source/images/zoomify/TileGroup0/1-1-1.jpg',
      );
    });
    it('returns undefined if no tileCoord passed', function () {
      const source = getZoomifySource();
      const tileUrlFunction = source.getTileUrlFunction();
      assert.strictEqual(tileUrlFunction(), undefined);
    });
  });

  describe('uses a custom tileClass', function () {
    it('returns expected tileClass instances via "getTile"', function () {
      const source = getZoomifySource();
      const tile = source.getTile(0, 0, 0, 1, proj);
      assert.instanceOf(tile, CustomTile);
    });
  });
});
