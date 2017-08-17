

goog.require('ol.render.canvas.ReplayGroup');


describe('ol.render.canvas.ReplayGroup', function() {

  describe('#getCircleArray_', function() {
    it('creates an array with a pixelated circle marked with true', function() {
      var radius = 10;
      var minRadiusSq = Math.pow(radius - Math.SQRT2, 2);
      var maxRadiusSq = Math.pow(radius + Math.SQRT2, 2);
      var circleArray = ol.render.canvas.ReplayGroup.getCircleArray_(radius);
      var size = radius * 2 + 1;
      expect(circleArray.length).to.be(size);

      for (var i = 0; i < size; i++) {
        expect(circleArray[i].length).to.be(size);
        for (var j = 0; j < size; j++) {
          var dx = Math.abs(radius - i);
          var dy = Math.abs(radius - j);
          var distanceSq = Math.pow(dx, 2) + Math.pow(dy, 2);
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
