import expect from '../expect.js';
import {
  Circle,
  Fill,
  Icon,
  RegularShape,
  Stroke,
  Style,
  Text,
  style,
} from '../../../src/ol/style.js';

describe('ol/style.js', () => {
  describe('style()', () => {
    it('constructs a style with a fill', () => {
      const s = style({
        fill: {
          color: 'green',
        },
      });

      expect(s).to.be.an(Style);

      const fill = s.getFill();
      expect(fill).to.be.a(Fill);
      expect(fill.getColor()).to.be('green');
    });

    it('constructs a style with a stroke', () => {
      const s = style({
        stroke: {
          width: 42,
          color: 'blue',
        },
      });

      expect(s).to.be.an(Style);

      const stroke = s.getStroke();
      expect(stroke).to.be.a(Stroke);
      expect(stroke.getColor()).to.be('blue');
      expect(stroke.getWidth()).to.be(42);
    });

    it('constructs a style with a stroke and a fill', () => {
      const s = style({
        stroke: {
          width: 10,
          color: 'yellow',
        },
        fill: {
          color: 'orange',
        },
      });

      expect(s).to.be.an(Style);

      const stroke = s.getStroke();
      expect(stroke).to.be.a(Stroke);
      expect(stroke.getColor()).to.be('yellow');
      expect(stroke.getWidth()).to.be(10);

      const fill = s.getFill();
      expect(fill).to.be.a(Fill);
      expect(fill.getColor()).to.be('orange');
    });

    it('constructs a style with a text', () => {
      const s = style({
        text: {
          fill: {color: 'purple'},
        },
      });

      expect(s).to.be.an(Style);

      const text = s.getText();
      expect(text).to.be.a(Text);

      const fill = text.getFill();
      expect(fill.getColor()).to.be('purple');
    });

    it('constructs a style with an icon', () => {
      const s = style({
        icon: {
          src: 'https://example.com/icon.png',
        },
      });

      expect(s).to.be.an(Style);

      const icon = s.getImage();
      expect(icon).to.be.a(Icon);
      expect(icon.getSrc()).to.be('https://example.com/icon.png');
    });

    it('constructs a style with a circle', () => {
      const s = style({
        circle: {
          stroke: {color: 'black'},
        },
      });

      expect(s).to.be.an(Style);

      const circle = s.getImage();
      expect(circle).to.be.a(Circle);
      expect(circle.getRadius()).to.be(5);

      const stroke = circle.getStroke();
      expect(stroke).to.be.a(Stroke);
      expect(stroke.getColor()).to.be('black');
    });

    it('constructs a style with a shape', () => {
      const s = style({
        shape: {
          points: 10,
          stroke: {color: 'red'},
          fill: {color: 'white'},
          radius1: 12,
          radius2: 8,
        },
      });

      expect(s).to.be.an(Style);

      const shape = s.getImage();
      expect(shape).to.be.a(RegularShape);
      expect(shape.getRadius()).to.be(12);
      expect(shape.getRadius2()).to.be(8);

      const stroke = shape.getStroke();
      expect(stroke).to.be.a(Stroke);
      expect(stroke.getColor()).to.be('red');

      const fill = shape.getFill();
      expect(fill).to.be.a(Fill);
      expect(fill.getColor()).to.be('white');
    });
  });
});
