import expect from '../../../expect.js';
import {
  douglasPeucker,
  quantize,
  radialDistance,
  simplifyLineString,
} from '../../../../../src/ol/geom/flat/simplify.js';

describe('ol/geom/flat/simplify.js', function () {
  const flatCoordinates = [
    224.55, 250.15, 226.91, 244.19, 233.31, 241.45, 234.98, 236.06, 244.21,
    232.76, 262.59, 215.31, 267.76, 213.81, 273.57, 201.84, 273.12, 192.16,
    277.62, 189.03, 280.36, 181.41, 286.51, 177.74, 292.41, 159.37, 296.91,
    155.64, 314.95, 151.37, 319.75, 145.16, 330.33, 137.57, 341.48, 139.96,
    369.98, 137.89, 387.39, 142.51, 391.28, 139.39, 409.52, 141.14, 414.82,
    139.75, 427.72, 127.3, 439.6, 119.74, 474.93, 107.87, 486.51, 106.75, 489.2,
    109.45, 493.79, 108.63, 504.74, 119.66, 512.96, 122.35, 518.63, 120.89,
    524.09, 126.88, 529.57, 127.86, 534.21, 140.93, 539.27, 147.24, 567.69,
    148.91, 575.25, 157.26, 580.62, 158.15, 601.53, 156.85, 617.74, 159.86,
    622.0, 167.04, 629.55, 194.6, 638.9, 195.61, 641.26, 200.81, 651.77, 204.56,
    671.55, 222.55, 683.68, 217.45, 695.25, 219.15, 700.64, 217.98, 703.12,
    214.36, 712.26, 215.87, 721.49, 212.81, 727.81, 213.36, 729.98, 208.73,
    735.32, 208.2, 739.94, 204.77, 769.98, 208.42, 779.6, 216.87, 784.2, 218.16,
    800.24, 214.62, 810.53, 219.73, 817.19, 226.82, 820.77, 236.17, 827.23,
    236.16, 829.89, 239.89, 851.0, 248.94, 859.88, 255.49, 865.21, 268.53,
    857.95, 280.3, 865.48, 291.45, 866.81, 298.66, 864.68, 302.71, 867.79,
    306.17, 859.87, 311.37, 860.08, 314.35, 858.29, 314.94, 858.1, 327.6,
    854.54, 335.4, 860.92, 343.0, 856.43, 350.15, 851.42, 352.96, 849.84,
    359.59, 854.56, 365.53, 849.74, 370.38, 844.09, 371.89, 844.75, 380.44,
    841.52, 383.67, 839.57, 390.4, 845.59, 399.05, 848.4, 407.55, 843.71, 411.3,
    844.09, 419.88, 839.51, 432.76, 841.33, 441.04, 847.62, 449.22, 847.16,
    458.44, 851.38, 462.79, 853.97, 471.15, 866.36, 480.77,
  ];

  const simplifiedRadiallyFlatCoordinates = [
    224.55, 250.15, 226.91, 244.19, 233.31, 241.45, 234.98, 236.06, 244.21,
    232.76, 262.59, 215.31, 267.76, 213.81, 273.57, 201.84, 273.12, 192.16,
    277.62, 189.03, 280.36, 181.41, 286.51, 177.74, 292.41, 159.37, 296.91,
    155.64, 314.95, 151.37, 319.75, 145.16, 330.33, 137.57, 341.48, 139.96,
    369.98, 137.89, 387.39, 142.51, 409.52, 141.14, 414.82, 139.75, 427.72,
    127.3, 439.6, 119.74, 474.93, 107.87, 486.51, 106.75, 493.79, 108.63,
    504.74, 119.66, 512.96, 122.35, 518.63, 120.89, 524.09, 126.88, 529.57,
    127.86, 534.21, 140.93, 539.27, 147.24, 567.69, 148.91, 575.25, 157.26,
    580.62, 158.15, 601.53, 156.85, 617.74, 159.86, 622.0, 167.04, 629.55,
    194.6, 638.9, 195.61, 641.26, 200.81, 651.77, 204.56, 671.55, 222.55,
    683.68, 217.45, 695.25, 219.15, 700.64, 217.98, 712.26, 215.87, 721.49,
    212.81, 727.81, 213.36, 729.98, 208.73, 735.32, 208.2, 739.94, 204.77,
    769.98, 208.42, 779.6, 216.87, 800.24, 214.62, 810.53, 219.73, 817.19,
    226.82, 820.77, 236.17, 827.23, 236.16, 851.0, 248.94, 859.88, 255.49,
    865.21, 268.53, 857.95, 280.3, 865.48, 291.45, 866.81, 298.66, 867.79,
    306.17, 859.87, 311.37, 858.1, 327.6, 854.54, 335.4, 860.92, 343.0, 856.43,
    350.15, 851.42, 352.96, 849.84, 359.59, 854.56, 365.53, 849.74, 370.38,
    844.09, 371.89, 844.75, 380.44, 839.57, 390.4, 845.59, 399.05, 848.4,
    407.55, 843.71, 411.3, 844.09, 419.88, 839.51, 432.76, 841.33, 441.04,
    847.62, 449.22, 847.16, 458.44, 851.38, 462.79, 853.97, 471.15, 866.36,
    480.77,
  ];

  const simplifiedFlatCoordinates = [
    224.55, 250.15, 267.76, 213.81, 296.91, 155.64, 330.33, 137.57, 409.52,
    141.14, 439.6, 119.74, 486.51, 106.75, 529.57, 127.86, 539.27, 147.24,
    617.74, 159.86, 629.55, 194.6, 671.55, 222.55, 727.81, 213.36, 739.94,
    204.77, 769.98, 208.42, 779.6, 216.87, 800.24, 214.62, 820.77, 236.17,
    859.88, 255.49, 865.21, 268.53, 857.95, 280.3, 867.79, 306.17, 859.87,
    311.37, 854.54, 335.4, 860.92, 343.0, 849.84, 359.59, 854.56, 365.53,
    844.09, 371.89, 839.57, 390.4, 848.4, 407.55, 839.51, 432.76, 853.97,
    471.15, 866.36, 480.77,
  ];

  const simplifiedHighQualityFlatCoordinates = [
    224.55, 250.15, 267.76, 213.81, 296.91, 155.64, 330.33, 137.57, 409.52,
    141.14, 439.6, 119.74, 486.51, 106.75, 529.57, 127.86, 539.27, 147.24,
    617.74, 159.86, 629.55, 194.6, 671.55, 222.55, 727.81, 213.36, 739.94,
    204.77, 769.98, 208.42, 784.2, 218.16, 800.24, 214.62, 820.77, 236.17,
    859.88, 255.49, 865.21, 268.53, 857.95, 280.3, 867.79, 306.17, 858.29,
    314.94, 854.54, 335.4, 860.92, 343.0, 849.84, 359.59, 854.56, 365.53,
    844.09, 371.89, 839.57, 390.4, 848.4, 407.55, 839.51, 432.76, 853.97,
    471.15, 866.36, 480.77,
  ];

  describe('simplifyLineString', function () {
    it('works with empty line strings', function () {
      expect(simplifyLineString([], 0, 0, 2, 1, true)).to.eql([]);
      expect(simplifyLineString([], 0, 0, 2, 1, false)).to.eql([]);
    });

    it('works with a line string with a single point', function () {
      expect(simplifyLineString([1, 2], 0, 2, 2, 1, true)).to.eql([1, 2]);
      expect(simplifyLineString([1, 2], 0, 2, 2, 1, false)).to.eql([1, 2]);
    });

    it('returns the expected result with low quality', function () {
      const result = simplifyLineString(
        flatCoordinates,
        0,
        flatCoordinates.length,
        2,
        25,
        false
      );
      expect(result.length).to.be(simplifiedFlatCoordinates.length);
      expect(result).to.eql(simplifiedFlatCoordinates);
    });

    it('returns the expected result with high quality', function () {
      const result = simplifyLineString(
        flatCoordinates,
        0,
        flatCoordinates.length,
        2,
        25,
        true
      );
      expect(result.length).to.be(simplifiedHighQualityFlatCoordinates.length);
      expect(result).to.eql(simplifiedHighQualityFlatCoordinates);
    });
  });

  describe('radialDistance', function () {
    let dest;
    beforeEach(function () {
      dest = [];
    });

    it('works with empty line strings', function () {
      expect(radialDistance([], 0, 0, 2, 1, dest, 0)).to.be(0);
      expect(dest).to.eql([]);
    });

    it('works with a line string with a single point', function () {
      expect(radialDistance([1, 2], 0, 2, 2, 1, dest, 0)).to.be(2);
      expect(dest).to.eql([1, 2]);
    });

    it('works with a line string with two points', function () {
      expect(radialDistance([1, 2, 3, 4], 0, 4, 2, 1, dest, 0)).to.be(4);
      expect(dest).to.eql([1, 2, 3, 4]);
    });

    it('works when the points are widely spaced', function () {
      expect(
        radialDistance([0, 0, 1, 0, 2, 0, 3, 0], 0, 8, 2, 0.5, dest, 0)
      ).to.be(8);
      expect(dest).to.eql([0, 0, 1, 0, 2, 0, 3, 0]);
    });

    it('works when the spacing matches the tolerance', function () {
      expect(
        radialDistance([0, 0, 1, 0, 2, 0, 3, 0], 0, 8, 2, 1, dest, 0)
      ).to.be(6);
      expect(dest).to.eql([0, 0, 2, 0, 3, 0]);
    });

    it('works when the points are closely spaced', function () {
      expect(
        radialDistance([0, 0, 1, 0, 2, 0, 3, 0], 0, 8, 2, 1.5, dest, 0)
      ).to.be(6);
      expect(dest).to.eql([0, 0, 2, 0, 3, 0]);
    });

    it('works when the line oscillates with widely spaced points', function () {
      expect(
        radialDistance(
          [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
          0,
          12,
          2,
          1,
          dest,
          0
        )
      ).to.be(12);
      expect(dest).to.eql([0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1]);
    });

    it('works when the line oscillates with closely spaced points', function () {
      expect(
        radialDistance(
          [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
          0,
          12,
          2,
          2,
          dest,
          0
        )
      ).to.be(4);
      expect(dest).to.eql([0, 0, 1, 1]);
    });

    it('works when the line oscillates within the tolerance', function () {
      expect(
        radialDistance(
          [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
          0,
          14,
          2,
          2,
          dest,
          0
        )
      ).to.be(2);
      expect(dest).to.eql([0, 0]);
    });

    it('works with real data', function () {
      expect(
        radialDistance(
          flatCoordinates,
          0,
          flatCoordinates.length,
          2,
          25,
          dest,
          0
        )
      ).to.be(simplifiedRadiallyFlatCoordinates.length);
      expect(dest).to.eql(simplifiedRadiallyFlatCoordinates);
    });
  });

  describe('douglasPeucker', function () {
    let dest;
    beforeEach(function () {
      dest = [];
    });

    it('works with empty line strings', function () {
      expect(douglasPeucker([], 0, 0, 2, 1, dest, 0)).to.be(0);
      expect(dest).to.eql([]);
    });

    it('works with a line string with a single point', function () {
      expect(douglasPeucker([1, 2], 0, 2, 2, 1, dest, 0)).to.be(2);
      expect(dest).to.eql([1, 2]);
    });

    it('works with a line string with two points', function () {
      expect(douglasPeucker([1, 2, 3, 4], 0, 4, 2, 1, dest, 0)).to.be(4);
      expect(dest).to.eql([1, 2, 3, 4]);
    });

    it('works when the points are widely spaced', function () {
      expect(
        douglasPeucker([0, 0, 1, 0, 2, 0, 3, 0], 0, 8, 2, 0.5, dest, 0)
      ).to.be(4);
      expect(dest).to.eql([0, 0, 3, 0]);
    });

    it('works when the spacing matches the tolerance', function () {
      expect(
        douglasPeucker([0, 0, 1, 0, 2, 0, 3, 0], 0, 8, 2, 1, dest, 0)
      ).to.be(4);
      expect(dest).to.eql([0, 0, 3, 0]);
    });

    it('works when the points are closely spaced', function () {
      expect(
        douglasPeucker([0, 0, 1, 0, 2, 0, 3, 0], 0, 8, 2, 1.5, dest, 0)
      ).to.be(4);
      expect(dest).to.eql([0, 0, 3, 0]);
    });

    it('does not elimnate points outside the tolerance', function () {
      expect(douglasPeucker([0, 0, 1, 1, 2, 0], 0, 6, 2, 0.5, dest, 0)).to.be(
        6
      );
      expect(dest).to.eql([0, 0, 1, 1, 2, 0]);
    });

    it('does eliminate points within the tolerance', function () {
      expect(douglasPeucker([0, 0, 1, 1, 2, 0], 0, 6, 2, 2, dest, 0)).to.be(4);
      expect(dest).to.eql([0, 0, 2, 0]);
    });

    it('does not eliminate multiple points outside the tolerance', function () {
      expect(
        douglasPeucker([0, 0, 1, 1, 1, -1, 2, 0], 0, 8, 2, 0.5, dest, 0)
      ).to.be(8);
      expect(dest).to.eql([0, 0, 1, 1, 1, -1, 2, 0]);
    });

    it('does eliminate multiple points within the tolerance', function () {
      expect(
        douglasPeucker([0, 0, 1, 1, 1, -1, 2, 0], 0, 8, 2, 2, dest, 0)
      ).to.be(4);
      expect(dest).to.eql([0, 0, 2, 0]);
    });

    it('works when the line oscillates with widely spaced points', function () {
      expect(
        douglasPeucker(
          [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
          0,
          12,
          2,
          1,
          dest,
          0
        )
      ).to.be(4);
      expect(dest).to.eql([0, 0, 1, 1]);
    });

    it('works when the line oscillates with closely spaced points', function () {
      expect(
        douglasPeucker(
          [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
          0,
          12,
          2,
          2,
          dest,
          0
        )
      ).to.be(4);
      expect(dest).to.eql([0, 0, 1, 1]);
    });

    it('works when the line oscillates within the tolerance', function () {
      expect(
        douglasPeucker(
          [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
          0,
          14,
          2,
          2,
          dest,
          0
        )
      ).to.be(4);
      expect(dest).to.eql([0, 0, 0, 0]);
    });

    it('works on small triangles', function () {
      expect(
        douglasPeucker([3, 0, 4, 1, 5, 2, 5, 0], 0, 8, 2, 1, dest, 0)
      ).to.be(6);
      expect(dest).to.eql([3, 0, 5, 2, 5, 0]);
    });

    it('is the same as high quality simplification', function () {
      expect(
        douglasPeucker(
          flatCoordinates,
          0,
          flatCoordinates.length,
          2,
          25,
          dest,
          0
        )
      ).to.be(simplifiedHighQualityFlatCoordinates.length);
      expect(dest).to.eql(simplifiedHighQualityFlatCoordinates);
    });
  });

  describe('quantize', function () {
    it('handles empty coordinates', function () {
      const simplifiedFlatCoordinates = [];
      expect(quantize([], 0, 0, 2, 2, simplifiedFlatCoordinates, 0)).to.be(0);
      expect(simplifiedFlatCoordinates).to.be.empty();
    });

    it('expands points to a zero-length line', function () {
      const simplifiedFlatCoordinates = [];
      expect(
        quantize([0, 0, 0, 0], 0, 4, 2, 2, simplifiedFlatCoordinates, 0)
      ).to.be(4);
      expect(simplifiedFlatCoordinates).to.eql([0, 0, 0, 0]);
    });

    it('snaps near-by points to the same value', function () {
      const simplifiedFlatCoordinates = [];
      expect(
        quantize([0.1, 0, 0, 0.1], 0, 4, 2, 2, simplifiedFlatCoordinates, 0)
      ).to.be(4);
      expect(simplifiedFlatCoordinates).to.eql([0, 0, 0, 0]);
    });

    it('eliminates duplicate snapped points', function () {
      const simplifiedFlatCoordinates = [];
      expect(
        quantize(
          [0.1, 0, 2, 0, 2.1, 0, 2, 0.1, 1.9, 0, 2, -0.1],
          0,
          12,
          2,
          2,
          simplifiedFlatCoordinates,
          0
        )
      ).to.be(4);
      expect(simplifiedFlatCoordinates).to.eql([0, 0, 2, 0]);
    });

    it('eliminates horizontal colinear points', function () {
      const simplifiedFlatCoordinates = [];
      expect(
        quantize(
          [0, 0, 2, 0, 4, 0, 6, 0],
          0,
          8,
          2,
          2,
          simplifiedFlatCoordinates,
          0
        )
      ).to.be(4);
      expect(simplifiedFlatCoordinates).to.eql([0, 0, 6, 0]);
    });

    it('eliminates vertical colinear points', function () {
      const simplifiedFlatCoordinates = [];
      expect(
        quantize(
          [0, 0, 0, -2, 0, -4, 0, -6],
          0,
          8,
          2,
          2,
          simplifiedFlatCoordinates,
          0
        )
      ).to.be(4);
      expect(simplifiedFlatCoordinates).to.eql([0, 0, 0, -6]);
    });

    it('eliminates diagonal colinear points', function () {
      const simplifiedFlatCoordinates = [];
      expect(
        quantize(
          [0, 0, 2, -2, 4, -4, 6, -6],
          0,
          8,
          2,
          2,
          simplifiedFlatCoordinates,
          0
        )
      ).to.be(4);
      expect(simplifiedFlatCoordinates).to.eql([0, 0, 6, -6]);
    });

    it('handles switchbacks', function () {
      const simplifiedFlatCoordinates = [];
      expect(
        quantize(
          [0, 0, 2, 0, 0, 0, 4, 0],
          0,
          8,
          2,
          2,
          simplifiedFlatCoordinates,
          0
        )
      ).to.be(8);
      expect(simplifiedFlatCoordinates).to.eql([0, 0, 2, 0, 0, 0, 4, 0]);
    });
  });
});
