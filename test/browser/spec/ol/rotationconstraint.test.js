import {createSnapToZero} from '../../../../src/ol/rotationconstraint.js';

describe('ol.rotationconstraint', function () {
  describe('SnapToZero', function () {
    it('returns expected rotation value', function () {
      const rotationConstraint = createSnapToZero(0.3);

      expect(rotationConstraint(0.1)).to.eql(0);
      expect(rotationConstraint(0.2)).to.eql(0);
      expect(rotationConstraint(0.3)).to.eql(0);
      expect(rotationConstraint(0.4)).to.eql(0.4);

      expect(rotationConstraint(-0.1)).to.eql(0);
      expect(rotationConstraint(-0.2)).to.eql(0);
      expect(rotationConstraint(-0.3)).to.eql(0);
      expect(rotationConstraint(-0.4)).to.eql(-0.4);
    });
  });
});
