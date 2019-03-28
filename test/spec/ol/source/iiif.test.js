// import {DEFAULT_TILE_SIZE} from '../../../../src/ol/tilegrid/common.js';
import IIIF from '../../../../src/ol/source/IIIF.js';
import {Versions} from '../../../../src/ol/format/IIIFInfo.js';
// import {CustomTile} from '../../../../src/ol/source/Zoomify.js';
// import TileGrid from '../../../../src/ol/tilegrid/TileGrid.js';


describe('ol.source.IIIF', function() {
  const width = 2000,
      height = 1500,
      size = [width, height],
      url = 'http://iiif.test/image-id';

  function getMinimalSource() {
    return new IIIF({
      size: size
    });
  }

  function getSource(additionalOptions) {
    const options = Object.assign({}, {
      size: size,
      url: url
    }, additionalOptions === undefined ? {} : additionalOptions);
    return new IIIF(options);
  }

  describe('constructor', function() {

    it('requires valid size option', function() {

      expect(function() {
        new IIIF();
      }).to.throwException();

      expect(function() {
        new IIIF({});
      }).to.throwException();

      expect(function() {
        new IIIF({
          size: []
        });
      }).to.throwException();

      expect(function() {
        new IIIF({
          size: 100
        });
      }).to.throwException();

      expect(function() {
        new IIIF({
          size: [100]
        });
      }).to.throwException();

      expect(function() {
        new IIIF({
          size: [null, 100]
        });
      }).to.throwException();

      expect(function() {
        new IIIF({
          size: ['very wide', 100]
        });
      }).to.throwException();

      expect(function() {
        new IIIF({
          size: [0, 100]
        });
      }).to.throwException();

      expect(function() {
        new IIIF({
          size: [100, null]
        });
      }).to.throwException();

      expect(function() {
        new IIIF({
          size: [100, 0]
        });
      }).to.throwException();

      expect(function() {
        new IIIF({
          size: [100, 'not that high']
        });
      }).to.throwException();

      expect(function() {
        new IIIF({
          size: [100, 200, 300]
        });
      }).to.throwException();

      let source;

      expect(function() {
        source = new IIIF({
          size: [100, 200]
        });
      }).to.not.throwException();

      expect(source).to.be.a(IIIF);

      expect(function() {
        getMinimalSource();
      }).to.not.throwException();

    });

    it('uses empty base URL, default quality, jpg format as default', function() {

      const tileUrlFunction = getMinimalSource().getTileUrlFunction();
      expect(tileUrlFunction([0, 0, 0])).to.be('full/full/0/default.jpg');

    });

    it('uses native as default quality for version 1', function() {

      const tileUrlFunction = new IIIF({
        size: size,
        version: Versions.VERSION1
      }).getTileUrlFunction();
      expect(tileUrlFunction([0, 0, 0])).to.be('full/full/0/native.jpg');

    });

    it('corrects non empty base URL if trailing slash is missing', function() {

      // missing trailing slash is added
      let tileUrlFunction = getSource().getTileUrlFunction();
      expect(tileUrlFunction([0, 0, 0])).to.be('http://iiif.test/image-id/full/full/0/default.jpg');

      // existent trailing slash isn't doubled
      tileUrlFunction = getSource({
        url: 'http://iiif.test/other-image-id/'
      }).getTileUrlFunction();
      expect(tileUrlFunction([0, 0, 0])).to.be('http://iiif.test/other-image-id/full/full/0/default.jpg');

    });

  });

  describe('tileUrlFunction', function() {

    it('has only one resolution and one tile if no tiles, resolutions, sizes and supported features are given', function() {

      let tileUrlFunction = getSource().getTileUrlFunction();
      expect(tileUrlFunction([0, 0, 0])).to.be('http://iiif.test/image-id/full/full/0/default.jpg');
      expect(tileUrlFunction([-1, 0, 0])).to.be(undefined);
      expect(tileUrlFunction([1, 0, 0])).to.be(undefined);
      expect(tileUrlFunction([0, 1, 0])).to.be(undefined);
      expect(tileUrlFunction([0, 0, 1])).to.be(undefined);

      tileUrlFunction = getSource({
        version: Versions.VERSION1
      }).getTileUrlFunction();
      expect(tileUrlFunction([0, 0, 0])).to.be('http://iiif.test/image-id/full/full/0/native.jpg');

      tileUrlFunction = getSource({
        version: Versions.VERSION3
      }).getTileUrlFunction();
      expect(tileUrlFunction([0, 0, 0])).to.be('http://iiif.test/image-id/full/max/0/default.jpg');

    });

    it('constructs the same number of resolutions as sizes are given', function() {

      let tileUrlFunction = getSource({
        sizes: [[2000, 1500], [1000, 750], [500, 375]]
      }).getTileUrlFunction();

      expect(tileUrlFunction([0, 0, 0])).to.be('http://iiif.test/image-id/full/500,/0/default.jpg');
      expect(tileUrlFunction([1, 0, 0])).to.be('http://iiif.test/image-id/full/1000,/0/default.jpg');
      expect(tileUrlFunction([2, 0, 0])).to.be('http://iiif.test/image-id/full/full/0/default.jpg');
      expect(tileUrlFunction([3, 0, 0])).to.be(undefined);
      expect(tileUrlFunction([-1, 0, 0])).to.be(undefined);
      expect(tileUrlFunction([0, 1, 0])).to.be(undefined);
      expect(tileUrlFunction([0, 0, 1])).to.be(undefined);
      expect(tileUrlFunction([1, 1, 0])).to.be(undefined);
      expect(tileUrlFunction([1, 0, 1])).to.be(undefined);

      tileUrlFunction = getSource({
        sizes: [[2000, 1500], [1000, 750], [500, 375]],
        version: Versions.VERSION3
      }).getTileUrlFunction();

      expect(tileUrlFunction([0, 0, 0])).to.be('http://iiif.test/image-id/full/500,375/0/default.jpg');
      expect(tileUrlFunction([1, 0, 0])).to.be('http://iiif.test/image-id/full/1000,750/0/default.jpg');
      expect(tileUrlFunction([2, 0, 0])).to.be('http://iiif.test/image-id/full/max/0/default.jpg');

      tileUrlFunction = getSource({
        sizes: [[2000, 1500], [1000, 749], [1000, 750], [500, 375], [500, 374]]
      }).getTileUrlFunction();

      expect(tileUrlFunction([0, 0, 0])).to.be('http://iiif.test/image-id/full/500,/0/default.jpg');
      expect(tileUrlFunction([1, 0, 0])).to.be('http://iiif.test/image-id/full/1000,/0/default.jpg');
      expect(tileUrlFunction([2, 0, 0])).to.be('http://iiif.test/image-id/full/full/0/default.jpg');
      expect(tileUrlFunction([3, 0, 0])).to.be(undefined);

    });

    it('given resolutions without tilesize or supported features do not result in tiling', function() {

      const tileUrlFunction = getSource({
        resolutions: [16, 8, 4, 2, 1]
      }).getTileUrlFunction();

      expect(tileUrlFunction([0, 0, 0])).to.be('http://iiif.test/image-id/full/full/0/default.jpg');
      expect(tileUrlFunction([-1, 0, 0])).to.be(undefined);
      expect(tileUrlFunction([1, 0, 0])).to.be(undefined);
      expect(tileUrlFunction([0, 1, 0])).to.be(undefined);
      expect(tileUrlFunction([0, 0, 1])).to.be(undefined);

    });

    it('given tilesize results in tiling with minimal resolutions set and canonical URLs', function() {

      let tileUrlFunction = getSource({
        tileSize: 512
      }).getTileUrlFunction();

      expect(tileUrlFunction([0, 0, 0])).to.be('http://iiif.test/image-id/full/500,/0/default.jpg');
      expect(tileUrlFunction([-1, 0, 0])).to.be(undefined);
      expect(tileUrlFunction([0, 1, 0])).to.be(undefined);
      expect(tileUrlFunction([0, 0, 1])).to.be(undefined);
      expect(tileUrlFunction([1, 0, 0])).to.be('http://iiif.test/image-id/0,0,1024,1024/512,/0/default.jpg');
      expect(tileUrlFunction([1, 1, 0])).to.be('http://iiif.test/image-id/1024,0,976,1024/488,/0/default.jpg');
      expect(tileUrlFunction([1, 0, 1])).to.be('http://iiif.test/image-id/0,1024,1024,476/512,/0/default.jpg');
      expect(tileUrlFunction([1, 1, 1])).to.be('http://iiif.test/image-id/1024,1024,976,476/488,/0/default.jpg');
      expect(tileUrlFunction([2, 0, 0])).to.be('http://iiif.test/image-id/0,0,512,512/512,/0/default.jpg');
      expect(tileUrlFunction([2, 3, 0])).to.be('http://iiif.test/image-id/1536,0,464,512/464,/0/default.jpg');
      expect(tileUrlFunction([2, 0, 2])).to.be('http://iiif.test/image-id/0,1024,512,476/512,/0/default.jpg');
      expect(tileUrlFunction([2, 3, 2])).to.be('http://iiif.test/image-id/1536,1024,464,476/464,/0/default.jpg');
      expect(tileUrlFunction([3, 0, 0])).to.be(undefined);

      tileUrlFunction = getSource({
        tileSize: 512,
        version: Versions.VERSION3
      }).getTileUrlFunction();

      expect(tileUrlFunction([0, 0, 0])).to.be('http://iiif.test/image-id/full/500,375/0/default.jpg');
      expect(tileUrlFunction([1, 0, 0])).to.be('http://iiif.test/image-id/0,0,1024,1024/512,512/0/default.jpg');
      expect(tileUrlFunction([1, 1, 0])).to.be('http://iiif.test/image-id/1024,0,976,1024/488,512/0/default.jpg');
      expect(tileUrlFunction([1, 0, 1])).to.be('http://iiif.test/image-id/0,1024,1024,476/512,238/0/default.jpg');
      expect(tileUrlFunction([1, 1, 1])).to.be('http://iiif.test/image-id/1024,1024,976,476/488,238/0/default.jpg');
      expect(tileUrlFunction([2, 0, 0])).to.be('http://iiif.test/image-id/0,0,512,512/512,512/0/default.jpg');
      expect(tileUrlFunction([2, 3, 0])).to.be('http://iiif.test/image-id/1536,0,464,512/464,512/0/default.jpg');
      expect(tileUrlFunction([2, 0, 2])).to.be('http://iiif.test/image-id/0,1024,512,476/512,476/0/default.jpg');
      expect(tileUrlFunction([2, 3, 2])).to.be('http://iiif.test/image-id/1536,1024,464,476/464,476/0/default.jpg');

    });

    it('', function() {
      //expect(tileUrlFunction([]));
    });

    // canonical tiles
    // unsufficient features, no tilesize, but resolution given: static
    // sufficient features, no tilesize: default tilesize
    // sufficient features, tilesize: this one
    // sufficient features, all teh combinations

  });

});
