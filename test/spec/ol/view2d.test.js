goog.provide('ol.test.View2D');

describe('ol.View2D', function() {
  describe('create constraints', function() {

    describe('create resolution constraint', function() {

      describe('with no options', function() {
        it('gives a correct resolution constraint function', function() {
          var options = {};
          var fn = ol.View2D.createResolutionConstraint_(options)[0];
          expect(fn(156543.03392804097, 0, 0))
              .to.roughlyEqual(156543.03392804097, 1e-9);
          expect(fn(78271.51696402048, 0, 0))
              .to.roughlyEqual(78271.51696402048, 1e-10);
        });
      });

      describe('with maxResolution, maxZoom, and zoomFactor options',
          function() {
            it('gives a correct resolution constraint function', function() {
              var options = {
                maxResolution: 81,
                maxZoom: 3,
                zoomFactor: 3
              };
              var parts = ol.View2D.createResolutionConstraint_(options);
              var maxResolution = parts[1];
              expect(maxResolution).to.eql(81);
              var minResolution = parts[2];
              expect(minResolution).to.eql(3);
              var fn = parts[0];
              expect(fn(82, 0, 0)).to.eql(81);
              expect(fn(81, 0, 0)).to.eql(81);
              expect(fn(27, 0, 0)).to.eql(27);
              expect(fn(9, 0, 0)).to.eql(9);
              expect(fn(3, 0, 0)).to.eql(3);
              expect(fn(2, 0, 0)).to.eql(3);
            });
          });

      describe('with resolutions', function() {
        it('gives a correct resolution constraint function', function() {
          var options = {
            resolutions: [97, 76, 65, 54, 0.45]
          };
          var parts = ol.View2D.createResolutionConstraint_(options);
          var maxResolution = parts[1];
          expect(maxResolution).to.eql(97);
          var minResolution = parts[2];
          expect(minResolution).to.eql(0.45);
          var fn = parts[0];
          expect(fn(97, 0, 0)).to.eql(97);
          expect(fn(76, 0, 0)).to.eql(76);
          expect(fn(65, 0, 0)).to.eql(65);
          expect(fn(54, 0, 0)).to.eql(54);
          expect(fn(0.45, 0, 0)).to.eql(0.45);
        });
      });

    });

    describe('create rotation constraint', function() {
      it('gives a correct rotation constraint function', function() {
        var options = {};
        var fn = ol.View2D.createRotationConstraint_(options);
        expect(fn(0.01, 0)).to.eql(0);
        expect(fn(0.15, 0)).to.eql(0.15);
      });
    });

  });
});

goog.require('ol.View2D');
