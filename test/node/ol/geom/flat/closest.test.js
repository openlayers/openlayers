import expect from '../../../expect.js';
import {
  assignClosestPoint,
  maxSquaredDelta,
} from '../../../../../src/ol/geom/flat/closest.js';

describe('ol/geom/flat/closest.js', function () {
  describe('with simple data', function () {
    const flatCoordinates = [0, 0, 1, 0, 3, 0, 5, 0, 6, 0, 8, 0, 11, 0];

    describe('maxSquaredDelta', function () {
      it('returns the expected value in simple cases', function () {
        expect(
          maxSquaredDelta(flatCoordinates, 0, flatCoordinates.length, 2, 0)
        ).to.be(9);
      });
    });

    describe('assignClosestPoint', function () {
      it('returns the expected value', function () {
        const maxDelta = Math.sqrt(
          maxSquaredDelta(flatCoordinates, 0, flatCoordinates.length, 2, 0)
        );
        expect(maxDelta).to.be(3);
        const closestPoint = [NaN, NaN];
        expect(
          assignClosestPoint(
            flatCoordinates,
            0,
            flatCoordinates.length,
            2,
            maxDelta,
            false,
            0,
            0,
            closestPoint,
            Infinity
          )
        ).to.be(0);
        expect(closestPoint).to.eql([0, 0]);
        expect(
          assignClosestPoint(
            flatCoordinates,
            0,
            flatCoordinates.length,
            2,
            maxDelta,
            false,
            4,
            1,
            closestPoint,
            Infinity
          )
        ).to.be(1);
        expect(closestPoint).to.eql([4, 0]);
        expect(
          assignClosestPoint(
            flatCoordinates,
            0,
            flatCoordinates.length,
            2,
            maxDelta,
            false,
            5,
            2,
            closestPoint,
            Infinity
          )
        ).to.be(4);
        expect(closestPoint).to.eql([5, 0]);
        expect(
          assignClosestPoint(
            flatCoordinates,
            0,
            flatCoordinates.length,
            2,
            maxDelta,
            false,
            10,
            100,
            closestPoint,
            Infinity
          )
        ).to.be(10000);
        expect(closestPoint).to.eql([10, 0]);
      });
    });
  });

  describe('with real data', function () {
    const flatCoordinates = [
      224.55, 250.15, 226.91, 244.19, 233.31, 241.45, 234.98, 236.06, 244.21,
      232.76, 262.59, 215.31, 267.76, 213.81, 273.57, 201.84, 273.12, 192.16,
      277.62, 189.03, 280.36, 181.41, 286.51, 177.74, 292.41, 159.37, 296.91,
      155.64, 314.95, 151.37, 319.75, 145.16, 330.33, 137.57, 341.48, 139.96,
      369.98, 137.89, 387.39, 142.51, 391.28, 139.39, 409.52, 141.14, 414.82,
      139.75, 427.72, 127.3, 439.6, 119.74, 474.93, 107.87, 486.51, 106.75,
      489.2, 109.45, 493.79, 108.63, 504.74, 119.66, 512.96, 122.35, 518.63,
      120.89, 524.09, 126.88, 529.57, 127.86, 534.21, 140.93, 539.27, 147.24,
      567.69, 148.91, 575.25, 157.26, 580.62, 158.15, 601.53, 156.85, 617.74,
      159.86, 622.0, 167.04, 629.55, 194.6, 638.9, 195.61, 641.26, 200.81,
      651.77, 204.56, 671.55, 222.55, 683.68, 217.45, 695.25, 219.15, 700.64,
      217.98, 703.12, 214.36, 712.26, 215.87, 721.49, 212.81, 727.81, 213.36,
      729.98, 208.73, 735.32, 208.2, 739.94, 204.77, 769.98, 208.42, 779.6,
      216.87, 784.2, 218.16, 800.24, 214.62, 810.53, 219.73, 817.19, 226.82,
      820.77, 236.17, 827.23, 236.16, 829.89, 239.89, 851.0, 248.94, 859.88,
      255.49, 865.21, 268.53, 857.95, 280.3, 865.48, 291.45, 866.81, 298.66,
      864.68, 302.71, 867.79, 306.17, 859.87, 311.37, 860.08, 314.35, 858.29,
      314.94, 858.1, 327.6, 854.54, 335.4, 860.92, 343.0, 856.43, 350.15,
      851.42, 352.96, 849.84, 359.59, 854.56, 365.53, 849.74, 370.38, 844.09,
      371.89, 844.75, 380.44, 841.52, 383.67, 839.57, 390.4, 845.59, 399.05,
      848.4, 407.55, 843.71, 411.3, 844.09, 419.88, 839.51, 432.76, 841.33,
      441.04, 847.62, 449.22, 847.16, 458.44, 851.38, 462.79, 853.97, 471.15,
      866.36, 480.77,
    ];

    describe('maxSquaredDelta', function () {
      it('returns the expected value', function () {
        expect(
          maxSquaredDelta(flatCoordinates, 0, flatCoordinates.length, 2, 0)
        ).to.roughlyEqual(1389.1058, 1e-9);
      });
    });

    describe('assignClosestPoint', function () {
      it('returns the expected value', function () {
        const maxDelta = Math.sqrt(
          maxSquaredDelta(flatCoordinates, 0, flatCoordinates.length, 2, 0)
        );
        expect(maxDelta).to.roughlyEqual(Math.sqrt(1389.1058), 1e-9);
        const closestPoint = [NaN, NaN];
        expect(
          assignClosestPoint(
            flatCoordinates,
            0,
            flatCoordinates.length,
            2,
            maxDelta,
            false,
            0,
            0,
            closestPoint,
            Infinity
          )
        ).to.roughlyEqual(110902.405, 1e-9);
        expect(closestPoint).to.eql([292.41, 159.37]);
        expect(
          assignClosestPoint(
            flatCoordinates,
            0,
            flatCoordinates.length,
            2,
            maxDelta,
            false,
            500,
            500,
            closestPoint,
            Infinity
          )
        ).to.roughlyEqual(106407.905, 1e-9);
        expect(closestPoint).to.eql([671.55, 222.55]);
        expect(
          assignClosestPoint(
            flatCoordinates,
            0,
            flatCoordinates.length,
            2,
            maxDelta,
            false,
            1000,
            500,
            closestPoint,
            Infinity
          )
        ).to.roughlyEqual(18229.4425, 1e-9);
        expect(closestPoint).to.eql([866.36, 480.77]);
      });
    });
  });

  describe('with multi-dimensional data', function () {
    const flatCoordinates = [0, 0, 10, -10, 2, 2, 30, -20];
    const stride = 4;

    describe('assignClosestPoint', function () {
      it('interpolates M coordinates', function () {
        const maxDelta = Math.sqrt(
          maxSquaredDelta(flatCoordinates, 0, flatCoordinates.length, stride, 0)
        );
        expect(maxDelta).to.roughlyEqual(Math.sqrt(8), 1e-9);
        const closestPoint = [NaN, NaN];
        expect(
          assignClosestPoint(
            flatCoordinates,
            0,
            flatCoordinates.length,
            stride,
            maxDelta,
            false,
            1,
            1,
            closestPoint,
            Infinity
          )
        ).to.roughlyEqual(0, 1e-9);
        expect(closestPoint).to.have.length(stride);
        expect(closestPoint[0]).to.be(1);
        expect(closestPoint[1]).to.be(1);
        expect(closestPoint[2]).to.be(20);
        expect(closestPoint[3]).to.be(-15);
      });
    });
  });
});
