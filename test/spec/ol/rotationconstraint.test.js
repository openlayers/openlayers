goog.provide('ol.test.RotationConstraint');

goog.require('ol.RotationConstraint');


describe('ol.RotationConstraint', function() {

  describe('SnapToZero', function() {

    it('returns expected rotation value', function() {
      var rotationConstraint = ol.RotationConstraint.createSnapToZero(0.3);

      expect(rotationConstraint(0.1, 0)).to.eql(0);
      expect(rotationConstraint(0.2, 0)).to.eql(0);
      expect(rotationConstraint(0.3, 0)).to.eql(0);
      expect(rotationConstraint(0.4, 0)).to.eql(0.4);

      expect(rotationConstraint(-0.1, 0)).to.eql(0);
      expect(rotationConstraint(-0.2, 0)).to.eql(0);
      expect(rotationConstraint(-0.3, 0)).to.eql(0);
      expect(rotationConstraint(-0.4, 0)).to.eql(-0.4);

      expect(rotationConstraint(1, -0.9)).to.eql(0);
      expect(rotationConstraint(1, -0.8)).to.eql(0);
      // floating-point arithmetic
      expect(rotationConstraint(1, -0.7)).not.to.eql(0);
      expect(rotationConstraint(1, -0.6)).to.eql(0.4);

      expect(rotationConstraint(-1, 0.9)).to.eql(0);
      expect(rotationConstraint(-1, 0.8)).to.eql(0);
      // floating-point arithmetic
      expect(rotationConstraint(-1, 0.7)).not.to.eql(0);
      expect(rotationConstraint(-1, 0.6)).to.eql(-0.4);
    });

  });
});
