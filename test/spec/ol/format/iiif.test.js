import IIIFInfo from '../../../../src/ol/format/IIIFInfo.js';
import {Versions} from '../../../../src/ol/format/IIIFInfo.js';

describe('ol.format.IIIFInfo', function() {

  const iiifInfo = new IIIFInfo();

  describe('setImageInfo', function() {

    it('can handle image info JSON as object or as string serialization', function() {

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        '@id': 'http://iiif.test/id'
      });
      expect(iiifInfo.getImageApiVersion()).to.be(Versions.VERSION3);

      iiifInfo.setImageInfo('{"@context": "http://iiif.io/api/image/2/context.json","@id":"http://iiif.test/id"}');
      expect(iiifInfo.getImageApiVersion()).to.be(Versions.VERSION2);

    });

  });

  describe('getImageApiVersion', function() {

    it('provides the correct Image API version', function() {

      iiifInfo.setImageInfo({
        '@id': 'http://iiif.test/id'
      });
      expect(function() {
        iiifInfo.getImageApiVersion();
      }).to.throwException();

      iiifInfo.setImageInfo({
        identifier: 'http://iiif.test/id',
        profile: 'this is no valid profile'
      });
      expect(function() {
        iiifInfo.getImageApiVersion();
      }).to.throwException();

      iiifInfo.setImageInfo({
        '@context': 'this is no valid context',
        '@id': 'http://iiif.test/id'
      });
      expect(function() {
        iiifInfo.getImageApiVersion();
      }).to.throwException();

      iiifInfo.setImageInfo({
        identifier: 'http://iiif.test/id',
        profile: 'http://library.stanford.edu/iiif/image-api/compliance.html#level0'
      });
      expect(iiifInfo.getImageApiVersion()).to.be(Versions.VERSION1);

      iiifInfo.setImageInfo({
        '@context': 'http://library.stanford.edu/iiif/image-api/1.1/context.json',
        '@id': 'http://iiif.test/id'
      });
      expect(iiifInfo.getImageApiVersion()).to.be(Versions.VERSION1);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/1/context.json',
        identifier: 'http://iiif.test/id'
      });
      expect(iiifInfo.getImageApiVersion()).to.be(Versions.VERSION1);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        '@id': 'http://iiif.test/id'
      });
      expect(iiifInfo.getImageApiVersion()).to.be(Versions.VERSION2);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        id: 'http://iiif.test/id'
      });
      expect(iiifInfo.getImageApiVersion()).to.be(Versions.VERSION3);

    });

  });

  describe('getComplianceLevelFromProfile', function() {

    it('detects the correct compliance level', function() {

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        profile: 'level0'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).to.be(undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        profile: 'http://iiif.io/api/image/level3.json'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).to.be(undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        profile: 'level1'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).to.be(undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        profile: 'http://iiif.io/api/image/2/level2.json'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).to.be('level2');

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        profile: ['http://iiif.io/api/image/2/level1.json']
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).to.be('level1');

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        profile: 'level4'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).to.be(undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        profile: 'http://iiif.io/api/image/3/level3.json'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).to.be(undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        profile: 'http://iiif.io/api/image/2/level1.json'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).to.be(undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        profile: 'level2'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).to.be('level2');

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        profile: 'http://iiif.io/api/image/3/level1.json'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).to.be('level1');
    });

  });

  describe('getComplianceLevelSupportedFeatures', function() {

    it('provides the correct features for given versions and compliance levels', function() {

      iiifInfo.setImageInfo({
        '@context': 'http://library.stanford.edu/iiif/image-api/1.1/context.json',
        profile: 'http://library.stanford.edu/iiif/image-api/compliance.html#level0'
      });
      let level = iiifInfo.getComplianceLevelSupportedFeatures();
      expect(level.supports).to.be.empty();

      iiifInfo.setImageInfo({
        '@context': 'http://library.stanford.edu/iiif/image-api/1.1/context.json',
        profile: 'http://library.stanford.edu/iiif/image-api/compliance.html#level1'
      });
      level = iiifInfo.getComplianceLevelSupportedFeatures();
      expect(level.supports).to.have.length(4);
      expect(level.supports).to.contain('regionByPx');
      expect(level.supports).to.contain('sizeByW');
      expect(level.supports).to.contain('sizeByH');
      expect(level.supports).to.contain('sizeByPct');

      iiifInfo.setImageInfo({
        '@context': 'http://library.stanford.edu/iiif/image-api/1.1/context.json',
        profile: 'http://library.stanford.edu/iiif/image-api/compliance.html#level2'
      });
      level = iiifInfo.getComplianceLevelSupportedFeatures();
      expect(level.supports).to.have.length(7);
      expect(level.supports).to.contain('regionByPx');
      expect(level.supports).to.contain('regionByPct');
      expect(level.supports).to.contain('sizeByW');
      expect(level.supports).to.contain('sizeByH');
      expect(level.supports).to.contain('sizeByPct');
      expect(level.supports).to.contain('sizeByConfinedWh');
      expect(level.supports).to.contain('sizeByWh');

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        profile: 'http://iiif.io/api/image/2/level0.json'
      });
      level = iiifInfo.getComplianceLevelSupportedFeatures();
      expect(level.supports).to.be.empty();

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        profile: 'http://iiif.io/api/image/2/level1.json'
      });
      level = iiifInfo.getComplianceLevelSupportedFeatures();
      expect(level.supports).to.have.length(4);
      expect(level.supports).to.contain('regionByPx');
      expect(level.supports).to.contain('sizeByW');
      expect(level.supports).to.contain('sizeByH');
      expect(level.supports).to.contain('sizeByPct');

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        profile: 'http://iiif.io/api/image/2/level2.json'
      });
      level = iiifInfo.getComplianceLevelSupportedFeatures();
      expect(level.supports).to.have.length(8);
      expect(level.supports).to.contain('regionByPx');
      expect(level.supports).to.contain('regionByPct');
      expect(level.supports).to.contain('sizeByW');
      expect(level.supports).to.contain('sizeByH');
      expect(level.supports).to.contain('sizeByPct');
      expect(level.supports).to.contain('sizeByConfinedWh');
      expect(level.supports).to.contain('sizeByDistortedWh');
      expect(level.supports).to.contain('sizeByWh');

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        profile: 'level0'
      });
      level = iiifInfo.getComplianceLevelSupportedFeatures();
      expect(level.supports).to.be.empty();

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        profile: 'level1'
      });
      level = iiifInfo.getComplianceLevelSupportedFeatures();
      expect(level.supports).to.have.length(5);
      expect(level.supports).to.contain('regionByPx');
      expect(level.supports).to.contain('regionSquare');
      expect(level.supports).to.contain('sizeByW');
      expect(level.supports).to.contain('sizeByH');
      expect(level.supports).to.contain('sizeByWh');

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        profile: 'level2'
      });
      level = iiifInfo.getComplianceLevelSupportedFeatures();
      expect(level.supports).to.have.length(8);
      expect(level.supports).to.contain('regionByPx');
      expect(level.supports).to.contain('regionByPct');
      expect(level.supports).to.contain('regionSquare');
      expect(level.supports).to.contain('sizeByW');
      expect(level.supports).to.contain('sizeByH');
      expect(level.supports).to.contain('sizeByWh');
      expect(level.supports).to.contain('sizeByConfinedWh');
      expect(level.supports).to.contain('sizeByPct');

    });

  });

  describe('getTileSourceOptions', function() {

    it('produces options from minimal information responses', function() {

      expect(function() {
        iiifInfo.setImageInfo({
          width: 2000,
          height: 1500
        });
        iiifInfo.getTileSourceOptions();
      }).to.throwException();

      iiifInfo.setImageInfo({
        identifier: 'id',
        profile: 'http://library.stanford.edu/iiif/image-api/compliance.html#level0'
      });
      let options = iiifInfo.getTileSourceOptions();

      expect(options).to.be.an('object');
      expect(options).to.have.property('version', Versions.VERSION1);

      iiifInfo.setImageInfo({
        identifier: 'identifier-version-1.0',
        width: 2000,
        height: 1500,
        profile: 'http://library.stanford.edu/iiif/image-api/compliance.html#level0'
      });
      options = iiifInfo.getTileSourceOptions();

      expect(options).to.not.be(undefined);
      expect(options).to.not.be(null);
      expect(options).to.have.property('version', Versions.VERSION1);
      expect(options).to.have.property('size');
      expect(options.size).to.be.an('array');
      expect(options.size.length).to.be(2);
      expect(options.size[0]).to.be(2000);
      expect(options.size[1]).to.be(1500);
      expect(options.quality).to.be('native');
      expect(options.url).to.be(undefined);
      expect(options.sizes).to.be(undefined);
      expect(options.tileSize).to.be(undefined);
      expect(options.format).to.be('jpg');
      expect(options.supports).to.be.empty();

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        '@id': 'http://iiif.test/version2/id'
      });
      options = iiifInfo.getTileSourceOptions();

      expect(options).to.be.an('object');
      expect(options).to.have.property('version', Versions.VERSION2);
      expect(options).to.have.property('url', 'http://iiif.test/version2/id');
      expect(options).to.have.property('format', 'jpg');

    });

    it('uses preferred options if applicable', function() {

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
      expect(options).to.have.property('quality', 'bitonal');
      expect(options).to.have.property('format', 'png');

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
      expect(options).to.have.property('quality', 'bitonal');
      expect(options).to.have.property('format', 'png');

    });

    it('ignores preferred options that are not supported', function() {

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
      expect(options).to.have.property('quality', 'default');
      expect(options).to.have.property('format', 'jpg');

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
      expect(options).to.have.property('quality', 'default');
      expect(options).to.have.property('format', 'jpg');

    });

    it('combines supported features indicated by compliance level and explicitly stated in image info', function() {

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        '@id': 'http://iiif.test/id',
        profile: ['http://iiif.io/api/image/2/level1.json', {
          supports: ['regionByPct', 'sizeByWh']
        }]
      });

      let options = iiifInfo.getTileSourceOptions();
      expect(options.supports).to.contain('regionByPct');
      expect(options.supports).to.contain('sizeByWh');
      expect(options.supports).to.contain('regionByPx');
      expect(options.supports).to.contain('sizeByW');
      expect(options.supports).to.contain('sizeByH');
      expect(options.supports).to.contain('sizeByPct');
      expect(options.supports).to.have.length(6);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        id: 'http://iiif.test/id',
        profile: 'level1',
        extraFeatures: ['regionByPct', 'sizeByPct']
      });

      options = iiifInfo.getTileSourceOptions();
      expect(options.supports).to.contain('regionByPct');
      expect(options.supports).to.contain('sizeByPct');
      expect(options.supports).to.contain('regionByPx');
      expect(options.supports).to.contain('regionSquare');
      expect(options.supports).to.contain('sizeByW');
      expect(options.supports).to.contain('sizeByH');
      expect(options.supports).to.contain('sizeByWh');
      expect(options.supports).to.have.length(7);

    });

    it('uses the first available scale factors and tile sizes', function() {

      iiifInfo.setImageInfo({
        '@context': 'http://library.stanford.edu/iiif/image-api/1.1/context.json',
        '@id': 'http://iiif.test/id',
        profile: 'http://library.stanford.edu/iiif/image-api/compliance.html#level0'
      });
      let options = iiifInfo.getTileSourceOptions();
      expect(options.resolutions).to.be(undefined);
      expect(options.tileSize).to.be(undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://library.stanford.edu/iiif/image-api/1.1/context.json',
        '@id': 'http://iiif.test/id',
        profile: 'http://library.stanford.edu/iiif/image-api/compliance.html#level0',
        scale_factors: [1, 2, 4],
        tile_width: 512
      });
      options = iiifInfo.getTileSourceOptions();
      expect(options.resolutions).to.have.length(3);
      expect(options.resolutions).to.contain(1);
      expect(options.resolutions).to.contain(2);
      expect(options.resolutions).to.contain(4);
      expect(options.tileSize).to.have.length(2);
      expect(options.tileSize[0]).to.be(512);
      expect(options.tileSize[1]).to.be(512);

      iiifInfo.setImageInfo({
        '@context': 'http://library.stanford.edu/iiif/image-api/1.1/context.json',
        '@id': 'http://iiif.test/id',
        profile: 'http://library.stanford.edu/iiif/image-api/compliance.html#level0',
        scale_factors: [1, 2, 4],
        tile_width: 512,
        tile_height: 1024
      });
      options = iiifInfo.getTileSourceOptions();
      expect(options.resolutions).to.have.length(3);
      expect(options.resolutions).to.contain(1);
      expect(options.resolutions).to.contain(2);
      expect(options.resolutions).to.contain(4);
      expect(options.tileSize).to.have.length(2);
      expect(options.tileSize[0]).to.be(512);
      expect(options.tileSize[1]).to.be(1024);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        '@id': 'http://iiif.test/id',
        profile: 'http://iiif.io/api/image/2/level0.json'
      });
      options = iiifInfo.getTileSourceOptions();
      expect(options.resolutions).to.be(undefined);
      expect(options.tileSize).to.be(undefined);

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
      expect(options.resolutions).to.have.length(3);
      expect(options.resolutions).to.contain(1);
      expect(options.resolutions).to.contain(2);
      expect(options.resolutions).to.contain(4);
      expect(options.tileSize).to.have.length(2);
      expect(options.tileSize[0]).to.be(512);
      expect(options.tileSize[1]).to.be(512);

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
      expect(options.resolutions).to.have.length(3);
      expect(options.resolutions).to.contain(1);
      expect(options.resolutions).to.contain(2);
      expect(options.resolutions).to.contain(4);
      expect(options.tileSize).to.have.length(2);
      expect(options.tileSize[0]).to.be(512);
      expect(options.tileSize[1]).to.be(1024);

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
      expect(options.resolutions).to.have.length(4);
      expect(options.resolutions).to.contain(1);
      expect(options.resolutions).to.contain(2);
      expect(options.resolutions).to.contain(4);
      expect(options.resolutions).to.contain(8);
      expect(options.tileSize).to.have.length(2);
      expect(options.tileSize[0]).to.be(512);
      expect(options.tileSize[1]).to.be(256);

    });

  });

  it('provides each given size in sizes as OpenLayers Size', function() {

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
    expect(options.sizes).to.have.length(3);
    expect(options.sizes[0]).to.have.length(2);
    expect(options.sizes[0][0]).to.be(2000);
    expect(options.sizes[0][1]).to.be(1000);
    expect(options.sizes[1]).to.have.length(2);
    expect(options.sizes[1][0]).to.be(1000);
    expect(options.sizes[1][1]).to.be(500);
    expect(options.sizes[2]).to.have.length(2);
    expect(options.sizes[2][0]).to.be(500);
    expect(options.sizes[2][1]).to.be(250);

    iiifInfo.setImageInfo({
      '@context': 'http://iiif.io/api/image/3/context.json',
      '@id': 'http://iiif.test/id',
      'sizes': [{
        width: 1500,
        height: 800
      }]
    });
    options = iiifInfo.getTileSourceOptions();
    expect(options.sizes).to.have.length(1);
    expect(options.sizes[0]).to.have.length(2);
    expect(options.sizes[0][0]).to.be(1500);
    expect(options.sizes[0][1]).to.be(800);

  });

  it('respects the preferred image formats', function() {

    iiifInfo.setImageInfo({
      '@context': 'http://iiif.io/api/image/3/context.json',
      'id': 'http://iiif.test/id',
      'profile': 'level0',
      'preferredFormats': ['png', 'gif']
    });
    let options = iiifInfo.getTileSourceOptions();
    expect(options.format).to.be('jpg');

    iiifInfo.setImageInfo({
      '@context': 'http://iiif.io/api/image/3/context.json',
      'id': 'http://iiif.test/id',
      'profile': 'level1',
      'preferredFormats': ['png', 'gif']
    });
    options = iiifInfo.getTileSourceOptions();
    expect(options.format).to.be('jpg');

    iiifInfo.setImageInfo({
      '@context': 'http://iiif.io/api/image/3/context.json',
      'id': 'http://iiif.test/id',
      'profile': 'level1',
      'extraFormats': ['webp', 'gif'],
      'preferredFormats': ['webp', 'png', 'gif']
    });
    options = iiifInfo.getTileSourceOptions();
    expect(options.format).to.be('gif');

    iiifInfo.setImageInfo({
      '@context': 'http://iiif.io/api/image/3/context.json',
      'id': 'http://iiif.test/id',
      'profile': 'level2',
      'preferredFormats': ['png', 'gif']
    });
    options = iiifInfo.getTileSourceOptions();
    expect(options.format).to.be('png');

  });


});
