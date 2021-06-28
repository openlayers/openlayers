import WMTSCapabilities from '../../../../../src/ol/format/WMTSCapabilities.js';
import {createFromCapabilitiesMatrixSet} from '../../../../../src/ol/tilegrid/WMTS.js';

describe('ol.tilegrid.WMTS', function () {
  describe('when creating tileGrid from capabilities', function () {
    const parser = new WMTSCapabilities();
    let capabilities;
    before(function (done) {
      afterLoadText('spec/ol/format/wmts/ogcsample.xml', function (xml) {
        try {
          capabilities = parser.read(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('can create tileGrid for EPSG:3857', function () {
      const matrixSetObj = capabilities.Contents.TileMatrixSet[0];
      const tileGrid = createFromCapabilitiesMatrixSet(matrixSetObj);
      expect(tileGrid.matrixIds_).to.be.an('array');
      expect(tileGrid.matrixIds_).to.have.length(20);
      expect(tileGrid.matrixIds_).to.eql([
        '0',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
        '13',
        '14',
        '15',
        '16',
        '17',
        '18',
        '19',
      ]);

      expect(tileGrid.resolutions_).to.be.an('array');
      expect(tileGrid.resolutions_).to.have.length(20);
      expect(tileGrid.resolutions_).to.eql([
        156543.03392811998, 78271.51696419998, 39135.758481959994,
        19567.879241008, 9783.939620504, 4891.969810252, 2445.984905126,
        1222.9924525644, 611.4962262807999, 305.74811314039994,
        152.87405657047998, 76.43702828523999, 38.21851414248,
        19.109257071295996, 9.554628535647998, 4.777314267823999,
        2.3886571339119995, 1.1943285669559998, 0.5971642834779999,
        0.29858214174039993,
      ]);

      expect(tileGrid.origins_).to.be.an('array');
      expect(tileGrid.origins_).to.have.length(20);
      expect(tileGrid.origins_).to.eql(
        Array.apply(null, Array(20)).map(
          Array.prototype.valueOf,
          [-20037508.3428, 20037508.3428]
        )
      );

      expect(tileGrid.tileSizes_).to.be.an('array');
      expect(tileGrid.tileSizes_).to.have.length(20);
      expect(tileGrid.tileSizes_).to.eql(
        Array.apply(null, Array(20)).map(Number.prototype.valueOf, 256)
      );
    });
  });

  describe('when creating tileGrid from capabilities with and without TileMatrixSetLimits', function () {
    const parser = new WMTSCapabilities();
    let capabilities;
    before(function (done) {
      afterLoadText('spec/ol/format/wmts/ign.xml', function (xml) {
        try {
          capabilities = parser.read(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('can create tileGrid for EPSG:3857 without matrixLimits', function () {
      const matrixSetObj = capabilities.Contents.TileMatrixSet[0];
      const tileGrid = createFromCapabilitiesMatrixSet(matrixSetObj);
      expect(tileGrid.matrixIds_).to.be.an('array');
      expect(tileGrid.matrixIds_).to.have.length(22);
      expect(tileGrid.matrixIds_).to.eql([
        '0',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
        '13',
        '14',
        '15',
        '16',
        '17',
        '18',
        '19',
        '20',
        '21',
      ]);

      expect(tileGrid.resolutions_).to.be.an('array');
      expect(tileGrid.resolutions_).to.have.length(22);
      expect(tileGrid.resolutions_).to.eql([
        156543.033928041, 78271.51696402048, 39135.758482010235,
        19567.87924100512, 9783.93962050256, 4891.96981025128, 2445.98490512564,
        1222.99245256282, 611.49622628141, 305.7481131407048, 152.8740565703525,
        76.43702828517624, 38.21851414258813, 19.10925707129406,
        9.554628535647032, 4.777314267823516, 2.388657133911758,
        1.194328566955879, 0.5971642834779395, 0.2985821417389697,
        0.1492910708694849, 0.0746455354347424,
      ]);

      expect(tileGrid.origins_).to.be.an('array');
      expect(tileGrid.origins_).to.have.length(22);
      expect(tileGrid.origins_).to.eql(
        Array.apply(null, Array(22)).map(
          Array.prototype.valueOf,
          [-20037508, 20037508]
        )
      );

      expect(tileGrid.tileSizes_).to.be.an('array');
      expect(tileGrid.tileSizes_).to.have.length(22);
      expect(tileGrid.tileSizes_).to.eql(
        Array.apply(null, Array(22)).map(Number.prototype.valueOf, 256)
      );
    });

    it('can create tileGrid for EPSG:3857 with matrixLimits', function () {
      const matrixSetObj = capabilities.Contents.TileMatrixSet[0];
      const matrixLimitArray =
        capabilities.Contents.Layer[0].TileMatrixSetLink[0].TileMatrixSetLimits;
      const tileGrid = createFromCapabilitiesMatrixSet(
        matrixSetObj,
        undefined,
        matrixLimitArray
      );
      expect(tileGrid.matrixIds_).to.be.an('array');
      expect(tileGrid.matrixIds_).to.have.length(20);
      expect(tileGrid.matrixIds_).to.eql([
        '0',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
        '13',
        '14',
        '15',
        '16',
        '17',
        '18',
        '19',
      ]);

      expect(tileGrid.resolutions_).to.be.an('array');
      expect(tileGrid.resolutions_).to.have.length(20);
      expect(tileGrid.resolutions_).to.eql([
        156543.033928041, 78271.51696402048, 39135.758482010235,
        19567.87924100512, 9783.93962050256, 4891.96981025128, 2445.98490512564,
        1222.99245256282, 611.49622628141, 305.7481131407048, 152.8740565703525,
        76.43702828517624, 38.21851414258813, 19.10925707129406,
        9.554628535647032, 4.777314267823516, 2.388657133911758,
        1.194328566955879, 0.5971642834779395, 0.2985821417389697,
      ]);

      expect(tileGrid.origins_).to.be.an('array');
      expect(tileGrid.origins_).to.have.length(20);
      expect(tileGrid.origins_).to.eql(
        Array.apply(null, Array(20)).map(
          Array.prototype.valueOf,
          [-20037508, 20037508]
        )
      );

      expect(tileGrid.tileSizes_).to.be.an('array');
      expect(tileGrid.tileSizes_).to.have.length(20);
      expect(tileGrid.tileSizes_).to.eql(
        Array.apply(null, Array(20)).map(Number.prototype.valueOf, 256)
      );
    });

    it('can use prefixed matrixLimits', function () {
      const matrixSetObj = capabilities.Contents.TileMatrixSet[1];
      const matrixLimitArray =
        capabilities.Contents.Layer[0].TileMatrixSetLink[1].TileMatrixSetLimits;
      const tileGrid = createFromCapabilitiesMatrixSet(
        matrixSetObj,
        undefined,
        matrixLimitArray
      );
      expect(tileGrid.matrixIds_).to.be.an('array');
      expect(tileGrid.matrixIds_).to.have.length(2);
      expect(tileGrid.matrixIds_).to.eql(['0', '1']);

      expect(tileGrid.resolutions_).to.be.an('array');
      expect(tileGrid.resolutions_).to.have.length(2);
      expect(tileGrid.resolutions_).to.eql([
        156543.033928041, 78271.51696402048,
      ]);

      expect(tileGrid.origins_).to.be.an('array');
      expect(tileGrid.origins_).to.have.length(2);
      expect(tileGrid.origins_).to.eql(
        Array.apply(null, Array(2)).map(
          Array.prototype.valueOf,
          [-20037508, 20037508]
        )
      );

      expect(tileGrid.tileSizes_).to.be.an('array');
      expect(tileGrid.tileSizes_).to.have.length(2);
      expect(tileGrid.tileSizes_).to.eql(
        Array.apply(null, Array(2)).map(Number.prototype.valueOf, 256)
      );
    });
  });
});
