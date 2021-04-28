import CircleStyle from '../../../../../src/ol/style/Circle.js';
import Feature from '../../../../../src/ol/Feature.js';
import Fill from '../../../../../src/ol/style/Fill.js';
import Point from '../../../../../src/ol/geom/Point.js';
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
      expect(clone).to.be.an(Style);
      expect(clone).to.not.be(original);
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
      expect(original.getGeometry().getCoordinates()).to.eql(
        clone.getGeometry().getCoordinates()
      );
      expect(original.getFill().getColor()).to.eql(clone.getFill().getColor());
      expect(original.getImage().getRadius()).to.eql(
        clone.getImage().getRadius()
      );
      expect(original.getRenderer()).to.eql(clone.getRenderer());
      expect(original.getStroke().getColor()).to.eql(
        clone.getStroke().getColor()
      );
      expect(original.getText().getText()).to.eql(clone.getText().getText());
      expect(original.getZIndex()).to.eql(clone.getZIndex());
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
      expect(original.getGeometry()).not.to.be(clone.getGeometry());
      expect(original.getFill()).not.to.be(clone.getFill());
      expect(original.getImage()).not.to.be(clone.getImage());
      expect(original.getStroke()).not.to.be(clone.getStroke());
      expect(original.getText()).not.to.be(clone.getText());

      clone.getGeometry().setCoordinates([1, 1, 1]);
      clone.getFill().setColor('#012345');
      clone.getImage().setScale(2);
      clone.setRenderer(function (pixelCoordinates, state) {
        return;
      });
      clone.getStroke().setColor('#012345');
      clone.getText().setText('other');
      expect(original.getGeometry().getCoordinates()).not.to.eql(
        clone.getGeometry().getCoordinates()
      );
      expect(original.getFill().getColor()).not.to.eql(
        clone.getFill().getColor()
      );
      expect(original.getImage().getScale()).not.to.eql(
        clone.getImage().getScale()
      );
      expect(original.getRenderer()).not.to.eql(clone.getRenderer());
      expect(original.getStroke().getColor()).not.to.eql(
        clone.getStroke().getColor()
      );
      expect(original.getText().getText()).not.to.eql(
        clone.getText().getText()
      );
    });
  });

  describe('#setZIndex', function () {
    it('sets the zIndex', function () {
      const style = new Style();

      style.setZIndex(0.7);
      expect(style.getZIndex()).to.be(0.7);
    });
  });

  describe('#getFill', function () {
    const style = new Style({
      fill: testFill,
    });

    it('returns the fill style of a style', function () {
      expect(style.getFill()).to.eql(testFill);
    });
  });

  describe('#setFill', function () {
    const style = new Style();

    it('sets the fill style of a style', function () {
      style.setFill(testFill);
      expect(style.getFill()).to.eql(testFill);
    });
  });

  describe('#getImage', function () {
    const style = new Style({
      image: testImage,
    });

    it('returns the image style of a style', function () {
      expect(style.getImage()).to.eql(testImage);
    });
  });

  describe('#setImage', function () {
    const style = new Style();

    it('sets the image style of a style', function () {
      style.setImage(testImage);
      expect(style.getImage()).to.eql(testImage);
    });
  });

  describe('#getStroke', function () {
    const style = new Style({
      stroke: testStroke,
    });

    it('returns the stroke style of a style', function () {
      expect(style.getStroke()).to.eql(testStroke);
    });
  });

  describe('#setStroke', function () {
    const style = new Style();

    it('sets the stroke style of a style', function () {
      style.setStroke(testStroke);
      expect(style.getStroke()).to.eql(testStroke);
    });
  });

  describe('#getText', function () {
    const style = new Style({
      text: testText,
    });

    it('returns the text style of a style', function () {
      expect(style.getText()).to.eql(testText);
    });
  });

  describe('#setText', function () {
    const style = new Style();

    it('sets the text style of a style', function () {
      style.setText(testText);
      expect(style.getText()).to.eql(testText);
    });
  });

  describe('#setGeometry', function () {
    const style = new Style();

    it('creates a geometry function from a string', function () {
      const feature = new Feature();
      feature.set('myGeom', new Point([0, 0]));
      style.setGeometry('myGeom');
      expect(style.getGeometryFunction()(feature)).to.eql(
        feature.get('myGeom')
      );
    });

    it('creates a geometry function from a geometry', function () {
      const geom = new Point([0, 0]);
      style.setGeometry(geom);
      expect(style.getGeometryFunction()()).to.eql(geom);
    });

    it('returns the configured geometry function', function () {
      const geom = new Point([0, 0]);
      style.setGeometry(function () {
        return geom;
      });
      expect(style.getGeometryFunction()()).to.eql(geom);
    });
  });

  describe('#getGeometry', function () {
    it('returns whatever was passed to setGeometry', function () {
      const style = new Style();
      style.setGeometry('foo');
      expect(style.getGeometry()).to.eql('foo');
      const geom = new Point([1, 2]);
      style.setGeometry(geom);
      expect(style.getGeometry()).to.eql(geom);
      const fn = function () {
        return geom;
      };
      style.setGeometry(fn);
      expect(style.getGeometry()).to.eql(fn);
      style.setGeometry(null);
      expect(style.getGeometry()).to.eql(null);
    });
  });
});

describe('toFunction()', function () {
  const style = new Style();

  it('creates a style function from a single style', function () {
    const styleFunction = toFunction(style);
    expect(styleFunction()).to.eql([style]);
  });

  it('creates a style function from an array of styles', function () {
    const styleFunction = toFunction([style]);
    expect(styleFunction()).to.eql([style]);
  });

  it('passes through a function', function () {
    const original = function () {
      return [style];
    };
    const styleFunction = toFunction(original);
    expect(styleFunction).to.be(original);
  });

  it('throws on (some) unexpected input', function () {
    expect(function () {
      toFunction({bogus: 'input'});
    }).to.throwException();
  });
});
