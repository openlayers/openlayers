import Fill from '../../../../src/ol/style/Fill.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import Vector from '../../../../src/ol/layer/Vector.js';
import expect from '../../expect.js';

describe('ol/layer/Vector.js', () => {
  describe('setStyle()', () => {
    it('accepts a flat style', () => {
      const layer = new Vector();
      layer.setStyle({
        'fill-color': 'red',
      });

      const style = layer.getStyle();
      expect(style).to.be.a(Style);

      const fill = style.getFill();
      expect(fill).to.be.a(Fill);
      expect(fill.getColor()).to.be('red');
    });

    it('accepts an array of flat styles', () => {
      const layer = new Vector();
      layer.setStyle([
        {
          'stroke-color': 'red',
          'stroke-width': 10,
        },
        {
          'stroke-color': 'yellow',
          'stroke-width': 5,
        },
      ]);

      const style = layer.getStyle();
      expect(Array.isArray(style)).to.be(true);
      expect(style).to.have.length(2);

      const first = style[0];
      expect(first).to.be.a(Style);

      const firstStroke = first.getStroke();
      expect(firstStroke).to.be.a(Stroke);
      expect(firstStroke.getColor()).to.be('red');
      expect(firstStroke.getWidth()).to.be(10);

      const second = style[1];
      expect(second).to.be.a(Style);

      const secondStroke = second.getStroke();
      expect(secondStroke).to.be.a(Stroke);
      expect(secondStroke.getColor()).to.be('yellow');
      expect(secondStroke.getWidth()).to.be(5);
    });
  });
});
