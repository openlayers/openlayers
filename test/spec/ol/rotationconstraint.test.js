import {createSnapToZero} from '../../../src/ol/rotationconstraint.js';


describe('ol.rotationconstraint', () => {

  describe('SnapToZero', () => {

    test('returns expected rotation value', () => {
      const rotationConstraint = createSnapToZero(0.3);

      expect(rotationConstraint(0.1)).toEqual(0);
      expect(rotationConstraint(0.2)).toEqual(0);
      expect(rotationConstraint(0.3)).toEqual(0);
      expect(rotationConstraint(0.4)).toEqual(0.4);

      expect(rotationConstraint(-0.1)).toEqual(0);
      expect(rotationConstraint(-0.2)).toEqual(0);
      expect(rotationConstraint(-0.3)).toEqual(0);
      expect(rotationConstraint(-0.4)).toEqual(-0.4);
    });

  });
});
