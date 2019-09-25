import {DEFAULT_TILE_SIZE} from '../../../../src/ol/tilegrid/common.js';
import IIIF from '../../../../src/ol/source/IIIF.js';
import {Versions} from '../../../../src/ol/format/IIIFInfo.js';


describe('ol.source.IIIF', () => {
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

  describe('constructor', () => {

    test('requires valid size option', () => {

      expect(function() {
        new IIIF();
      }).toThrow();

      expect(function() {
        new IIIF({});
      }).toThrow();

      expect(function() {
        new IIIF({
          size: []
        });
      }).toThrow();

      expect(function() {
        new IIIF({
          size: 100
        });
      }).toThrow();

      expect(function() {
        new IIIF({
          size: [100]
        });
      }).toThrow();

      expect(function() {
        new IIIF({
          size: [null, 100]
        });
      }).toThrow();

      expect(function() {
        new IIIF({
          size: ['very wide', 100]
        });
      }).toThrow();

      expect(function() {
        new IIIF({
          size: [0, 100]
        });
      }).toThrow();

      expect(function() {
        new IIIF({
          size: [100, null]
        });
      }).toThrow();

      expect(function() {
        new IIIF({
          size: [100, 0]
        });
      }).toThrow();

      expect(function() {
        new IIIF({
          size: [100, 'not that high']
        });
      }).toThrow();

      expect(function() {
        new IIIF({
          size: [100, 200, 300]
        });
      }).toThrow();

      let source;

      expect(function() {
        source = new IIIF({
          size: [100, 200]
        });
      }).not.toThrow();

      expect(source).toBeInstanceOf(IIIF);

      expect(function() {
        getMinimalSource();
      }).not.toThrow();

    });

    test(
      'uses empty base URL, default quality, jpg format as default',
      () => {

        const tileUrlFunction = getMinimalSource().getTileUrlFunction();
        expect(tileUrlFunction([0, 0, 0])).toBe('full/full/0/default.jpg');

      }
    );

    test('uses native as default quality for version 1', () => {

      const tileUrlFunction = new IIIF({
        size: size,
        version: Versions.VERSION1
      }).getTileUrlFunction();
      expect(tileUrlFunction([0, 0, 0])).toBe('full/full/0/native.jpg');

    });

    test('corrects non empty base URL if trailing slash is missing', () => {

      // missing trailing slash is added
      let tileUrlFunction = getSource().getTileUrlFunction();
      expect(tileUrlFunction([0, 0, 0])).toBe('http://iiif.test/image-id/full/full/0/default.jpg');

      // existent trailing slash isn't doubled
      tileUrlFunction = getSource({
        url: 'http://iiif.test/other-image-id/'
      }).getTileUrlFunction();
      expect(tileUrlFunction([0, 0, 0])).toBe('http://iiif.test/other-image-id/full/full/0/default.jpg');

    });

  });

  describe('tileUrlFunction', () => {

    test(
      'has only one resolution and one tile if no tiles, resolutions, sizes and supported features are given',
      () => {

        let tileUrlFunction = getSource().getTileUrlFunction();
        expect(tileUrlFunction([0, 0, 0])).toBe('http://iiif.test/image-id/full/full/0/default.jpg');
        expect(tileUrlFunction([-1, 0, 0])).toBe(undefined);
        expect(tileUrlFunction([1, 0, 0])).toBe(undefined);
        expect(tileUrlFunction([0, 1, 0])).toBe(undefined);
        expect(tileUrlFunction([0, 0, 1])).toBe(undefined);

        tileUrlFunction = getSource({
          version: Versions.VERSION1
        }).getTileUrlFunction();
        expect(tileUrlFunction([0, 0, 0])).toBe('http://iiif.test/image-id/full/full/0/native.jpg');

        tileUrlFunction = getSource({
          version: Versions.VERSION3
        }).getTileUrlFunction();
        expect(tileUrlFunction([0, 0, 0])).toBe('http://iiif.test/image-id/full/max/0/default.jpg');

      }
    );

    test(
      'constructs the same number of resolutions as distinguishable sizes are given',
      () => {

        let tileUrlFunction = getSource({
          sizes: [[2000, 1500], [1000, 750], [500, 375]]
        }).getTileUrlFunction();

        expect(tileUrlFunction([0, 0, 0])).toBe('http://iiif.test/image-id/full/500,/0/default.jpg');
        expect(tileUrlFunction([1, 0, 0])).toBe('http://iiif.test/image-id/full/1000,/0/default.jpg');
        expect(tileUrlFunction([2, 0, 0])).toBe('http://iiif.test/image-id/full/full/0/default.jpg');
        expect(tileUrlFunction([3, 0, 0])).toBe(undefined);
        expect(tileUrlFunction([-1, 0, 0])).toBe(undefined);
        expect(tileUrlFunction([0, 1, 0])).toBe(undefined);
        expect(tileUrlFunction([0, 0, 1])).toBe(undefined);
        expect(tileUrlFunction([1, 1, 0])).toBe(undefined);
        expect(tileUrlFunction([1, 0, 1])).toBe(undefined);

        tileUrlFunction = getSource({
          sizes: [[2000, 1500], [1000, 750], [500, 375]],
          version: Versions.VERSION3
        }).getTileUrlFunction();

        expect(tileUrlFunction([0, 0, 0])).toBe('http://iiif.test/image-id/full/500,375/0/default.jpg');
        expect(tileUrlFunction([1, 0, 0])).toBe('http://iiif.test/image-id/full/1000,750/0/default.jpg');
        expect(tileUrlFunction([2, 0, 0])).toBe('http://iiif.test/image-id/full/max/0/default.jpg');

        tileUrlFunction = getSource({
          sizes: [[2000, 1500], [1000, 749], [1000, 750], [500, 375], [500, 374]]
        }).getTileUrlFunction();

        expect(tileUrlFunction([0, 0, 0])).toBe('http://iiif.test/image-id/full/500,/0/default.jpg');
        expect(tileUrlFunction([1, 0, 0])).toBe('http://iiif.test/image-id/full/1000,/0/default.jpg');
        expect(tileUrlFunction([2, 0, 0])).toBe('http://iiif.test/image-id/full/full/0/default.jpg');
        expect(tileUrlFunction([3, 0, 0])).toBe(undefined);

        tileUrlFunction = getSource({
          version: Versions.VERSION3,
          sizes: [[2000, 1500], [1000, 750], [500, 375]]
        }).getTileUrlFunction();

        expect(tileUrlFunction([0, 0, 0])).toBe('http://iiif.test/image-id/full/500,375/0/default.jpg');
        expect(tileUrlFunction([1, 0, 0])).toBe('http://iiif.test/image-id/full/1000,750/0/default.jpg');
        expect(tileUrlFunction([2, 0, 0])).toBe('http://iiif.test/image-id/full/max/0/default.jpg');
        expect(tileUrlFunction([3, 0, 0])).toBe(undefined);
        expect(tileUrlFunction([-1, 0, 0])).toBe(undefined);
        expect(tileUrlFunction([0, 1, 0])).toBe(undefined);
        expect(tileUrlFunction([0, 0, 1])).toBe(undefined);
        expect(tileUrlFunction([1, 1, 0])).toBe(undefined);
        expect(tileUrlFunction([1, 0, 1])).toBe(undefined);

      }
    );

    test(
      'cannot provide scaled tiles without provided tilesize or supported features',
      () => {

        const tileUrlFunction = getSource({
          resolutions: [16, 8, 4, 2, 1]
        }).getTileUrlFunction();

        expect(tileUrlFunction([0, 0, 0])).toBe('http://iiif.test/image-id/full/full/0/default.jpg');
        expect(tileUrlFunction([-1, 0, 0])).toBe(undefined);
        expect(tileUrlFunction([1, 0, 0])).toBe(undefined);
        expect(tileUrlFunction([0, 1, 0])).toBe(undefined);
        expect(tileUrlFunction([0, 0, 1])).toBe(undefined);

      }
    );

    test(
      'provides canonical tile URLs for all necessary resolutions if only a tileSize exists',
      () => {

        let tileUrlFunction = getSource({
          tileSize: 512
        }).getTileUrlFunction();

        expect(tileUrlFunction([0, 0, 0])).toBe('http://iiif.test/image-id/full/500,/0/default.jpg');
        expect(tileUrlFunction([-1, 0, 0])).toBe(undefined);
        expect(tileUrlFunction([0, 1, 0])).toBe(undefined);
        expect(tileUrlFunction([0, 0, 1])).toBe(undefined);
        expect(tileUrlFunction([1, 0, 0])).toBe('http://iiif.test/image-id/0,0,1024,1024/512,/0/default.jpg');
        expect(tileUrlFunction([1, 1, 0])).toBe('http://iiif.test/image-id/1024,0,976,1024/488,/0/default.jpg');
        expect(tileUrlFunction([1, 0, 1])).toBe('http://iiif.test/image-id/0,1024,1024,476/512,/0/default.jpg');
        expect(tileUrlFunction([1, 1, 1])).toBe('http://iiif.test/image-id/1024,1024,976,476/488,/0/default.jpg');
        expect(tileUrlFunction([2, 0, 0])).toBe('http://iiif.test/image-id/0,0,512,512/512,/0/default.jpg');
        expect(tileUrlFunction([2, 3, 0])).toBe('http://iiif.test/image-id/1536,0,464,512/464,/0/default.jpg');
        expect(tileUrlFunction([2, 0, 2])).toBe('http://iiif.test/image-id/0,1024,512,476/512,/0/default.jpg');
        expect(tileUrlFunction([2, 3, 2])).toBe('http://iiif.test/image-id/1536,1024,464,476/464,/0/default.jpg');
        expect(tileUrlFunction([3, 0, 0])).toBe(undefined);

        tileUrlFunction = getSource({
          tileSize: 512,
          version: Versions.VERSION3
        }).getTileUrlFunction();

        expect(tileUrlFunction([0, 0, 0])).toBe('http://iiif.test/image-id/full/500,375/0/default.jpg');
        expect(tileUrlFunction([1, 0, 0])).toBe('http://iiif.test/image-id/0,0,1024,1024/512,512/0/default.jpg');
        expect(tileUrlFunction([1, 1, 0])).toBe('http://iiif.test/image-id/1024,0,976,1024/488,512/0/default.jpg');
        expect(tileUrlFunction([1, 0, 1])).toBe('http://iiif.test/image-id/0,1024,1024,476/512,238/0/default.jpg');
        expect(tileUrlFunction([1, 1, 1])).toBe('http://iiif.test/image-id/1024,1024,976,476/488,238/0/default.jpg');
        expect(tileUrlFunction([2, 0, 0])).toBe('http://iiif.test/image-id/0,0,512,512/512,512/0/default.jpg');
        expect(tileUrlFunction([2, 3, 0])).toBe('http://iiif.test/image-id/1536,0,464,512/464,512/0/default.jpg');
        expect(tileUrlFunction([2, 0, 2])).toBe('http://iiif.test/image-id/0,1024,512,476/512,476/0/default.jpg');
        expect(tileUrlFunction([2, 3, 2])).toBe('http://iiif.test/image-id/1536,1024,464,476/464,476/0/default.jpg');

      }
    );

    test(
      'provides canonical tile URLs for all provided resolutions if a tileSize also exists',
      () => {

        const tileUrlFunction = getSource({
          tileSize: 512,
          resolutions: [8, 4, 2, 1]
        }).getTileUrlFunction();

        expect(tileUrlFunction([0, 0, 0])).toBe('http://iiif.test/image-id/full/250,/0/default.jpg');
        expect(tileUrlFunction([1, 0, 0])).toBe('http://iiif.test/image-id/full/500,/0/default.jpg');
        expect(tileUrlFunction([2, 0, 0])).toBe('http://iiif.test/image-id/0,0,1024,1024/512,/0/default.jpg');
        expect(tileUrlFunction([2, 1, 0])).toBe('http://iiif.test/image-id/1024,0,976,1024/488,/0/default.jpg');
        expect(tileUrlFunction([2, 0, 1])).toBe('http://iiif.test/image-id/0,1024,1024,476/512,/0/default.jpg');
        expect(tileUrlFunction([2, 1, 1])).toBe('http://iiif.test/image-id/1024,1024,976,476/488,/0/default.jpg');
        expect(tileUrlFunction([3, 0, 0])).toBe('http://iiif.test/image-id/0,0,512,512/512,/0/default.jpg');
        expect(tileUrlFunction([3, 3, 0])).toBe('http://iiif.test/image-id/1536,0,464,512/464,/0/default.jpg');
        expect(tileUrlFunction([3, 0, 2])).toBe('http://iiif.test/image-id/0,1024,512,476/512,/0/default.jpg');
        expect(tileUrlFunction([3, 3, 2])).toBe('http://iiif.test/image-id/1536,1024,464,476/464,/0/default.jpg');
        expect(tileUrlFunction([4, 0, 0])).toBe(undefined);

      }
    );

    test('supports non square tiles', () => {

      let tileUrlFunction = getSource({
        tileSize: [1024, 512]
      }).getTileUrlFunction();

      expect(tileUrlFunction([0, 0, 0])).toBe('http://iiif.test/image-id/full/500,/0/default.jpg');
      expect(tileUrlFunction([1, 0, 0])).toBe('http://iiif.test/image-id/0,0,2000,1024/1000,/0/default.jpg');
      expect(tileUrlFunction([1, 0, 1])).toBe('http://iiif.test/image-id/0,1024,2000,476/1000,/0/default.jpg');
      expect(tileUrlFunction([2, 0, 0])).toBe('http://iiif.test/image-id/0,0,1024,512/1024,/0/default.jpg');
      expect(tileUrlFunction([2, 1, 0])).toBe('http://iiif.test/image-id/1024,0,976,512/976,/0/default.jpg');
      expect(tileUrlFunction([2, 0, 2])).toBe('http://iiif.test/image-id/0,1024,1024,476/1024,/0/default.jpg');
      expect(tileUrlFunction([2, 1, 2])).toBe('http://iiif.test/image-id/1024,1024,976,476/976,/0/default.jpg');
      expect(tileUrlFunction([3, 0, 0])).toBe(undefined);

      tileUrlFunction = getSource({
        tileSize: [1024, 512],
        version: Versions.VERSION3
      }).getTileUrlFunction();

      expect(tileUrlFunction([0, 0, 0])).toBe('http://iiif.test/image-id/full/500,375/0/default.jpg');
      expect(tileUrlFunction([2, 0, 0])).toBe('http://iiif.test/image-id/0,0,1024,512/1024,512/0/default.jpg');

    });

    test(
      'provides tile URLs with default tile size if sufficient supported features are provided',
      () => {

        let tileUrlFunction = getSource({
          supports: ['regionByPx', 'sizeByW']
        }).getTileUrlFunction();

        const maxZoom = Math.ceil(Math.log2(width / DEFAULT_TILE_SIZE));

        expect(tileUrlFunction([maxZoom, 0, 0])).toBe(
          'http://iiif.test/image-id/0,0,' + DEFAULT_TILE_SIZE + ',' + DEFAULT_TILE_SIZE + '/' + DEFAULT_TILE_SIZE + ',/0/default.jpg'
        );
        expect(tileUrlFunction([maxZoom + 1, 0, 0])).toBe(undefined);

        tileUrlFunction = getSource({
          supports: ['regionByPx', 'sizeByH']
        }).getTileUrlFunction();

        expect(tileUrlFunction([maxZoom, 0, 0])).toBe(
          'http://iiif.test/image-id/0,0,' + DEFAULT_TILE_SIZE + ',' + DEFAULT_TILE_SIZE + '/,' + DEFAULT_TILE_SIZE + '/0/default.jpg'
        );
        expect(tileUrlFunction([maxZoom + 1, 0, 0])).toBe(undefined);

        tileUrlFunction = getSource({
          supports: ['regionByPx', 'sizeByWh']
        }).getTileUrlFunction();

        expect(tileUrlFunction([maxZoom, 0, 0])).toBe(
          'http://iiif.test/image-id/0,0,' + DEFAULT_TILE_SIZE + ',' + DEFAULT_TILE_SIZE + '/' + DEFAULT_TILE_SIZE + ',' + DEFAULT_TILE_SIZE + '/0/default.jpg'
        );
        expect(tileUrlFunction([maxZoom + 1, 0, 0])).toBe(undefined);

        tileUrlFunction = getSource({
          supports: ['regionByPct', 'sizeByPct']
        }).getTileUrlFunction();

        const tileWPct = (DEFAULT_TILE_SIZE / width * 100).toLocaleString('en', {maximumFractionDigits: 10}),
            tileHPct = (DEFAULT_TILE_SIZE / height * 100).toLocaleString('en', {maximumFractionDigits: 10});

        expect(tileUrlFunction([maxZoom, 0, 0])).toBe(
          'http://iiif.test/image-id/pct:0,0,' + tileWPct + ',' + tileHPct + '/pct:100/0/default.jpg'
        );
        expect(tileUrlFunction([maxZoom + 1, 0, 0])).toBe(undefined);

      }
    );

    test('prefers canonical tile URLs', () => {

      let tileUrlFunction = getSource({
        tileSize: 512,
        supports: ['regionByPx', 'regionByPct', 'sizeByW', 'sizeByH', 'sizeByWh', 'sizeByPct']
      }).getTileUrlFunction();

      expect(tileUrlFunction([2, 0, 0])).toBe('http://iiif.test/image-id/0,0,512,512/512,/0/default.jpg');

      tileUrlFunction = getSource({
        tileSize: 512,
        version: Versions.VERSION3,
        supports: ['regionByPx', 'regionByPct', 'sizeByW', 'sizeByH', 'sizeByWh', 'sizeByPct']
      }).getTileUrlFunction();

      expect(tileUrlFunction([2, 0, 0])).toBe('http://iiif.test/image-id/0,0,512,512/512,512/0/default.jpg');

    });


    test(
      'provides correct tile URLs for percentage URL parameter values',
      () => {

        const tileUrlFunction = getSource({
          tileSize: 512,
          supports: ['regionByPct', 'sizeByPct']
        }).getTileUrlFunction();

        expect(tileUrlFunction([0, 0, 0])).toBe('http://iiif.test/image-id/full/pct:25/0/default.jpg');
        expect(tileUrlFunction([-1, 0, 0])).toBe(undefined);
        expect(tileUrlFunction([0, 1, 0])).toBe(undefined);
        expect(tileUrlFunction([0, 0, 1])).toBe(undefined);

        expect(tileUrlFunction([1, 0, 0])).toBe(
          'http://iiif.test/image-id/pct:0,0,51.2,68.2666666667/pct:50/0/default.jpg'
        );
        expect(tileUrlFunction([1, 1, 0])).toBe(
          'http://iiif.test/image-id/pct:51.2,0,48.8,68.2666666667/pct:50/0/default.jpg'
        );
        expect(tileUrlFunction([1, 0, 1])).toBe(
          'http://iiif.test/image-id/pct:0,68.2666666667,51.2,31.7333333333/pct:50/0/default.jpg'
        );
        expect(tileUrlFunction([1, 1, 1])).toBe(
          'http://iiif.test/image-id/pct:51.2,68.2666666667,48.8,31.7333333333/pct:50/0/default.jpg'
        );

        expect(tileUrlFunction([2, 0, 0])).toBe(
          'http://iiif.test/image-id/pct:0,0,25.6,34.1333333333/pct:100/0/default.jpg'
        );
        expect(tileUrlFunction([2, 3, 0])).toBe(
          'http://iiif.test/image-id/pct:76.8,0,23.2,34.1333333333/pct:100/0/default.jpg'
        );
        expect(tileUrlFunction([2, 0, 2])).toBe(
          'http://iiif.test/image-id/pct:0,68.2666666667,25.6,31.7333333333/pct:100/0/default.jpg'
        );
        expect(tileUrlFunction([2, 3, 2])).toBe(
          'http://iiif.test/image-id/pct:76.8,68.2666666667,23.2,31.7333333333/pct:100/0/default.jpg'
        );
        expect(tileUrlFunction([3, 0, 0])).toBe(undefined);

      }
    );

  });

});
