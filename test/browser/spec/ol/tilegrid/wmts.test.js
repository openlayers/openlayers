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
          [-20037508.3428, 20037508.3428],
        ),
      );

      expect(tileGrid.tileSizes_).to.be.an('array');
      expect(tileGrid.tileSizes_).to.have.length(20);
      expect(tileGrid.tileSizes_).to.eql(
        Array.apply(null, Array(20)).map(Number.prototype.valueOf, 256),
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
          [-20037508, 20037508],
        ),
      );

      expect(tileGrid.tileSizes_).to.be.an('array');
      expect(tileGrid.tileSizes_).to.have.length(22);
      expect(tileGrid.tileSizes_).to.eql(
        Array.apply(null, Array(22)).map(Number.prototype.valueOf, 256),
      );

      // Without limits, full matrix ranges start at [0, 0]
      const r0 = tileGrid.getFullTileRange(0);
      expect(r0.minX).to.equal(0);
      expect(r0.minY).to.equal(0);
    });

    it('can create tileGrid for EPSG:3857 with matrixLimits', function () {
      const matrixSetObj = capabilities.Contents.TileMatrixSet[0];
      const matrixLimitArray =
        capabilities.Contents.Layer[0].TileMatrixSetLink[0].TileMatrixSetLimits;
      const tileGrid = createFromCapabilitiesMatrixSet(
        matrixSetObj,
        undefined,
        matrixLimitArray,
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
          [-20037508, 20037508],
        ),
      );

      expect(tileGrid.tileSizes_).to.be.an('array');
      expect(tileGrid.tileSizes_).to.have.length(20);
      expect(tileGrid.tileSizes_).to.eql(
        Array.apply(null, Array(20)).map(Number.prototype.valueOf, 256),
      );

      // z=0 → TileMatrix '0': all-zero minimums
      const r0 = tileGrid.getFullTileRange(0);
      expect(r0.minX).to.equal(0);
      expect(r0.maxX).to.equal(1);
      expect(r0.minY).to.equal(0);
      expect(r0.maxY).to.equal(1);

      // z=6 → TileMatrix '6': MinTileRow=1 (non-zero row minimum)
      const r6 = tileGrid.getFullTileRange(6);
      expect(r6.minX).to.equal(0);
      expect(r6.maxX).to.equal(64);
      expect(r6.minY).to.equal(1);
      expect(r6.maxY).to.equal(64);

      // z=13 → TileMatrix '13': both MinTileRow and MinTileCol non-zero
      const r13 = tileGrid.getFullTileRange(13);
      expect(r13.minX).to.equal(41);
      expect(r13.maxX).to.equal(7917);
      expect(r13.minY).to.equal(2739);
      expect(r13.maxY).to.equal(4628);

      // z=19 → TileMatrix '19': large non-zero offsets
      const r19 = tileGrid.getFullTileRange(19);
      expect(r19.minX).to.equal(170159);
      expect(r19.maxX).to.equal(343473);
      expect(r19.minY).to.equal(175302);
      expect(r19.maxY).to.equal(294060);
    });

    it('can use prefixed matrixLimits', function () {
      const matrixSetObj = capabilities.Contents.TileMatrixSet[1];
      const matrixLimitArray =
        capabilities.Contents.Layer[0].TileMatrixSetLink[1].TileMatrixSetLimits;
      const tileGrid = createFromCapabilitiesMatrixSet(
        matrixSetObj,
        undefined,
        matrixLimitArray,
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
          [-20037508, 20037508],
        ),
      );

      expect(tileGrid.tileSizes_).to.be.an('array');
      expect(tileGrid.tileSizes_).to.have.length(2);
      expect(tileGrid.tileSizes_).to.eql(
        Array.apply(null, Array(2)).map(Number.prototype.valueOf, 256),
      );

      // Prefixed:0 limits
      const r0 = tileGrid.getFullTileRange(0);
      expect(r0.minX).to.equal(0);
      expect(r0.maxX).to.equal(1);
      expect(r0.minY).to.equal(0);
      expect(r0.maxY).to.equal(1);

      // Prefixed:1 limits
      const r1 = tileGrid.getFullTileRange(1);
      expect(r1.minX).to.equal(0);
      expect(r1.maxX).to.equal(2);
      expect(r1.minY).to.equal(0);
      expect(r1.maxY).to.equal(2);
    });
  });
});
