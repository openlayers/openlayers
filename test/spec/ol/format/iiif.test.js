import IIIFInfo from '../../../../src/ol/format/IIIFInfo.js';
import {Versions} from '../../../../src/ol/format/IIIFInfo.js';

describe('ol.format.IIIF', function() {

  const iiifInfo = new IIIFInfo(),
      imageInfoVersion1_0Level0 = {
        identifier: 'identifier-version-1.0',
        width: 2000,
        height: 1500,
        profile: 'http://library.stanford.edu/iiif/image-api/compliance.html#level0'
      },
      imageInfoVersion2Level1 = {
        '@context': 'http://iiif.io/api/image/2/context.json',
        '@id': 'http://iiif.test/version2/id',
        width: 2000,
        height: 1500,
        profile: [
          'http://iiif.io/api/image/2/level1.json'
        ]
      },
      imageInfoVersion2Level2 = {
        '@context': 'http://iiif.io/api/image/2/context.json',
        '@id': 'http://iiif.test/version2/id',
        width: 2000,
        height: 1500,
        profile: [
          'http://iiif.io/api/image/2/level2.json'
        ]
      };

  describe('constructor', function() {

  });

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
        'identifier': 'http://iiif.test/id',
        'profile': 'this is no valid profile'
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
        'identifier': 'http://iiif.test/id',
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
        'identifier': 'http://iiif.test/id'
      });
      expect(iiifInfo.getImageApiVersion()).to.be(Versions.VERSION1);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        '@id': 'http://iiif.test/id'
      });
      expect(iiifInfo.getImageApiVersion()).to.be(Versions.VERSION2);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        'id': 'http://iiif.test/id'
      });
      expect(iiifInfo.getImageApiVersion()).to.be(Versions.VERSION3);

    });

  });

  describe('getComplianceLevelFromProfile', function() {

    it('detects the correct compliance level', function() {

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        'profile': 'level0'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).to.be(undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        'profile': 'http://iiif.io/api/image/level3.json'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).to.be(undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        'profile': 'level1'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).to.be(undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        'profile': 'http://iiif.io/api/image/2/level2.json'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).to.be('level2');

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/2/context.json',
        'profile': ['http://iiif.io/api/image/2/level1.json']
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).to.be('level1');

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        'profile': 'level4'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).to.be(undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        'profile': 'http://iiif.io/api/image/3/level3.json'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).to.be(undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        'profile': 'http://iiif.io/api/image/2/level1.json'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).to.be(undefined);

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        'profile': 'level2'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).to.be('level2');

      iiifInfo.setImageInfo({
        '@context': 'http://iiif.io/api/image/3/context.json',
        'profile': 'http://iiif.io/api/image/3/level1.json'
      });
      expect(iiifInfo.getComplianceLevelFromProfile()).to.be('level1');
    });

  });

  describe('getComplianceLevelSupportedFeatures', function() {

    it('provides the correct features for given versions and compliance levels', function() {

      iiifInfo.setImageInfo({
        '@context': 'http://library.stanford.edu/iiif/image-api/1.1/context.json',
        'profile': 'http://library.stanford.edu/iiif/image-api/compliance.html#level0'
      });
      expect();

    });

  });

  describe('getTileSourceOptions', function() {

    it('produces options from minimal information responses', function() {

      let imageInfo = {
        width: 2000,
        height: 1500
      };

      expect(function() {
        iiifInfo.setImageInfo(imageInfo);
        iiifInfo.getTileSourceOptions();
      }).to.throwException();

      imageInfo = {
        identifier: 'id',
        profile: 'http://library.stanford.edu/iiif/image-api/compliance.html#level0'
      };

      iiifInfo.setImageInfo(imageInfo);
      let options = iiifInfo.getTileSourceOptions(imageInfo);

      expect(options).to.be.an('object');
      expect(options).to.have.property('version', Versions.VERSION1);

      iiifInfo.setImageInfo(imageInfoVersion1_0Level0);
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

      imageInfo = {
        '@context': 'http://iiif.io/api/image/2/context.json',
        '@id': 'http://iiif.test/version2/id'
      };
      iiifInfo.setImageInfo(imageInfo);
      options = iiifInfo.getTileSourceOptions();

      expect(options).to.be.an('object');
      expect(options).to.have.property('version', Versions.VERSION2);
      expect(options).to.have.property('url', 'http://iiif.test/version2/id');
      expect(options).to.have.property('format', 'jpg');

    });

    it('uses preferred options if applicable', function() {

      iiifInfo.setImageInfo(imageInfoVersion2Level2);
      const options = iiifInfo.getTileSourceOptions({
        quality: 'bitonal',
        format: 'png'
      });
      expect(options).to.have.property('quality', 'bitonal');
      expect(options).to.have.property('format', 'png');

    });

    it('ignores preferred options that are not supported', function() {

      iiifInfo.setImageInfo(imageInfoVersion2Level1);
      const options = iiifInfo.getTileSourceOptions({
        quality: 'bitonal',
        format: 'png'
      });
      expect(options).to.have.property('quality', 'default');
      expect(options).to.have.property('format', 'jpg');

    });

  });

});
