import Fill from '../../../../src/ol/style/Fill.js';
import Icon from '../../../../src/ol/style/Icon.js';
import RegularShape from '../../../../src/ol/style/RegularShape.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import Text from '../../../../src/ol/style/Text.js';
import expect from '../../expect.js';
import {toStyle} from '../../../../src/ol/style/flat.js';

describe('ol/style/flat.js', () => {
  describe('toStyle()', () => {
    it('creates a style with a fill', () => {
      const style = toStyle({
        'fill-color': 'red',
      });

      expect(style).to.be.a(Style);

      const fill = style.getFill();
      expect(fill).to.be.a(Fill);
      expect(fill.getColor()).to.be('red');

      expect(style.getStroke()).to.be(null);
      expect(style.getText()).to.be(null);
      expect(style.getImage()).to.be(null);
    });

    it('creates a style with a stroke', () => {
      const style = toStyle({
        'stroke-width': 2,
      });

      expect(style).to.be.a(Style);

      const stroke = style.getStroke();
      expect(stroke).to.be.a(Stroke);
      expect(stroke.getWidth()).to.be(2);

      expect(style.getFill()).to.be(null);
      expect(style.getText()).to.be(null);
      expect(style.getImage()).to.be(null);
    });

    it('creates a style with a text', () => {
      const style = toStyle({
        'text-value': 'foo',
        'text-fill-color': 'blue',
        'text-stroke-width': 2,
      });

      expect(style).to.be.a(Style);

      const text = style.getText();
      expect(text).to.be.a(Text);
      expect(text.getText()).to.be('foo');

      const textFill = text.getFill();
      expect(textFill).to.be.a(Fill);
      expect(textFill.getColor()).to.be('blue');

      const textStroke = text.getStroke();
      expect(textStroke).to.be.a(Stroke);
      expect(textStroke.getWidth()).to.be(2);

      expect(style.getFill()).to.be(null);
      expect(style.getStroke()).to.be(null);
      expect(style.getImage()).to.be(null);
    });

    it('creates a style with an icon', () => {
      const style = toStyle({
        'icon-src': 'https://example.com/icon.png',
      });

      expect(style).to.be.a(Style);

      const icon = style.getImage();
      expect(icon).to.be.a(Icon);

      expect(style.getFill()).to.be(null);
      expect(style.getStroke()).to.be(null);
      expect(style.getText()).to.be(null);
    });

    it('creates a style with a regular shape', () => {
      const style = toStyle({
        'shape-points': 10,
        'shape-radius': 42,
        'shape-fill-color': 'red',
        'shape-stroke-color': 'blue',
      });

      expect(style).to.be.a(Style);

      const shape = style.getImage();
      expect(shape).to.be.a(RegularShape);
      expect(shape.getPoints()).to.be(10);
      expect(shape.getRadius()).to.be(42);

      const shapeFill = shape.getFill();
      expect(shapeFill).to.be.a(Fill);
      expect(shapeFill.getColor()).to.be('red');

      const shapeStroke = shape.getStroke();
      expect(shapeStroke).to.be.a(Stroke);
      expect(shapeStroke.getColor()).to.be('blue');

      expect(style.getFill()).to.be(null);
      expect(style.getStroke()).to.be(null);
      expect(style.getText()).to.be(null);
    });

    it('creates a style with a circle', () => {
      const style = toStyle({
        'circle-radius': 42,
        'circle-fill-color': 'red',
        'circle-stroke-color': 'blue',
      });

      expect(style).to.be.a(Style);

      const circle = style.getImage();
      expect(circle).to.be.a(RegularShape);
      expect(circle.getRadius()).to.be(42);

      const circleFill = circle.getFill();
      expect(circleFill).to.be.a(Fill);
      expect(circleFill.getColor()).to.be('red');

      const circleStroke = circle.getStroke();
      expect(circleStroke).to.be.a(Stroke);
      expect(circleStroke.getColor()).to.be('blue');

      expect(style.getFill()).to.be(null);
      expect(style.getStroke()).to.be(null);
      expect(style.getText()).to.be(null);
    });

    it('creates a style with a fill and stroke', () => {
      const style = toStyle({
        'fill-color': 'red',
        'stroke-width': 2,
        'stroke-color': 'green',
      });

      expect(style).to.be.a(Style);

      const fill = style.getFill();
      expect(fill).to.be.a(Fill);
      expect(fill.getColor()).to.be('red');

      const stroke = style.getStroke();
      expect(stroke).to.be.a(Stroke);
      expect(stroke.getWidth()).to.be(2);
      expect(stroke.getColor()).to.be('green');

      expect(style.getText()).to.be(null);
      expect(style.getImage()).to.be(null);
    });
  });
});
