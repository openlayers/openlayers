import {assert} from 'chai';
import {createSnapToZero} from '../../../../src/ol/rotationconstraint.js';

describe('ol.rotationconstraint', function () {
  describe('SnapToZero', function () {
    it('returns expected rotation value', function () {
      const rotationConstraint = createSnapToZero(0.3);

      assert.deepEqual(rotationConstraint(0.1), 0);
      assert.deepEqual(rotationConstraint(0.2), 0);
      assert.deepEqual(rotationConstraint(0.3), 0);
      assert.deepEqual(rotationConstraint(0.4), 0.4);

      assert.deepEqual(rotationConstraint(-0.1), 0);
      assert.deepEqual(rotationConstraint(-0.2), 0);
      assert.deepEqual(rotationConstraint(-0.3), 0);
      assert.deepEqual(rotationConstraint(-0.4), -0.4);
    });
  });
});
