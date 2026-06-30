import {assert} from 'chai';
import WMTSCapabilities from '../../../../../src/ol/format/WMTSCapabilities.js';
import {createFromCapabilitiesMatrixSet} from '../../../../../src/ol/tilegrid/WMTS.js';

describe('ol.tilegrid.WMTS', function () {
  describe('when creating tileGrid from capabilities', function () {
    const parser = new WMTSCapabilities();
    let capabilities;
    beforeAll(
      () =>
        new Promise((resolve, reject) => {
          afterLoadText('spec/ol/format/wmts/ogcsample.xml', function (xml) {
            try {
              capabilities = parser.read(xml);
            } catch (e) {
              reject(e);
              return;
            }
            resolve();
          });
        }),
    );

    it('can create tileGrid for EPSG:3857', function () {
      const matrixSetObj = capabilities.Contents.TileMatrixSet[0];
      const tileGrid = createFromCapabilitiesMatrixSet(matrixSetObj);
      assert.isArray(tileGrid.matrixIds_);
      assert.lengthOf(tileGrid.matrixIds_, 20);
      assert.deepEqual(tileGrid.matrixIds_, [
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

      assert.isArray(tileGrid.resolutions_);
      assert.lengthOf(tileGrid.resolutions_, 20);
      assert.deepEqual(
        tileGrid.resolutions_,
        [
          156543.03392811998, 78271.51696419998, 39135.758481959994,
          19567.879241008, 9783.939620504, 4891.969810252, 2445.984905126,
          1222.9924525644, 611.4962262807999, 305.74811314039994,
          152.87405657047998, 76.43702828523999, 38.21851414248,
          19.109257071295996, 9.554628535647998, 4.777314267823999,
          2.3886571339119995, 1.1943285669559998, 0.5971642834779999,
          0.29858214174039993,
        ],
      );

      assert.isArray(tileGrid.origins_);
      assert.lengthOf(tileGrid.origins_, 20);
      assert.deepEqual(
        tileGrid.origins_,
        Array.apply(null, Array(20)).map(
          Array.prototype.valueOf,
          [-20037508.3428, 20037508.3428],
        ),
      );

      assert.isArray(tileGrid.tileSizes_);
      assert.lengthOf(tileGrid.tileSizes_, 20);
      assert.deepEqual(
        tileGrid.tileSizes_,
        Array.apply(null, Array(20)).map(Number.prototype.valueOf, 256),
      );
    });
  });

  describe('when creating tileGrid from capabilities with and without TileMatrixSetLimits', function () {
    const parser = new WMTSCapabilities();
    let capabilities;
    beforeAll(
      () =>
        new Promise((resolve, reject) => {
          afterLoadText('spec/ol/format/wmts/ign.xml', function (xml) {
            try {
              capabilities = parser.read(xml);
            } catch (e) {
              reject(e);
              return;
            }
            resolve();
          });
        }),
    );

    it('can create tileGrid for EPSG:3857 without matrixLimits', function () {
      const matrixSetObj = capabilities.Contents.TileMatrixSet[0];
      const tileGrid = createFromCapabilitiesMatrixSet(matrixSetObj);
      assert.isArray(tileGrid.matrixIds_);
      assert.lengthOf(tileGrid.matrixIds_, 22);
      assert.deepEqual(tileGrid.matrixIds_, [
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

      assert.isArray(tileGrid.resolutions_);
      assert.lengthOf(tileGrid.resolutions_, 22);
      assert.deepEqual(
        tileGrid.resolutions_,
        [
          156543.033928041, 78271.51696402048, 39135.758482010235,
          19567.87924100512, 9783.93962050256, 4891.96981025128,
          2445.98490512564, 1222.99245256282, 611.49622628141,
          305.7481131407048, 152.8740565703525, 76.43702828517624,
          38.21851414258813, 19.10925707129406, 9.554628535647032,
          4.777314267823516, 2.388657133911758, 1.194328566955879,
          0.5971642834779395, 0.2985821417389697, 0.1492910708694849,
          0.0746455354347424,
        ],
      );

      assert.isArray(tileGrid.origins_);
      assert.lengthOf(tileGrid.origins_, 22);
      assert.deepEqual(
        tileGrid.origins_,
        Array.apply(null, Array(22)).map(
          Array.prototype.valueOf,
          [-20037508, 20037508],
        ),
      );

      assert.isArray(tileGrid.tileSizes_);
      assert.lengthOf(tileGrid.tileSizes_, 22);
      assert.deepEqual(
        tileGrid.tileSizes_,
        Array.apply(null, Array(22)).map(Number.prototype.valueOf, 256),
      );

      // Without limits, full matrix ranges start at [0, 0]
      const r0 = tileGrid.getFullTileRange(0);
      assert.equal(r0.minX, 0);
      assert.equal(r0.minY, 0);
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
      assert.isArray(tileGrid.matrixIds_);
      assert.lengthOf(tileGrid.matrixIds_, 20);
      assert.deepEqual(tileGrid.matrixIds_, [
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

      assert.isArray(tileGrid.resolutions_);
      assert.lengthOf(tileGrid.resolutions_, 20);
      assert.deepEqual(
        tileGrid.resolutions_,
        [
          156543.033928041, 78271.51696402048, 39135.758482010235,
          19567.87924100512, 9783.93962050256, 4891.96981025128,
          2445.98490512564, 1222.99245256282, 611.49622628141,
          305.7481131407048, 152.8740565703525, 76.43702828517624,
          38.21851414258813, 19.10925707129406, 9.554628535647032,
          4.777314267823516, 2.388657133911758, 1.194328566955879,
          0.5971642834779395, 0.2985821417389697,
        ],
      );

      assert.isArray(tileGrid.origins_);
      assert.lengthOf(tileGrid.origins_, 20);
      assert.deepEqual(
        tileGrid.origins_,
        Array.apply(null, Array(20)).map(
          Array.prototype.valueOf,
          [-20037508, 20037508],
        ),
      );

      assert.isArray(tileGrid.tileSizes_);
      assert.lengthOf(tileGrid.tileSizes_, 20);
      assert.deepEqual(
        tileGrid.tileSizes_,
        Array.apply(null, Array(20)).map(Number.prototype.valueOf, 256),
      );

      // z=0 → TileMatrix '0': all-zero minimums
      const r0 = tileGrid.getFullTileRange(0);
      assert.equal(r0.minX, 0);
      assert.equal(r0.maxX, 1);
      assert.equal(r0.minY, 0);
      assert.equal(r0.maxY, 1);

      // z=6 → TileMatrix '6': MinTileRow=1 (non-zero row minimum)
      const r6 = tileGrid.getFullTileRange(6);
      assert.equal(r6.minX, 0);
      assert.equal(r6.maxX, 64);
      assert.equal(r6.minY, 1);
      assert.equal(r6.maxY, 64);

      // z=13 → TileMatrix '13': both MinTileRow and MinTileCol non-zero
      const r13 = tileGrid.getFullTileRange(13);
      assert.equal(r13.minX, 41);
      assert.equal(r13.maxX, 7917);
      assert.equal(r13.minY, 2739);
      assert.equal(r13.maxY, 4628);

      // z=19 → TileMatrix '19': large non-zero offsets
      const r19 = tileGrid.getFullTileRange(19);
      assert.equal(r19.minX, 170159);
      assert.equal(r19.maxX, 343473);
      assert.equal(r19.minY, 175302);
      assert.equal(r19.maxY, 294060);
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
      assert.isArray(tileGrid.matrixIds_);
      assert.lengthOf(tileGrid.matrixIds_, 2);
      assert.deepEqual(tileGrid.matrixIds_, ['0', '1']);

      assert.isArray(tileGrid.resolutions_);
      assert.lengthOf(tileGrid.resolutions_, 2);
      assert.deepEqual(
        tileGrid.resolutions_,
        [156543.033928041, 78271.51696402048],
      );

      assert.isArray(tileGrid.origins_);
      assert.lengthOf(tileGrid.origins_, 2);
      assert.deepEqual(
        tileGrid.origins_,
        Array.apply(null, Array(2)).map(
          Array.prototype.valueOf,
          [-20037508, 20037508],
        ),
      );

      assert.isArray(tileGrid.tileSizes_);
      assert.lengthOf(tileGrid.tileSizes_, 2);
      assert.deepEqual(
        tileGrid.tileSizes_,
        Array.apply(null, Array(2)).map(Number.prototype.valueOf, 256),
      );

      // Prefixed:0 limits
      const r0 = tileGrid.getFullTileRange(0);
      assert.equal(r0.minX, 0);
      assert.equal(r0.maxX, 1);
      assert.equal(r0.minY, 0);
      assert.equal(r0.maxY, 1);

      // Prefixed:1 limits
      const r1 = tileGrid.getFullTileRange(1);
      assert.equal(r1.minX, 0);
      assert.equal(r1.maxX, 2);
      assert.equal(r1.minY, 0);
      assert.equal(r1.maxY, 2);
    });
  });
});
