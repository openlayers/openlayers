goog.require('ol.Map');

describe('ol.Map', function() {

  describe('create constraints', function() {

    describe('create resolution constraint', function() {

      describe('with no options', function() {
        it('gives a correct resolution constraint function', function() {
          var options = {};
          var fn = ol.Map.createConstraints_(options).resolution;
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
          var fn = ol.Map.createConstraints_(options).resolution;
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
          var fn = ol.Map.createConstraints_(options).resolution;
          expect(fn(97, 0), 97);
          expect(fn(76, 0), 76);
          expect(fn(65, 0), 65);
          expect(fn(54, 0), 54);
          expect(fn(0.45, 0), 0.45);
        });
      });

    });
  });

  describe('create interactions', function() {

    var options;

    beforeEach(function() {
      options = {
          rotate: false,
          doubleClickZoom: false,
          dragPan: false,
          keyboard: false,
          mouseWheelZoom: false,
          shiftDragZoom: false
      };
    });

    describe('create mousewheel interaction', function() {

      beforeEach(function() {
        options.mouseWheelZoom = true;
      });

      describe('default mouseWheelZoomDelta', function() {
        it('create mousewheel interaction with default delta', function() {
          var interactions = ol.Map.createInteractions_(options);
          expect(interactions.getLength()).toEqual(1);
          expect(interactions.getAt(0)).toBeA(ol.interaction.MouseWheelZoom);
          expect(interactions.getAt(0).delta_).toEqual(1);
        });
      });

      describe('set mouseWheelZoomDelta', function() {
        it('create mousewheel interaction with set delta', function() {
          options.mouseWheelZoomDelta = 7;
          var interactions = ol.Map.createInteractions_(options);
          expect(interactions.getLength()).toEqual(1);
          expect(interactions.getAt(0)).toBeA(ol.interaction.MouseWheelZoom);
          expect(interactions.getAt(0).delta_).toEqual(7);
        });
      });
    });

    describe('create double click interaction', function() {

      beforeEach(function() {
        options.doubleClickZoom = true;
      });

      describe('default zoomDelta', function() {
        it('create double click interaction with default delta', function() {
          var interactions = ol.Map.createInteractions_(options);
          expect(interactions.getLength()).toEqual(1);
          expect(interactions.getAt(0)).toBeA(ol.interaction.DblClickZoom);
          expect(interactions.getAt(0).delta_).toEqual(4);
        });
      });

      describe('set mouseWheelZoomDelta', function() {
        it('create double click interaction with set delta', function() {
          options.zoomDelta = 7;
          var interactions = ol.Map.createInteractions_(options);
          expect(interactions.getLength()).toEqual(1);
          expect(interactions.getAt(0)).toBeA(ol.interaction.DblClickZoom);
          expect(interactions.getAt(0).delta_).toEqual(7);
        });
      });
    });
  });
});
