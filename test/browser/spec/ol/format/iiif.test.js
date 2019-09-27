import {assert} from 'chai';
import IIIFInfo, {Versions} from '../../../../../src/ol/format/IIIFInfo.js';

describe('ol.format.IIIFInfo', function () {
  const iiifInfo = new IIIFInfo();

  describe('setImageInfo', function () {
    it('can handle image info JSON as object or as string serialization', function () {
      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        '@id': 'http://iiif.test/id',
      });
      assert.strictEqual(iiifInfo.getImageApiVersion(), Versions.VERSION3);

      iiifInfo.setImageInfo(
        '{"@context": "http://iiif.io/api/image/2/context.json","@id":"http://iiif.test/id"}',
      );
      assert.strictEqual(iiifInfo.getImageApiVersion(), Versions.VERSION2);
    });
  });

  describe('getImageApiVersion', function () {
    it('provides the correct Image API version', function () {
      iiifInfo.setImageInfo({
        '@id': 'http://iiif.test/id',
      });
      assert.throws(function () {
        iiifInfo.getImageApiVersion();
      });

      iiifInfo.setImageInfo({
        identifier: 'http://iiif.test/id',
        profile: 'this is no valid profile',
      });
      assert.throws(function () {
        iiifInfo.getImageApiVersion();
      });

      iiifInfo.setImageInfo({
        '@context': 'this is no valid context',
        '@id': 'http://iiif.test/id',
      });
      assert.throws(function () {
        iiifInfo.getImageApiVersion();
      });

      iiifInfo.setImageInfo({
        identifier: 'http://iiif.test/id',
        profile:
          'http://library.stanford.edu/iiif/image-api/compliance.html#level0',
      });
      assert.strictEqual(iiifInfo.getImageApiVersion(), Versions.VERSION1);

      iiifInfo.setImageInfo({
        '@context':
          'http://library.stanford.edu/iiif/image-api/1.1/context.json',
        '@id': 'http://iiif.test/id',
      });
      assert.strictEqual(iiifInfo.getImageApiVersion(), Versions.VERSION1);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/1/context.json',
        identifier: 'http://iiif.test/id',
      });
      assert.strictEqual(iiifInfo.getImageApiVersion(), Versions.VERSION1);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        '@id': 'http://iiif.test/id',
      });
      assert.strictEqual(iiifInfo.getImageApiVersion(), Versions.VERSION2);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        id: 'http://iiif.test/id',
      });
      assert.strictEqual(iiifInfo.getImageApiVersion(), Versions.VERSION3);
    });
  });

  describe('getComplianceLevelFromProfile', function () {
    it('detects the correct compliance level', function () {
      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        profile: 'level0',
      });
      assert.strictEqual(iiifInfo.getComplianceLevelFromProfile(), undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        profile: 'http://iiif.io/api/image/level3.json',
      });
      assert.strictEqual(iiifInfo.getComplianceLevelFromProfile(), undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        profile: 'level1',
      });
      assert.strictEqual(iiifInfo.getComplianceLevelFromProfile(), undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        profile: 'http://iiif.io/api/image/2/level2.json',
      });
      assert.strictEqual(iiifInfo.getComplianceLevelFromProfile(), 'level2');

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        profile: ['http://iiif.io/api/image/2/level1.json'],
      });
      assert.strictEqual(iiifInfo.getComplianceLevelFromProfile(), 'level1');

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        profile: 'level4',
      });
      assert.strictEqual(iiifInfo.getComplianceLevelFromProfile(), undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        profile: 'http://iiif.io/api/image/3/level3.json',
      });
      assert.strictEqual(iiifInfo.getComplianceLevelFromProfile(), undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        profile: 'http://iiif.io/api/image/2/level1.json',
      });
      assert.strictEqual(iiifInfo.getComplianceLevelFromProfile(), undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        profile: 'level2',
      });
      assert.strictEqual(iiifInfo.getComplianceLevelFromProfile(), 'level2');

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        profile: 'http://iiif.io/api/image/3/level1.json',
      });
      assert.strictEqual(iiifInfo.getComplianceLevelFromProfile(), 'level1');
    });
  });

  describe('getComplianceLevelSupportedFeatures', function () {
    it('provides the correct features for given versions and compliance levels', function () {
      iiifInfo.setImageInfo({
        '@context':
          'http://library.stanford.edu/iiif/image-api/1.1/context.json',
        profile:
          'http://library.stanford.edu/iiif/image-api/compliance.html#level0',
      });
      let level = iiifInfo.getComplianceLevelSupportedFeatures();
      assert.isEmpty(level.supports);

      iiifInfo.setImageInfo({
        '@context':
          'http://library.stanford.edu/iiif/image-api/1.1/context.json',
        profile:
          'http://library.stanford.edu/iiif/image-api/compliance.html#level1',
      });
      level = iiifInfo.getComplianceLevelSupportedFeatures();
      assert.lengthOf(level.supports, 4);
      assert.include(level.supports, 'regionByPx');
      assert.include(level.supports, 'sizeByW');
      assert.include(level.supports, 'sizeByH');
      assert.include(level.supports, 'sizeByPct');

      iiifInfo.setImageInfo({
        '@context':
          'http://library.stanford.edu/iiif/image-api/1.1/context.json',
        profile:
          'http://library.stanford.edu/iiif/image-api/compliance.html#level2',
      });
      level = iiifInfo.getComplianceLevelSupportedFeatures();
      assert.lengthOf(level.supports, 7);
      assert.include(level.supports, 'regionByPx');
      assert.include(level.supports, 'regionByPct');
      assert.include(level.supports, 'sizeByW');
      assert.include(level.supports, 'sizeByH');
      assert.include(level.supports, 'sizeByPct');
      assert.include(level.supports, 'sizeByConfinedWh');
      assert.include(level.supports, 'sizeByWh');

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        profile: 'http://iiif.io/api/image/2/level0.json',
      });
      level = iiifInfo.getComplianceLevelSupportedFeatures();
      assert.isEmpty(level.supports);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        profile: 'http://iiif.io/api/image/2/level1.json',
      });
      level = iiifInfo.getComplianceLevelSupportedFeatures();
      assert.lengthOf(level.supports, 4);
      assert.include(level.supports, 'regionByPx');
      assert.include(level.supports, 'sizeByW');
      assert.include(level.supports, 'sizeByH');
      assert.include(level.supports, 'sizeByPct');

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        profile: 'http://iiif.io/api/image/2/level2.json',
      });
      level = iiifInfo.getComplianceLevelSupportedFeatures();
      assert.lengthOf(level.supports, 8);
      assert.include(level.supports, 'regionByPx');
      assert.include(level.supports, 'regionByPct');
      assert.include(level.supports, 'sizeByW');
      assert.include(level.supports, 'sizeByH');
      assert.include(level.supports, 'sizeByPct');
      assert.include(level.supports, 'sizeByConfinedWh');
      assert.include(level.supports, 'sizeByDistortedWh');
      assert.include(level.supports, 'sizeByWh');

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        profile: 'level0',
      });
      level = iiifInfo.getComplianceLevelSupportedFeatures();
      assert.isEmpty(level.supports);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        profile: 'level1',
      });
      level = iiifInfo.getComplianceLevelSupportedFeatures();
      assert.lengthOf(level.supports, 5);
      assert.include(level.supports, 'regionByPx');
      assert.include(level.supports, 'regionSquare');
      assert.include(level.supports, 'sizeByW');
      assert.include(level.supports, 'sizeByH');
      assert.include(level.supports, 'sizeByWh');

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        profile: 'level2',
      });
      level = iiifInfo.getComplianceLevelSupportedFeatures();
      assert.lengthOf(level.supports, 8);
      assert.include(level.supports, 'regionByPx');
      assert.include(level.supports, 'regionByPct');
      assert.include(level.supports, 'regionSquare');
      assert.include(level.supports, 'sizeByW');
      assert.include(level.supports, 'sizeByH');
      assert.include(level.supports, 'sizeByWh');
      assert.include(level.supports, 'sizeByConfinedWh');
      assert.include(level.supports, 'sizeByPct');
    });
  });

  describe('getTileSourceOptions', function () {
    it('produces options from minimal information responses', function () {
      assert.throws(function () {
        iiifInfo.setImageInfo({
          width: 2000,
          height: 1500,
        });
        iiifInfo.getTileSourceOptions();
      });

      iiifInfo.setImageInfo({
        identifier: 'id',
        profile:
          'http://library.stanford.edu/iiif/image-api/compliance.html#level0',
      });
      let options = iiifInfo.getTileSourceOptions();

      assert.isObject(options);
      assert.propertyVal(options, 'version', Versions.VERSION1);

      iiifInfo.setImageInfo({
        identifier: 'identifier-version-1.0',
        width: 2000,
        height: 1500,
        profile:
          'http://library.stanford.edu/iiif/image-api/compliance.html#level0',
      });
      options = iiifInfo.getTileSourceOptions();

      assert.notEqual(options, undefined);
      assert.notEqual(options, null);
      assert.propertyVal(options, 'version', Versions.VERSION1);
      assert.property(options, 'size');
      assert.isArray(options.size);
      assert.strictEqual(options.size.length, 2);
      assert.strictEqual(options.size[0], 2000);
      assert.strictEqual(options.size[1], 1500);
      assert.strictEqual(options.quality, 'native');
      assert.strictEqual(options.url, undefined);
      assert.strictEqual(options.sizes, undefined);
      assert.strictEqual(options.tileSize, undefined);
      assert.strictEqual(options.format, 'jpg');
      assert.isEmpty(options.supports);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        '@id': 'http://iiif.test/version2/id',
      });
      options = iiifInfo.getTileSourceOptions();

      assert.isObject(options);
      assert.propertyVal(options, 'version', Versions.VERSION2);
      assert.propertyVal(options, 'url', 'http://iiif.test/version2/id');
      assert.propertyVal(options, 'format', 'jpg');
    });

    it('uses preferred options if applicable', function () {
      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        '@id': 'http://iiif.test/version2/id',
        width: 2000,
        height: 1500,
        profile: ['http://iiif.io/api/image/2/level2.json'],
      });
      let options = iiifInfo.getTileSourceOptions({
        quality: 'bitonal',
        format: 'png',
      });
      assert.propertyVal(options, 'quality', 'bitonal');
      assert.propertyVal(options, 'format', 'png');

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        '@id': 'http://iiif.test/version3/id',
        width: 2000,
        height: 1500,
        profile: 'level2',
        extraQualities: ['gray', 'bitonal'],
      });
      options = iiifInfo.getTileSourceOptions({
        quality: 'bitonal',
        format: 'png',
      });
      assert.propertyVal(options, 'quality', 'bitonal');
      assert.propertyVal(options, 'format', 'png');
    });

    it('ignores preferred options that are not supported', function () {
      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        '@id': 'http://iiif.test/version2/id',
        width: 2000,
        height: 1500,
        profile: ['http://iiif.io/api/image/2/level1.json'],
      });
      let options = iiifInfo.getTileSourceOptions({
        quality: 'bitonal',
        format: 'png',
      });
      assert.propertyVal(options, 'quality', 'default');
      assert.propertyVal(options, 'format', 'jpg');

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        '@id': 'http://iiif.test/version3/id',
        width: 2000,
        height: 1500,
        profile: 'level1',
      });
      options = iiifInfo.getTileSourceOptions({
        quality: 'bitonal',
        format: 'png',
      });
      assert.propertyVal(options, 'quality', 'default');
      assert.propertyVal(options, 'format', 'jpg');
    });

    it('combines supported features indicated by compliance level and explicitly stated in image info', function () {
      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        '@id': 'http://iiif.test/id',
        profile: [
          'http://iiif.io/api/image/2/level1.json',
          {
            supports: ['regionByPct', 'sizeByWh'],
          },
        ],
      });

      let options = iiifInfo.getTileSourceOptions();
      assert.include(options.supports, 'regionByPct');
      assert.include(options.supports, 'sizeByWh');
      assert.include(options.supports, 'regionByPx');
      assert.include(options.supports, 'sizeByW');
      assert.include(options.supports, 'sizeByH');
      assert.include(options.supports, 'sizeByPct');
      assert.lengthOf(options.supports, 6);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        id: 'http://iiif.test/id',
        profile: 'level1',
        extraFeatures: ['regionByPct', 'sizeByPct'],
      });

      options = iiifInfo.getTileSourceOptions();
      assert.include(options.supports, 'regionByPct');
      assert.include(options.supports, 'sizeByPct');
      assert.include(options.supports, 'regionByPx');
      assert.include(options.supports, 'regionSquare');
      assert.include(options.supports, 'sizeByW');
      assert.include(options.supports, 'sizeByH');
      assert.include(options.supports, 'sizeByWh');
      assert.lengthOf(options.supports, 7);
    });

    it('uses the first available scale factors and tile sizes', function () {
      iiifInfo.setImageInfo({
        '@context':
          'http://library.stanford.edu/iiif/image-api/1.1/context.json',
        '@id': 'http://iiif.test/id',
        profile:
          'http://library.stanford.edu/iiif/image-api/compliance.html#level0',
      });
      let options = iiifInfo.getTileSourceOptions();
      assert.strictEqual(options.resolutions, undefined);
      assert.strictEqual(options.tileSize, undefined);

      iiifInfo.setImageInfo({
        '@context':
          'http://library.stanford.edu/iiif/image-api/1.1/context.json',
        '@id': 'http://iiif.test/id',
        profile:
          'http://library.stanford.edu/iiif/image-api/compliance.html#level0',
        scale_factors: [1, 2, 4],
        tile_width: 512,
      });
      options = iiifInfo.getTileSourceOptions();
      assert.lengthOf(options.resolutions, 3);
      assert.include(options.resolutions, 1);
      assert.include(options.resolutions, 2);
      assert.include(options.resolutions, 4);
      assert.lengthOf(options.tileSize, 2);
      assert.strictEqual(options.tileSize[0], 512);
      assert.strictEqual(options.tileSize[1], 512);

      iiifInfo.setImageInfo({
        '@context':
          'http://library.stanford.edu/iiif/image-api/1.1/context.json',
        '@id': 'http://iiif.test/id',
        profile:
          'http://library.stanford.edu/iiif/image-api/compliance.html#level0',
        scale_factors: [1, 2, 4],
        tile_width: 512,
        tile_height: 1024,
      });
      options = iiifInfo.getTileSourceOptions();
      assert.lengthOf(options.resolutions, 3);
      assert.include(options.resolutions, 1);
      assert.include(options.resolutions, 2);
      assert.include(options.resolutions, 4);
      assert.lengthOf(options.tileSize, 2);
      assert.strictEqual(options.tileSize[0], 512);
      assert.strictEqual(options.tileSize[1], 1024);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        '@id': 'http://iiif.test/id',
        profile: 'http://iiif.io/api/image/2/level0.json',
      });
      options = iiifInfo.getTileSourceOptions();
      assert.strictEqual(options.resolutions, undefined);
      assert.strictEqual(options.tileSize, undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        '@id': 'http://iiif.test/id',
        profile: 'http://iiif.io/api/image/2/level0.json',
        tiles: [
          {
            scaleFactors: [1, 2, 4],
            width: 512,
          },
          {
            scaleFactors: [1, 2, 4, 8, 16],
            width: 256,
          },
        ],
      });
      options = iiifInfo.getTileSourceOptions();
      assert.lengthOf(options.resolutions, 3);
      assert.include(options.resolutions, 1);
      assert.include(options.resolutions, 2);
      assert.include(options.resolutions, 4);
      assert.lengthOf(options.tileSize, 2);
      assert.strictEqual(options.tileSize[0], 512);
      assert.strictEqual(options.tileSize[1], 512);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        '@id': 'http://iiif.test/id',
        profile: 'http://iiif.io/api/image/2/level0.json',
        tiles: [
          {
            scaleFactors: [1, 2, 4],
            width: 512,
            height: 1024,
          },
        ],
      });
      options = iiifInfo.getTileSourceOptions();
      assert.lengthOf(options.resolutions, 3);
      assert.include(options.resolutions, 1);
      assert.include(options.resolutions, 2);
      assert.include(options.resolutions, 4);
      assert.lengthOf(options.tileSize, 2);
      assert.strictEqual(options.tileSize[0], 512);
      assert.strictEqual(options.tileSize[1], 1024);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        '@id': 'http://iiif.test/id',
        profile: 'level0',
        tiles: [
          {
            scaleFactors: [1, 2, 4, 8],
            width: 512,
            height: 256,
          },
        ],
      });
      options = iiifInfo.getTileSourceOptions();
      assert.lengthOf(options.resolutions, 4);
      assert.include(options.resolutions, 1);
      assert.include(options.resolutions, 2);
      assert.include(options.resolutions, 4);
      assert.include(options.resolutions, 8);
      assert.lengthOf(options.tileSize, 2);
      assert.strictEqual(options.tileSize[0], 512);
      assert.strictEqual(options.tileSize[1], 256);
    });
  });

  it('provides each given size in sizes as OpenLayers Size', function () {
    iiifInfo.setImageInfo({
      '@context': 'http://iiif.io/api/image/2/context.json',
      '@id': 'http://iiif.test/id',
      'sizes': [
        {
          width: 2000,
          height: 1000,
        },
        {
          width: 1000,
          height: 500,
        },
        {
          width: 500,
          height: 250,
        },
      ],
    });
    let options = iiifInfo.getTileSourceOptions();
    assert.lengthOf(options.sizes, 3);
    assert.lengthOf(options.sizes[0], 2);
    assert.strictEqual(options.sizes[0][0], 2000);
    assert.strictEqual(options.sizes[0][1], 1000);
    assert.lengthOf(options.sizes[1], 2);
    assert.strictEqual(options.sizes[1][0], 1000);
    assert.strictEqual(options.sizes[1][1], 500);
    assert.lengthOf(options.sizes[2], 2);
    assert.strictEqual(options.sizes[2][0], 500);
    assert.strictEqual(options.sizes[2][1], 250);

    iiifInfo.setImageInfo({
      '@context': 'http://iiif.io/api/image/3/context.json',
      '@id': 'http://iiif.test/id',
      'sizes': [
        {
          width: 1500,
          height: 800,
        },
      ],
    });
    options = iiifInfo.getTileSourceOptions();
    assert.lengthOf(options.sizes, 1);
    assert.lengthOf(options.sizes[0], 2);
    assert.strictEqual(options.sizes[0][0], 1500);
    assert.strictEqual(options.sizes[0][1], 800);
  });

  it('respects the preferred image formats', function () {
    iiifInfo.setImageInfo({
      '@context': 'http://iiif.io/api/image/3/context.json',
      'id': 'http://iiif.test/id',
      'profile': 'level0',
      'preferredFormats': ['png', 'gif'],
    });
    let options = iiifInfo.getTileSourceOptions();
    assert.strictEqual(options.format, 'jpg');

    iiifInfo.setImageInfo({
      '@context': 'http://iiif.io/api/image/3/context.json',
      'id': 'http://iiif.test/id',
      'profile': 'level1',
      'preferredFormats': ['png', 'gif'],
    });
    options = iiifInfo.getTileSourceOptions();
    assert.strictEqual(options.format, 'jpg');

    iiifInfo.setImageInfo({
      '@context': 'http://iiif.io/api/image/3/context.json',
      'id': 'http://iiif.test/id',
      'profile': 'level1',
      'extraFormats': ['webp', 'gif'],
      'preferredFormats': ['webp', 'png', 'gif'],
    });
    options = iiifInfo.getTileSourceOptions();
    assert.strictEqual(options.format, 'gif');

    iiifInfo.setImageInfo({
      '@context': 'http://iiif.io/api/image/3/context.json',
      'id': 'http://iiif.test/id',
      'profile': 'level2',
      'preferredFormats': ['png', 'gif'],
    });
    options = iiifInfo.getTileSourceOptions();
    assert.strictEqual(options.format, 'png');
  });
});
