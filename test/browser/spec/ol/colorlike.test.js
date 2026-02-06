import {asColorLike} from '../../../../src/ol/colorlike.js';
import Fill from '../../../../src/ol/style/Fill.js';

describe('ol/colorlike', () => {
  describe('asColorlike()', () => {
    it('creates a CanvasPattern from a PatternDescriptor', () => {
      const fill = new Fill({
        color: {
          src: '/base/spec/ol/data/dot.png',
        },
      });
      return fill.ready().then(() => {
        const pattern = asColorLike(fill.getColor());
        expect(pattern).to.be.a(CanvasPattern);
      });
    });
  });
});
