import Feature from '../../../../src/ol/Feature.js';
import Point from '../../../../src/ol/geom/Point.js';
import Style, {toFunction} from '../../../../src/ol/style/Style.js';
import Fill from '../../../../src/ol/style/Fill.js';
import CircleStyle from '../../../../src/ol/style/Circle.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Text from '../../../../src/ol/style/Text.js';


describe('ol.style.Style', () => {

  const testFill = new Fill({
    color: 'rgba(255, 255, 255, 0.6)'
  });

  const testStroke = new Stroke({
    color: '#319FD3',
    width: 1
  });

  const testText = new Text({
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: '#000'
    }),
    stroke: new Stroke({
      color: '#fff',
      width: 3
    })
  });

  const testImage = new CircleStyle({
    radius: 5
  });

  describe('#clone', () => {

    test('creates a new ol.style.Style', () => {
      const original = new Style();
      const clone = original.clone();
      expect(clone).toBeInstanceOf(Style);
      expect(clone).not.toBe(original);
    });

    test('copies all values', () => {
      const original = new Style({
        geometry: new Point([0, 0, 0]),
        fill: new Fill({
          color: '#319FD3'
        }),
        image: new CircleStyle({
          radius: 5
        }),
        stroke: new Stroke({
          color: '#319FD3'
        }),
        text: new Text({
          text: 'test'
        }),
        zIndex: 2
      });
      const clone = original.clone();
      expect(original.getGeometry().getCoordinates()).toEqual(clone.getGeometry().getCoordinates());
      expect(original.getFill().getColor()).toEqual(clone.getFill().getColor());
      expect(original.getImage().getRadius()).toEqual(clone.getImage().getRadius());
      expect(original.getStroke().getColor()).toEqual(clone.getStroke().getColor());
      expect(original.getText().getText()).toEqual(clone.getText().getText());
      expect(original.getZIndex()).toEqual(clone.getZIndex());
    });

    test(
      'the clone does not reference the same objects as the original',
      () => {
        const original = new Style({
          geometry: new Point([0, 0, 0]),
          fill: new Fill({
            color: '#319FD3'
          }),
          image: new CircleStyle({
            radius: 5
          }),
          stroke: new Stroke({
            color: '#319FD3'
          }),
          text: new Text({
            text: 'test'
          })
        });
        const clone = original.clone();
        expect(original.getGeometry()).not.toBe(clone.getGeometry());
        expect(original.getFill()).not.toBe(clone.getFill());
        expect(original.getImage()).not.toBe(clone.getImage());
        expect(original.getStroke()).not.toBe(clone.getStroke());
        expect(original.getText()).not.toBe(clone.getText());

        clone.getGeometry().setCoordinates([1, 1, 1]);
        clone.getFill().setColor('#012345');
        clone.getImage().setScale(2);
        clone.getStroke().setColor('#012345');
        clone.getText().setText('other');
        expect(original.getGeometry().getCoordinates()).not.toEqual(clone.getGeometry().getCoordinates());
        expect(original.getFill().getColor()).not.toEqual(clone.getFill().getColor());
        expect(original.getImage().getScale()).not.toEqual(clone.getImage().getScale());
        expect(original.getStroke().getColor()).not.toEqual(clone.getStroke().getColor());
        expect(original.getText().getText()).not.toEqual(clone.getText().getText());
      }
    );
  });

  describe('#setZIndex', () => {

    test('sets the zIndex', () => {
      const style = new Style();

      style.setZIndex(0.7);
      expect(style.getZIndex()).toBe(0.7);
    });
  });

  describe('#getFill', () => {
    const style = new Style({
      fill: testFill
    });

    test('returns the fill style of a style', () => {
      expect(style.getFill()).toEqual(testFill);
    });
  });

  describe('#setFill', () => {
    const style = new Style();

    test('sets the fill style of a style', () => {
      style.setFill(testFill);
      expect(style.getFill()).toEqual(testFill);
    });
  });

  describe('#getImage', () => {
    const style = new Style({
      image: testImage
    });

    test('returns the image style of a style', () => {
      expect(style.getImage()).toEqual(testImage);
    });
  });

  describe('#setImage', () => {
    const style = new Style();

    test('sets the image style of a style', () => {
      style.setImage(testImage);
      expect(style.getImage()).toEqual(testImage);
    });
  });

  describe('#getStroke', () => {
    const style = new Style({
      stroke: testStroke
    });

    test('returns the stroke style of a style', () => {
      expect(style.getStroke()).toEqual(testStroke);
    });
  });

  describe('#setStroke', () => {
    const style = new Style();

    test('sets the stroke style of a style', () => {
      style.setStroke(testStroke);
      expect(style.getStroke()).toEqual(testStroke);
    });
  });

  describe('#getText', () => {
    const style = new Style({
      text: testText
    });

    test('returns the text style of a style', () => {
      expect(style.getText()).toEqual(testText);
    });
  });

  describe('#setText', () => {
    const style = new Style();

    test('sets the text style of a style', () => {
      style.setText(testText);
      expect(style.getText()).toEqual(testText);
    });
  });

  describe('#setGeometry', () => {
    const style = new Style();

    test('creates a geometry function from a string', () => {
      const feature = new Feature();
      feature.set('myGeom', new Point([0, 0]));
      style.setGeometry('myGeom');
      expect(style.getGeometryFunction()(feature)).toEqual(feature.get('myGeom'));
    });

    test('creates a geometry function from a geometry', () => {
      const geom = new Point([0, 0]);
      style.setGeometry(geom);
      expect(style.getGeometryFunction()()).toEqual(geom);
    });

    test('returns the configured geometry function', () => {
      const geom = new Point([0, 0]);
      style.setGeometry(function() {
        return geom;
      });
      expect(style.getGeometryFunction()()).toEqual(geom);
    });
  });

  describe('#getGeometry', () => {

    test('returns whatever was passed to setGeometry', () => {
      const style = new Style();
      style.setGeometry('foo');
      expect(style.getGeometry()).toEqual('foo');
      const geom = new Point([1, 2]);
      style.setGeometry(geom);
      expect(style.getGeometry()).toEqual(geom);
      const fn = function() {
        return geom;
      };
      style.setGeometry(fn);
      expect(style.getGeometry()).toEqual(fn);
      style.setGeometry(null);
      expect(style.getGeometry()).toEqual(null);
    });

  });

});

describe('toFunction()', () => {
  const style = new Style();

  test('creates a style function from a single style', () => {
    const styleFunction = toFunction(style);
    expect(styleFunction()).toEqual([style]);
  });

  test('creates a style function from an array of styles', () => {
    const styleFunction = toFunction([style]);
    expect(styleFunction()).toEqual([style]);
  });

  test('passes through a function', () => {
    const original = function() {
      return [style];
    };
    const styleFunction = toFunction(original);
    expect(styleFunction).toBe(original);
  });

  test('throws on (some) unexpected input', () => {
    expect(function() {
      toFunction({bogus: 'input'});
    }).toThrow();
  });

});
