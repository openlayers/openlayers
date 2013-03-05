goog.provide('ol.test.RotationConstraint');

describe('ol.RotationConstraint', function() {

  describe('SnapToZero', function() {

    it('returns expected rotation value', function() {
      var rotationConstraint = ol.RotationConstraint.createSnapToZero(0.3);

      expect(rotationConstraint(0.1, 0)).toEqual(0);
      expect(rotationConstraint(0.2, 0)).toEqual(0);
      expect(rotationConstraint(0.3, 0)).toEqual(0);
      expect(rotationConstraint(0.4, 0)).toEqual(0.4);

      expect(rotationConstraint(-0.1, 0)).toEqual(0);
      expect(rotationConstraint(-0.2, 0)).toEqual(0);
      expect(rotationConstraint(-0.3, 0)).toEqual(0);
      expect(rotationConstraint(-0.4, 0)).toEqual(-0.4);

      expect(rotationConstraint(1, -0.9)).toEqual(0);
      expect(rotationConstraint(1, -0.8)).toEqual(0);
      // floating-point arithmetic
      expect(rotationConstraint(1, -0.7)).not.toEqual(0);
      expect(rotationConstraint(1, -0.6)).toEqual(0.4);

      expect(rotationConstraint(-1, 0.9)).toEqual(0);
      expect(rotationConstraint(-1, 0.8)).toEqual(0);
      // floating-point arithmetic
      expect(rotationConstraint(-1, 0.7)).not.toEqual(0);
      expect(rotationConstraint(-1, 0.6)).toEqual(-0.4);
    });

  });
});

goog.require('ol.RotationConstraint');
