import Feature from '../../../../src/ol/Feature.js';
import Vector from '../../../../src/ol/layer/Vector.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style, {createDefaultStyle} from '../../../../src/ol/style/Style.js';
import expect from '../../expect.js';

describe('ol/layer/Vector.js', () => {
  describe('setStyle()', () => {
    it('accepts a flat style', () => {
      const layer = new Vector();
      layer.setStyle({
        'fill-color': 'red',
      });

      const styleFunction = layer.getStyleFunction();
      expect(styleFunction).to.be.a(Function);

      const styles = styleFunction(new Feature(), 1);
      expect(styles).to.be.an(Array);
      expect(styles).to.have.length(1);

      const style = styles[0];
      const fill = style.getFill();
      expect(fill).to.be.a(Fill);
      expect(fill.getColor()).to.eql([255, 0, 0, 1]);
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

      const styleFunction = layer.getStyleFunction();
      expect(styleFunction).to.be.a(Function);

      const styles = styleFunction(new Feature(), 1);
      expect(styles).to.be.an(Array);
      expect(styles).to.have.length(2);

      const first = styles[0];
      expect(first).to.be.a(Style);

      const firstStroke = first.getStroke();
      expect(firstStroke).to.be.a(Stroke);
      expect(firstStroke.getColor()).to.eql([255, 0, 0, 1]);
      expect(firstStroke.getWidth()).to.be(10);

      const second = styles[1];
      expect(second).to.be.a(Style);

      const secondStroke = second.getStroke();
      expect(secondStroke).to.be.a(Stroke);
      expect(secondStroke.getColor()).to.eql([255, 255, 0, 1]);
      expect(secondStroke.getWidth()).to.be(5);
    });
  });

  describe('getStyle()', () => {
    it('returns the default style if no style was set', () => {
      const layer = new Vector();
      expect(layer.getStyle()).to.be(createDefaultStyle);
    });
    it('returns null if null was set', () => {
      const layer = new Vector();
      layer.setStyle(null);
      expect(layer.getStyle()).to.be(null);
    });
    it('returns a Style if a Style was set', () => {
      const layer = new Vector();
      const style = new Style({
        fill: new Fill({
          color: 'red',
        }),
      });
      layer.setStyle(style);
      expect(layer.getStyle()).to.be(style);
    });
    it('returns a flat style if a flat style was set', () => {
      const layer = new Vector();
      const style = [
        {
          'stroke-color': 'red',
          'stroke-width': 10,
        },
        {
          'stroke-color': 'yellow',
          'stroke-width': 5,
        },
      ];
      layer.setStyle(style);
      expect(layer.getStyle()).to.be(style);
    });
  });
});
