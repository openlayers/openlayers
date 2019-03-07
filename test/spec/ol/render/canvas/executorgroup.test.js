import {getCircleArray} from '../../../../../src/ol/render/canvas/ExecutorGroup.js';


describe('ol.render.canvas.ExecutorGroup', function() {

  describe('#getCircleArray_', function() {
    it('creates an array with a pixelated circle marked with true', function() {
      const radius = 10;
      const minRadiusSq = Math.pow(radius - Math.SQRT2, 2);
      const maxRadiusSq = Math.pow(radius + Math.SQRT2, 2);
      const circleArray = getCircleArray(radius);
      const size = radius * 2 + 1;
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
  });

});
