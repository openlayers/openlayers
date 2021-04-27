import {getPixelIndexArray} from '../../../../../../src/ol/render/canvas/ExecutorGroup.js';

describe('ol.render.canvas.ExecutorGroup', function () {
  describe('#getPixelIndexArray', function () {
    it('creates an array with every index within distance', function () {
      const radius = 10;
      const size = radius * 2 + 1;
      const hitIndexes = getPixelIndexArray(radius);

      const circleArray = new Array(size);
      for (let i = 0; i < size; i++) {
        circleArray[i] = new Array(size);
      }

      hitIndexes.forEach(function (d) {
        const x = ((d - 3) / 4) % size;
        const y = ((d - 3) / 4 / size) | 0;
        circleArray[x][y] = true;
      });

      const minRadiusSq = Math.pow(radius - Math.SQRT2, 2);
      const maxRadiusSq = Math.pow(radius + Math.SQRT2, 2);
      expect(circleArray.length).to.be(size);

      for (let i = 0; i < size; i++) {
        expect(circleArray[i].length).to.be(size);
        for (let j = 0; j < size; j++) {
          const dx = Math.abs(radius - i);
          const dy = Math.abs(radius - j);
          const distanceSq = Math.pow(dx, 2) + Math.pow(dy, 2);
          if (circleArray[i][j] === true) {
            expect(distanceSq).to.be.within(0, maxRadiusSq);
          } else {
            expect(distanceSq).to.be.within(minRadiusSq, Infinity);
          }
        }
      }
    });
    it('orders the indexes correctly from closest to farthest away', function () {
      const radius = 10;
      const size = radius * 2 + 1;
      const hitIndexes = getPixelIndexArray(radius);

      // Center first
      expect(hitIndexes[0]).to.be((size * radius + radius) * 4 + 3);

      // 4 Pixels above/below/left/right of center next
      const begin = hitIndexes.slice(1, 5);
      expect(begin).to.contain((radius * size + radius + 1) * 4 + 3);
      expect(begin).to.contain(((radius + 1) * size + radius) * 4 + 3);
      expect(begin).to.contain(((radius - 1) * size + radius) * 4 + 3);
      expect(begin).to.contain((radius * size + radius - 1) * 4 + 3);

      // 4 Pixels in the middle of each side in the last 12 elements (at radius 10)
      const last = hitIndexes.slice(hitIndexes.length - 12);
      expect(last).to.contain((0 * size + radius) * 4 + 3);
      expect(last).to.contain((radius * size + 0) * 4 + 3);
      expect(last).to.contain((radius * size + size - 1) * 4 + 3);
      expect(last).to.contain(((size - 1) * size + radius) * 4 + 3);
    });
    it('has no duplicate indexes', function () {
      const radius = 10;
      const hitIndexes = getPixelIndexArray(radius);

      expect(new Set(hitIndexes).size).to.be(hitIndexes.length);
    });
  });
});
