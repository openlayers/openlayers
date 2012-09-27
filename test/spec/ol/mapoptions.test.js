goog.require('ol.MapOptions');

describe('ol.MapOptions', function() {

  describe('create constraints', function() {

    describe('create resolution constraint', function() {

      describe('with no options', function() {
        it('gives a correct resolution constraint function', function() {
          var options = {};
          var fn = ol.MapOptions.createConstraints_(options).resolution;
          expect(fn(156543.03392804097, 0))
              .toRoughlyEqual(156543.03392804097, 1e-9);
          expect(fn(78271.51696402048, 0))
              .toRoughlyEqual(78271.51696402048, 1e-10);
        });
      });

      describe('with maxResolution, numZoomLevels, and zoomFactor options',
          function() {
        it('gives a correct resolution constraint function', function() {
          var options = {
            maxResolution: 81,
            numZoomLevels: 4,
            zoomFactor: 3
          };
          var fn = ol.MapOptions.createConstraints_(options).resolution;
          expect(fn(82, 0)).toEqual(81);
          expect(fn(81, 0)).toEqual(81);
          expect(fn(27, 0)).toEqual(27);
          expect(fn(9, 0)).toEqual(9);
          expect(fn(3, 0)).toEqual(3);
          expect(fn(2, 0)).toEqual(3);
        });
      });

      describe('with resolutions', function() {
        it('gives a correct resolution constraint function', function() {
          var options = {
            resolutions: [97, 76, 65, 54, 0.45]
          };
          var fn = ol.MapOptions.createConstraints_(options).resolution;
          expect(fn(97, 0), 97);
          expect(fn(76, 0), 76);
          expect(fn(65, 0), 65);
          expect(fn(54, 0), 54);
          expect(fn(0.45, 0), 0.45);
        });
      });

    });
  });
});
