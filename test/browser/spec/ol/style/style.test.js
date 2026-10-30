import {assert} from 'chai';
import Feature from '../../../../../src/ol/Feature.js';
import Point from '../../../../../src/ol/geom/Point.js';
import CircleStyle from '../../../../../src/ol/style/Circle.js';
import Fill from '../../../../../src/ol/style/Fill.js';
import Stroke from '../../../../../src/ol/style/Stroke.js';
import Style, {toFunction} from '../../../../../src/ol/style/Style.js';
import Text from '../../../../../src/ol/style/Text.js';

describe('ol.style.Style', function () {
  const testFill = new Fill({
    color: 'rgba(255, 255, 255, 0.6)',
  });

  const testStroke = new Stroke({
    color: '#319FD3',
    width: 1,
  });

  const testText = new Text({
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: '#000',
    }),
    stroke: new Stroke({
      color: '#fff',
      width: 3,
    }),
  });

  const testImage = new CircleStyle({
    radius: 5,
  });

  describe('#clone', function () {
    it('creates a new ol.style.Style', function () {
      const original = new Style();
      const clone = original.clone();
      assert.instanceOf(clone, Style);
      assert.notEqual(clone, original);
    });

    it('copies all values', function () {
      const original = new Style({
        geometry: new Point([0, 0, 0]),
        fill: new Fill({
          color: '#319FD3',
        }),
        image: new CircleStyle({
          radius: 5,
        }),
        renderer: function (pixelCoordinates, state) {
          const geometry = state.geometry.clone();
          geometry.setCoordinates(pixelCoordinates);
        },
        stroke: new Stroke({
          color: '#319FD3',
        }),
        text: new Text({
          text: 'test',
        }),
        zIndex: 2,
      });
      const clone = original.clone();
      assert.deepEqual(
        original.getGeometry().getCoordinates(),
        clone.getGeometry().getCoordinates(),
      );
      assert.deepEqual(
        original.getFill().getColor(),
        clone.getFill().getColor(),
      );
      assert.deepEqual(
        original.getImage().getRadius(),
        clone.getImage().getRadius(),
      );
      assert.deepEqual(original.getRenderer(), clone.getRenderer());
      assert.deepEqual(
        original.getStroke().getColor(),
        clone.getStroke().getColor(),
      );
      assert.deepEqual(original.getText().getText(), clone.getText().getText());
      assert.deepEqual(original.getZIndex(), clone.getZIndex());
    });

    it('the clone does not reference the same objects as the original', function () {
      const original = new Style({
        geometry: new Point([0, 0, 0]),
        fill: new Fill({
          color: '#319FD3',
        }),
        image: new CircleStyle({
          radius: 5,
        }),
        renderer: function (pixelCoordinates, state) {
          const geometry = state.geometry.clone();
          geometry.setCoordinates(pixelCoordinates);
        },
        stroke: new Stroke({
          color: '#319FD3',
        }),
        text: new Text({
          text: 'test',
        }),
      });
      const clone = original.clone();
      assert.notEqual(original.getGeometry(), clone.getGeometry());
      assert.notEqual(original.getFill(), clone.getFill());
      assert.notEqual(original.getImage(), clone.getImage());
      assert.notEqual(original.getStroke(), clone.getStroke());
      assert.notEqual(original.getText(), clone.getText());

      clone.getGeometry().setCoordinates([1, 1, 1]);
      clone.getFill().setColor('#012345');
      clone.getImage().setScale(2);
      clone.setRenderer(function (pixelCoordinates, state) {
        return;
      });
      clone.getStroke().setColor('#012345');
      clone.getText().setText('other');
      assert.notDeepEqual(
        original.getGeometry().getCoordinates(),
        clone.getGeometry().getCoordinates(),
      );
      assert.notDeepEqual(
        original.getFill().getColor(),
        clone.getFill().getColor(),
      );
      assert.notDeepEqual(
        original.getImage().getScale(),
        clone.getImage().getScale(),
      );
      assert.notDeepEqual(original.getRenderer(), clone.getRenderer());
      assert.notDeepEqual(
        original.getStroke().getColor(),
        clone.getStroke().getColor(),
      );
      assert.notDeepEqual(
        original.getText().getText(),
        clone.getText().getText(),
      );
    });
  });

  describe('#setZIndex', function () {
    it('sets the zIndex', function () {
      const style = new Style();

      style.setZIndex(0.7);
      assert.strictEqual(style.getZIndex(), 0.7);
    });
  });

  describe('#getFill', function () {
    const style = new Style({
      fill: testFill,
    });

    it('returns the fill style of a style', function () {
      assert.deepEqual(style.getFill(), testFill);
    });
  });

  describe('#setFill', function () {
    const style = new Style();

    it('sets the fill style of a style', function () {
      style.setFill(testFill);
      assert.deepEqual(style.getFill(), testFill);
    });
  });

  describe('#getImage', function () {
    const style = new Style({
      image: testImage,
    });

    it('returns the image style of a style', function () {
      assert.deepEqual(style.getImage(), testImage);
    });
  });

  describe('#setImage', function () {
    const style = new Style();

    it('sets the image style of a style', function () {
      style.setImage(testImage);
      assert.deepEqual(style.getImage(), testImage);
    });
  });

  describe('#getStroke', function () {
    const style = new Style({
      stroke: testStroke,
    });

    it('returns the stroke style of a style', function () {
      assert.deepEqual(style.getStroke(), testStroke);
    });
  });

  describe('#setStroke', function () {
    const style = new Style();

    it('sets the stroke style of a style', function () {
      style.setStroke(testStroke);
      assert.deepEqual(style.getStroke(), testStroke);
    });
  });

  describe('#getText', function () {
    const style = new Style({
      text: testText,
    });

    it('returns the text style of a style', function () {
      assert.deepEqual(style.getText(), testText);
    });
  });

  describe('#setText', function () {
    const style = new Style();

    it('sets the text style of a style', function () {
      style.setText(testText);
      assert.deepEqual(style.getText(), testText);
    });
  });

  describe('#setGeometry', function () {
    const style = new Style();

    it('creates a geometry function from a string', function () {
      const feature = new Feature();
      feature.set('myGeom', new Point([0, 0]));
      style.setGeometry('myGeom');
      assert.deepEqual(
        style.getGeometryFunction()(feature),
        feature.get('myGeom'),
      );
    });

    it('creates a geometry function from a geometry', function () {
      const geom = new Point([0, 0]);
      style.setGeometry(geom);
      assert.deepEqual(style.getGeometryFunction()(), geom);
    });

    it('returns the configured geometry function', function () {
      const geom = new Point([0, 0]);
      style.setGeometry(function () {
        return geom;
      });
      assert.deepEqual(style.getGeometryFunction()(), geom);
    });
  });

  describe('#getGeometry', function () {
    it('returns whatever was passed to setGeometry', function () {
      const style = new Style();
      style.setGeometry('foo');
      assert.deepEqual(style.getGeometry(), 'foo');
      const geom = new Point([1, 2]);
      style.setGeometry(geom);
      assert.deepEqual(style.getGeometry(), geom);
      const fn = function () {
        return geom;
      };
      style.setGeometry(fn);
      assert.deepEqual(style.getGeometry(), fn);
      style.setGeometry(null);
      assert.deepEqual(style.getGeometry(), null);
    });
  });
});

describe('toFunction()', function () {
  const style = new Style();

  it('creates a style function from a single style', function () {
    const styleFunction = toFunction(style);
    assert.deepEqual(styleFunction(), [style]);
  });

  it('creates a style function from an array of styles', function () {
    const styleFunction = toFunction([style]);
    assert.deepEqual(styleFunction(), [style]);
  });

  it('passes through a function', function () {
    const original = function () {
      return [style];
    };
    const styleFunction = toFunction(original);
    assert.strictEqual(styleFunction, original);
  });

  it('throws on (some) unexpected input', function () {
    assert.throws(function () {
      toFunction({bogus: 'input'});
    });
  });
});
