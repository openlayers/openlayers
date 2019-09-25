import {getCircleArray} from '../../../../../src/ol/render/canvas/ExecutorGroup.js';


describe('ol.render.canvas.ExecutorGroup', () => {

  describe('#getCircleArray_', () => {
    test('creates an array with a pixelated circle marked with true', () => {
      const radius = 10;
      const minRadiusSq = Math.pow(radius - Math.SQRT2, 2);
      const maxRadiusSq = Math.pow(radius + Math.SQRT2, 2);
      const circleArray = getCircleArray(radius);
      const size = radius * 2 + 1;
      expect(circleArray.length).toBe(size);

      for (let i = 0; i < size; i++) {
        expect(circleArray[i].length).toBe(size);
        for (let j = 0; j < size; j++) {
          const dx = Math.abs(radius - i);
          const dy = Math.abs(radius - j);
          const distanceSq = Math.pow(dx, 2) + Math.pow(dy, 2);
          if (circleArray[i][j] === true) {
            expect(distanceSq > 0 && distanceSq < maxRadiusSq).toBeTruthy();
          } else {
            expect(distanceSq > minRadiusSq && distanceSq < Infinity).toBeTruthy();
          }
        }
      }
    });
  });

});
