goog.provide('ol.test.coordinate');

describe.only('ol.coordinate', function() {

  describe('#closestOnSegment', function() {
    it('can handle points where the foot of the perpendicular is closest',
        function() {
          var point = [2, 5];
          var segment = [[-5, 0], [10, 0]];
          expect(ol.coordinate.closestOnSegment(point, segment))
              .to.eql([2, 0]);
        });
    it('can handle points where the foot of the perpendicular is not closest',
        function() {
          var point = [0, -6];
          var segment = [[-5, 0], [0, -1]];
          expect(ol.coordinate.closestOnSegment(point, segment))
              .to.eql([0, -1]);
        });
  });

  describe('#squaredDistanceToSegment', function() {
    it('can handle points where the foot of the perpendicular is closest',
        function() {
          var point = [2, 5];
          var segment = [[-5, 0], [10, 0]];
          expect(ol.coordinate.squaredDistanceToSegment(point, segment))
              .to.eql(25);
        });
    it('can handle points where the foot of the perpendicular is not closest',
        function() {
          var point = [0, -6];
          var segment = [[-5, 0], [0, -1]];
          expect(ol.coordinate.squaredDistanceToSegment(point, segment))
              .to.eql(25);
        });

  });

});

goog.require('ol.coordinate');
