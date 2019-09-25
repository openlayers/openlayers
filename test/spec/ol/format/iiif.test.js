import IIIFInfo from '../../../../src/ol/format/IIIFInfo.js';
import {Versions} from '../../../../src/ol/format/IIIFInfo.js';

describe('ol.format.IIIFInfo', () => {

  const iiifInfo = new IIIFInfo();

  describe('setImageInfo', () => {

    test(
      'can handle image info JSON as object or as string serialization',
      () => {

        iiifInfo.setImageInfo({
          '@context': 'http://iiif.io/api/image/3/context.json',
          '@id': 'http://iiif.test/id'
        });
        expect(iiifInfo.getImageApiVersion()).toBe(Versions.VERSION3);

        iiifInfo.setImageInfo('{"@context": "http://iiif.io/api/image/2/context.json","@id":"http://iiif.test/id"}');
        expect(iiifInfo.getImageApiVersion()).toBe(Versions.VERSION2);

      }
    );

  });

  describe('getImageApiVersion', () => {

    test('provides the correct Image API version', () => {

      iiifInfo.setImageInfo({
        '@id': 'http://iiif.test/id'
      });
      expect(function() {
        iiifInfo.getImageApiVersion();
      }).toThrow();

      iiifInfo.setImageInfo({
        identifier: 'http://iiif.test/id',
        profile: 'this is no valid profile'
      });
      expect(function() {
        iiifInfo.getImageApiVersion();
      }).toThrow();

      iiifInfo.setImageInfo({
        '@context': 'this is no valid context',
        '@id': 'http://iiif.test/id'
      });
      expect(function() {
        iiifInfo.getImageApiVersion();
      }).toThrow();

      iiifInfo.setImageInfo({
        identifier: 'http://iiif.test/id',
        profile: 'http://library.stanford.edu/iiif/image-api/compliance.html#level0'
      });
      expect(iiifInfo.getImageApiVersion()).toBe(Versions.VERSION1);

      iiifInfo.setImageInfo({
        '@context': 'http://library.stanford.edu/iiif/image-api/1.1/context.json',
        '@id': 'http://iiif.test/id'
      });
      expect(iiifInfo.getImageApiVersion()).toBe(Versions.VERSION1);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/1/context.json',
        identifier: 'http://iiif.test/id'
      });
      expect(iiifInfo.getImageApiVersion()).toBe(Versions.VERSION1);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        '@id': 'http://iiif.test/id'
      });
      expect(iiifInfo.getImageApiVersion()).toBe(Versions.VERSION2);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        id: 'http://iiif.test/id'
      });
      expect(iiifInfo.getImageApiVersion()).toBe(Versions.VERSION3);

    });

  });

  describe('getComplianceLevelFromProfile', () => {

    test('detects the correct compliance level', () => {

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        profile: 'level0'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).toBe(undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        profile: 'http://iiif.io/api/image/level3.json'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).toBe(undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        profile: 'level1'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).toBe(undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        profile: 'http://iiif.io/api/image/2/level2.json'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).toBe('level2');

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        profile: ['http://iiif.io/api/image/2/level1.json']
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).toBe('level1');

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        profile: 'level4'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).toBe(undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        profile: 'http://iiif.io/api/image/3/level3.json'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).toBe(undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        profile: 'http://iiif.io/api/image/2/level1.json'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).toBe(undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        profile: 'level2'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).toBe('level2');

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        profile: 'http://iiif.io/api/image/3/level1.json'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).toBe('level1');
    });

  });

  describe('getComplianceLevelSupportedFeatures', () => {

    test(
      'provides the correct features for given versions and compliance levels',
      () => {

        iiifInfo.setImageInfo({
          '@context': 'http://library.stanford.edu/iiif/image-api/1.1/context.json',
          profile: 'http://library.stanford.edu/iiif/image-api/compliance.html#level0'
        });
        let level = iiifInfo.getComplianceLevelSupportedFeatures();
        expect(level.supports).toHaveLength(0);

        iiifInfo.setImageInfo({
          '@context': 'http://library.stanford.edu/iiif/image-api/1.1/context.json',
          profile: 'http://library.stanford.edu/iiif/image-api/compliance.html#level1'
        });
        level = iiifInfo.getComplianceLevelSupportedFeatures();
        expect(level.supports).toHaveLength(4);
        expect(level.supports).toContain('regionByPx');
        expect(level.supports).toContain('sizeByW');
        expect(level.supports).toContain('sizeByH');
        expect(level.supports).toContain('sizeByPct');

        iiifInfo.setImageInfo({
          '@context': 'http://library.stanford.edu/iiif/image-api/1.1/context.json',
          profile: 'http://library.stanford.edu/iiif/image-api/compliance.html#level2'
        });
        level = iiifInfo.getComplianceLevelSupportedFeatures();
        expect(level.supports).toHaveLength(7);
        expect(level.supports).toContain('regionByPx');
        expect(level.supports).toContain('regionByPct');
        expect(level.supports).toContain('sizeByW');
        expect(level.supports).toContain('sizeByH');
        expect(level.supports).toContain('sizeByPct');
        expect(level.supports).toContain('sizeByConfinedWh');
        expect(level.supports).toContain('sizeByWh');

        iiifInfo.setImageInfo({
          '@context': 'http://iiif.io/api/image/2/context.json',
          profile: 'http://iiif.io/api/image/2/level0.json'
        });
        level = iiifInfo.getComplianceLevelSupportedFeatures();
        expect(level.supports).toHaveLength(0);

        iiifInfo.setImageInfo({
          '@context': 'http://iiif.io/api/image/2/context.json',
          profile: 'http://iiif.io/api/image/2/level1.json'
        });
        level = iiifInfo.getComplianceLevelSupportedFeatures();
        expect(level.supports).toHaveLength(4);
        expect(level.supports).toContain('regionByPx');
        expect(level.supports).toContain('sizeByW');
        expect(level.supports).toContain('sizeByH');
        expect(level.supports).toContain('sizeByPct');

        iiifInfo.setImageInfo({
          '@context': 'http://iiif.io/api/image/2/context.json',
          profile: 'http://iiif.io/api/image/2/level2.json'
        });
        level = iiifInfo.getComplianceLevelSupportedFeatures();
        expect(level.supports).toHaveLength(8);
        expect(level.supports).toContain('regionByPx');
        expect(level.supports).toContain('regionByPct');
        expect(level.supports).toContain('sizeByW');
        expect(level.supports).toContain('sizeByH');
        expect(level.supports).toContain('sizeByPct');
        expect(level.supports).toContain('sizeByConfinedWh');
        expect(level.supports).toContain('sizeByDistortedWh');
        expect(level.supports).toContain('sizeByWh');

        iiifInfo.setImageInfo({
          '@context': 'http://iiif.io/api/image/3/context.json',
          profile: 'level0'
        });
        level = iiifInfo.getComplianceLevelSupportedFeatures();
        expect(level.supports).toHaveLength(0);

        iiifInfo.setImageInfo({
          '@context': 'http://iiif.io/api/image/3/context.json',
          profile: 'level1'
        });
        level = iiifInfo.getComplianceLevelSupportedFeatures();
        expect(level.supports).toHaveLength(5);
        expect(level.supports).toContain('regionByPx');
        expect(level.supports).toContain('regionSquare');
        expect(level.supports).toContain('sizeByW');
        expect(level.supports).toContain('sizeByH');
        expect(level.supports).toContain('sizeByWh');

        iiifInfo.setImageInfo({
          '@context': 'http://iiif.io/api/image/3/context.json',
          profile: 'level2'
        });
        level = iiifInfo.getComplianceLevelSupportedFeatures();
        expect(level.supports).toHaveLength(8);
        expect(level.supports).toContain('regionByPx');
        expect(level.supports).toContain('regionByPct');
        expect(level.supports).toContain('regionSquare');
        expect(level.supports).toContain('sizeByW');
        expect(level.supports).toContain('sizeByH');
        expect(level.supports).toContain('sizeByWh');
        expect(level.supports).toContain('sizeByConfinedWh');
        expect(level.supports).toContain('sizeByPct');

      }
    );

  });

  describe('getTileSourceOptions', () => {

    test('produces options from minimal information responses', () => {

      expect(function() {
        iiifInfo.setImageInfo({
          width: 2000,
          height: 1500
        });
        iiifInfo.getTileSourceOptions();
      }).toThrow();

      iiifInfo.setImageInfo({
        identifier: 'id',
        profile: 'http://library.stanford.edu/iiif/image-api/compliance.html#level0'
      });
      let options = iiifInfo.getTileSourceOptions();

      expect(typeof options).toBe('object');
      expect(options).toHaveProperty('version');

      iiifInfo.setImageInfo({
        identifier: 'identifier-version-1.0',
        width: 2000,
        height: 1500,
        profile: 'http://library.stanford.edu/iiif/image-api/compliance.html#level0'
      });
      options = iiifInfo.getTileSourceOptions();

      expect(options).not.toBe(undefined);
      expect(options).not.toBe(null);
      expect(options).toHaveProperty('version');
      expect(options).toHaveProperty('size');
      expect(options.size).toBeInstanceOf(Array);
      expect(options.size.length).toBe(2);
      expect(options.size[0]).toBe(2000);
      expect(options.size[1]).toBe(1500);
      expect(options.quality).toBe('native');
      expect(options.url).toBe(undefined);
      expect(options.sizes).toBe(undefined);
      expect(options.tileSize).toBe(undefined);
      expect(options.format).toBe('jpg');
      expect(options.supports).toHaveLength(0);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        '@id': 'http://iiif.test/version2/id'
      });
      options = iiifInfo.getTileSourceOptions();

      expect(typeof options).toBe('object');
      expect(options).toHaveProperty('version');
      expect(options).toHaveProperty('url');
      expect(options).toHaveProperty('format');

    });

    test('uses preferred options if applicable', () => {

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        '@id': 'http://iiif.test/version2/id',
        width: 2000,
        height: 1500,
        profile: ['http://iiif.io/api/image/2/level2.json']
      });
      let options = iiifInfo.getTileSourceOptions({
        quality: 'bitonal',
        format: 'png'
      });
      expect(options).toHaveProperty('quality');
      expect(options).toHaveProperty('format');

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        '@id': 'http://iiif.test/version3/id',
        width: 2000,
        height: 1500,
        profile: 'level2',
        extraQualities: ['gray', 'bitonal']
      });
      options = iiifInfo.getTileSourceOptions({
        quality: 'bitonal',
        format: 'png'
      });
      expect(options).toHaveProperty('quality');
      expect(options).toHaveProperty('format');

    });

    test('ignores preferred options that are not supported', () => {

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        '@id': 'http://iiif.test/version2/id',
        width: 2000,
        height: 1500,
        profile: ['http://iiif.io/api/image/2/level1.json']
      });
      let options = iiifInfo.getTileSourceOptions({
        quality: 'bitonal',
        format: 'png'
      });
      expect(options).toHaveProperty('quality');
      expect(options).toHaveProperty('format');

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        '@id': 'http://iiif.test/version3/id',
        width: 2000,
        height: 1500,
        profile: 'level1'
      });
      options = iiifInfo.getTileSourceOptions({
        quality: 'bitonal',
        format: 'png'
      });
      expect(options).toHaveProperty('quality');
      expect(options).toHaveProperty('format');

    });

    test(
      'combines supported features indicated by compliance level and explicitly stated in image info',
      () => {

        iiifInfo.setImageInfo({
          '@context': 'http://iiif.io/api/image/2/context.json',
          '@id': 'http://iiif.test/id',
          profile: ['http://iiif.io/api/image/2/level1.json', {
            supports: ['regionByPct', 'sizeByWh']
          }]
        });

        let options = iiifInfo.getTileSourceOptions();
        expect(options.supports).toContain('regionByPct');
        expect(options.supports).toContain('sizeByWh');
        expect(options.supports).toContain('regionByPx');
        expect(options.supports).toContain('sizeByW');
        expect(options.supports).toContain('sizeByH');
        expect(options.supports).toContain('sizeByPct');
        expect(options.supports).toHaveLength(6);

        iiifInfo.setImageInfo({
          '@context': 'http://iiif.io/api/image/3/context.json',
          id: 'http://iiif.test/id',
          profile: 'level1',
          extraFeatures: ['regionByPct', 'sizeByPct']
        });

        options = iiifInfo.getTileSourceOptions();
        expect(options.supports).toContain('regionByPct');
        expect(options.supports).toContain('sizeByPct');
        expect(options.supports).toContain('regionByPx');
        expect(options.supports).toContain('regionSquare');
        expect(options.supports).toContain('sizeByW');
        expect(options.supports).toContain('sizeByH');
        expect(options.supports).toContain('sizeByWh');
        expect(options.supports).toHaveLength(7);

      }
    );

    test('uses the first available scale factors and tile sizes', () => {

      iiifInfo.setImageInfo({
        '@context': 'http://library.stanford.edu/iiif/image-api/1.1/context.json',
        '@id': 'http://iiif.test/id',
        profile: 'http://library.stanford.edu/iiif/image-api/compliance.html#level0'
      });
      let options = iiifInfo.getTileSourceOptions();
      expect(options.resolutions).toBe(undefined);
      expect(options.tileSize).toBe(undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://library.stanford.edu/iiif/image-api/1.1/context.json',
        '@id': 'http://iiif.test/id',
        profile: 'http://library.stanford.edu/iiif/image-api/compliance.html#level0',
        scale_factors: [1, 2, 4],
        tile_width: 512
      });
      options = iiifInfo.getTileSourceOptions();
      expect(options.resolutions).toHaveLength(3);
      expect(options.resolutions).toContain(1);
      expect(options.resolutions).toContain(2);
      expect(options.resolutions).toContain(4);
      expect(options.tileSize).toHaveLength(2);
      expect(options.tileSize[0]).toBe(512);
      expect(options.tileSize[1]).toBe(512);

      iiifInfo.setImageInfo({
        '@context': 'http://library.stanford.edu/iiif/image-api/1.1/context.json',
        '@id': 'http://iiif.test/id',
        profile: 'http://library.stanford.edu/iiif/image-api/compliance.html#level0',
        scale_factors: [1, 2, 4],
        tile_width: 512,
        tile_height: 1024
      });
      options = iiifInfo.getTileSourceOptions();
      expect(options.resolutions).toHaveLength(3);
      expect(options.resolutions).toContain(1);
      expect(options.resolutions).toContain(2);
      expect(options.resolutions).toContain(4);
      expect(options.tileSize).toHaveLength(2);
      expect(options.tileSize[0]).toBe(512);
      expect(options.tileSize[1]).toBe(1024);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        '@id': 'http://iiif.test/id',
        profile: 'http://iiif.io/api/image/2/level0.json'
      });
      options = iiifInfo.getTileSourceOptions();
      expect(options.resolutions).toBe(undefined);
      expect(options.tileSize).toBe(undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        '@id': 'http://iiif.test/id',
        profile: 'http://iiif.io/api/image/2/level0.json',
        tiles: [{
          scaleFactors: [1, 2, 4],
          width: 512
        },
        {
          scaleFactors: [1, 2, 4, 8, 16],
          width: 256
        }]
      });
      options = iiifInfo.getTileSourceOptions();
      expect(options.resolutions).toHaveLength(3);
      expect(options.resolutions).toContain(1);
      expect(options.resolutions).toContain(2);
      expect(options.resolutions).toContain(4);
      expect(options.tileSize).toHaveLength(2);
      expect(options.tileSize[0]).toBe(512);
      expect(options.tileSize[1]).toBe(512);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        '@id': 'http://iiif.test/id',
        profile: 'http://iiif.io/api/image/2/level0.json',
        tiles: [{
          scaleFactors: [1, 2, 4],
          width: 512,
          height: 1024
        }]
      });
      options = iiifInfo.getTileSourceOptions();
      expect(options.resolutions).toHaveLength(3);
      expect(options.resolutions).toContain(1);
      expect(options.resolutions).toContain(2);
      expect(options.resolutions).toContain(4);
      expect(options.tileSize).toHaveLength(2);
      expect(options.tileSize[0]).toBe(512);
      expect(options.tileSize[1]).toBe(1024);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        '@id': 'http://iiif.test/id',
        profile: 'level0',
        tiles: [{
          scaleFactors: [1, 2, 4, 8],
          width: 512,
          height: 256
        }]
      });
      options = iiifInfo.getTileSourceOptions();
      expect(options.resolutions).toHaveLength(4);
      expect(options.resolutions).toContain(1);
      expect(options.resolutions).toContain(2);
      expect(options.resolutions).toContain(4);
      expect(options.resolutions).toContain(8);
      expect(options.tileSize).toHaveLength(2);
      expect(options.tileSize[0]).toBe(512);
      expect(options.tileSize[1]).toBe(256);

    });

  });

  test('provides each given size in sizes as OpenLayers Size', () => {

    iiifInfo.setImageInfo({
      '@context': 'http://iiif.io/api/image/2/context.json',
      '@id': 'http://iiif.test/id',
      'sizes': [{
        width: 2000,
        height: 1000
      },
      {
        width: 1000,
        height: 500
      },
      {
        width: 500,
        height: 250
      }]
    });
    let options = iiifInfo.getTileSourceOptions();
    expect(options.sizes).toHaveLength(3);
    expect(options.sizes[0]).toHaveLength(2);
    expect(options.sizes[0][0]).toBe(2000);
    expect(options.sizes[0][1]).toBe(1000);
    expect(options.sizes[1]).toHaveLength(2);
    expect(options.sizes[1][0]).toBe(1000);
    expect(options.sizes[1][1]).toBe(500);
    expect(options.sizes[2]).toHaveLength(2);
    expect(options.sizes[2][0]).toBe(500);
    expect(options.sizes[2][1]).toBe(250);

    iiifInfo.setImageInfo({
      '@context': 'http://iiif.io/api/image/3/context.json',
      '@id': 'http://iiif.test/id',
      'sizes': [{
        width: 1500,
        height: 800
      }]
    });
    options = iiifInfo.getTileSourceOptions();
    expect(options.sizes).toHaveLength(1);
    expect(options.sizes[0]).toHaveLength(2);
    expect(options.sizes[0][0]).toBe(1500);
    expect(options.sizes[0][1]).toBe(800);

  });

  test('respects the preferred image formats', () => {

    iiifInfo.setImageInfo({
      '@context': 'http://iiif.io/api/image/3/context.json',
      'id': 'http://iiif.test/id',
      'profile': 'level0',
      'preferredFormats': ['png', 'gif']
    });
    let options = iiifInfo.getTileSourceOptions();
    expect(options.format).toBe('jpg');

    iiifInfo.setImageInfo({
      '@context': 'http://iiif.io/api/image/3/context.json',
      'id': 'http://iiif.test/id',
      'profile': 'level1',
      'preferredFormats': ['png', 'gif']
    });
    options = iiifInfo.getTileSourceOptions();
    expect(options.format).toBe('jpg');

    iiifInfo.setImageInfo({
      '@context': 'http://iiif.io/api/image/3/context.json',
      'id': 'http://iiif.test/id',
      'profile': 'level1',
      'extraFormats': ['webp', 'gif'],
      'preferredFormats': ['webp', 'png', 'gif']
    });
    options = iiifInfo.getTileSourceOptions();
    expect(options.format).toBe('gif');

    iiifInfo.setImageInfo({
      '@context': 'http://iiif.io/api/image/3/context.json',
      'id': 'http://iiif.test/id',
      'profile': 'level2',
      'preferredFormats': ['png', 'gif']
    });
    options = iiifInfo.getTileSourceOptions();
    expect(options.format).toBe('png');

  });


});
