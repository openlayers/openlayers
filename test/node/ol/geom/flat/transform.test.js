import {assert} from 'chai';
import MultiPolygon from '../../../../../src/ol/geom/MultiPolygon.js';
import {transformGeom2D} from '../../../../../src/ol/geom/SimpleGeometry.js';
import {rotate, translate} from '../../../../../src/ol/geom/flat/transform.js';

describe('ol/geom/flat/transform.js', function () {
  describe('transform2D', function () {
    it('transforms a Simple Geometry to 2D', function () {
      const multiPolygonGeometry = new MultiPolygon([
        [
          [
            [-80.736061, 28.788576000000006, 0],
            [-80.763557, 28.821799999999996, 0],
            [-80.817406, 28.895123999999996, 0],
            [-80.891304, 29.013130000000004, 0],
            [-80.916512, 29.071560000000005, 0],
            [-80.899323, 29.061249000000004, 0],
            [-80.862663, 28.991361999999995, 0],
            [-80.736061, 28.788576000000006, 0],
          ],
        ],
        [
          [
            [-82.102127, 26.585724, 0],
            [-82.067139, 26.497208, 0],
            [-82.097641, 26.493585999999993, 0],
            [-82.135895, 26.642279000000002, 0],
            [-82.183495, 26.683082999999996, 0],
            [-82.128838, 26.693342, 0],
            [-82.102127, 26.585724, 0],
          ],
        ],
      ]).transform('EPSG:4326', 'EPSG:3857');
      const transform = [
        0.0004088332670837288, 0, 0, -0.0004088332670837288, 4480.991370439071,
        1529.5752568707105,
      ];
      const pixelCoordinates = transformGeom2D(
        multiPolygonGeometry,
        transform,
        [],
      );
      assert.approximately(pixelCoordinates[0], 806.6035275946265, 1e-9);
      assert.approximately(pixelCoordinates[1], 160.48916296287916, 1e-9);
      assert.approximately(pixelCoordinates[2], 805.3521540835154, 1e-9);
      assert.approximately(pixelCoordinates[3], 158.76358389011807, 1e-9);
      assert.approximately(pixelCoordinates[4], 802.9014262612932, 1e-9);
      assert.approximately(pixelCoordinates[5], 154.95335187132082, 1e-9);
      assert.approximately(pixelCoordinates[6], 799.5382461724039, 1e-9);
      assert.approximately(pixelCoordinates[7], 148.815592819916, 1e-9);
      assert.approximately(pixelCoordinates[8], 798.3910020835165, 1e-9);
      assert.approximately(pixelCoordinates[9], 145.77392230456553, 1e-9);
      assert.approximately(pixelCoordinates[10], 799.1732925724045, 1e-9);
      assert.approximately(pixelCoordinates[11], 146.31080369865776, 1e-9);
      assert.approximately(pixelCoordinates[12], 800.8417299057378, 1e-9);
      assert.approximately(pixelCoordinates[13], 149.94832216046188, 1e-9);
      assert.approximately(pixelCoordinates[14], 806.6035275946265, 1e-9);
      assert.approximately(pixelCoordinates[15], 160.48916296287916, 1e-9);
      assert.approximately(pixelCoordinates[16], 744.4323460835158, 1e-9);
      assert.approximately(pixelCoordinates[17], 273.7179168205373, 1e-9);
      assert.approximately(pixelCoordinates[18], 746.0246888390716, 1e-9);
      assert.approximately(pixelCoordinates[19], 278.22094795365365, 1e-9);
      assert.approximately(pixelCoordinates[20], 744.6365089279602, 1e-9);
      assert.approximately(pixelCoordinates[21], 278.40513424671826, 1e-9);
      assert.approximately(pixelCoordinates[22], 742.8955268835157, 1e-9);
      assert.approximately(pixelCoordinates[23], 270.83899948444764, 1e-9);
      assert.approximately(pixelCoordinates[24], 740.7291979946272, 1e-9);
      assert.approximately(pixelCoordinates[25], 268.76099731369345, 1e-9);
      assert.approximately(pixelCoordinates[26], 743.2166987946266, 1e-9);
      assert.approximately(pixelCoordinates[27], 268.23842607400616, 1e-9);
      assert.approximately(pixelCoordinates[28], 744.4323460835158, 1e-9);
      assert.approximately(pixelCoordinates[29], 273.7179168205373, 1e-9);
    });
  });

  describe('translate', function () {
    it('translates the coordinates array', function () {
      const multiPolygon = new MultiPolygon([
        [
          [
            [0, 0, 2],
            [0, 1, 2],
            [1, 1, 2],
            [1, 0, 2],
            [0, 0, 2],
          ],
        ],
        [
          [
            [2, 2, 3],
            [2, 3, 3],
            [3, 3, 3],
            [3, 2, 3],
            [2, 2, 3],
          ],
        ],
      ]);
      const flatCoordinates = multiPolygon.getFlatCoordinates();
      const deltaX = 1;
      const deltaY = 2;
      translate(
        flatCoordinates,
        0,
        flatCoordinates.length,
        multiPolygon.getStride(),
        deltaX,
        deltaY,
        flatCoordinates,
      );
      assert.deepEqual(
        flatCoordinates,
        [
          1, 2, 2, 1, 3, 2, 2, 3, 2, 2, 2, 2, 1, 2, 2, 3, 4, 3, 3, 5, 3, 4, 5,
          3, 4, 4, 3, 3, 4, 3,
        ],
      );
    });
  });

  describe('rotate', function () {
    it('rotates the coordinates array', function () {
      const multiPolygon = new MultiPolygon([
        [
          [
            [0, 0, 2],
            [0, 1, 2],
            [1, 1, 2],
            [1, 0, 2],
            [0, 0, 2],
          ],
        ],
        [
          [
            [2, 2, 3],
            [2, 3, 3],
            [3, 3, 3],
            [3, 2, 3],
            [2, 2, 3],
          ],
        ],
      ]);
      const flatCoordinates = multiPolygon.getFlatCoordinates();
      const angle = Math.PI / 2;
      const anchor = [0, 1];
      rotate(
        flatCoordinates,
        0,
        flatCoordinates.length,
        multiPolygon.getStride(),
        angle,
        anchor,
        flatCoordinates,
      );
      assert.approximately(flatCoordinates[0], 1, 1e-9);
      assert.approximately(flatCoordinates[1], 1, 1e-9);
      assert.approximately(flatCoordinates[2], 2, 1e-9);
      assert.approximately(flatCoordinates[3], 0, 1e-9);
      assert.approximately(flatCoordinates[4], 1, 1e-9);
      assert.approximately(flatCoordinates[5], 2, 1e-9);
      assert.approximately(flatCoordinates[6], Math.cos(angle), 1e-9);
      assert.approximately(flatCoordinates[7], 2, 1e-9);
      assert.approximately(flatCoordinates[8], 2, 1e-9);
      assert.approximately(flatCoordinates[9], 1, 1e-9);
      assert.approximately(flatCoordinates[10], 2, 1e-9);
      assert.approximately(flatCoordinates[11], 2, 1e-9);
      assert.approximately(flatCoordinates[12], 1, 1e-9);
      assert.approximately(flatCoordinates[13], 1, 1e-9);
      assert.approximately(flatCoordinates[14], 2, 1e-9);
      assert.approximately(flatCoordinates[15], -1, 1e-9);
      assert.approximately(flatCoordinates[16], 3, 1e-9);
      assert.approximately(flatCoordinates[17], 3, 1e-9);
      assert.approximately(flatCoordinates[18], -2, 1e-9);
      assert.approximately(flatCoordinates[19], 3, 1e-9);
      assert.approximately(flatCoordinates[20], 3, 1e-9);
      assert.approximately(flatCoordinates[21], -2, 1e-9);
      assert.approximately(flatCoordinates[22], 4, 1e-9);
      assert.approximately(flatCoordinates[23], 3, 1e-9);
      assert.approximately(flatCoordinates[24], -1, 1e-9);
      assert.approximately(flatCoordinates[25], 4, 1e-9);
      assert.approximately(flatCoordinates[26], 3, 1e-9);
      assert.approximately(flatCoordinates[27], -1, 1e-9);
      assert.approximately(flatCoordinates[28], 3, 1e-9);
      assert.approximately(flatCoordinates[29], 3, 1e-9);
    });
  });
});
