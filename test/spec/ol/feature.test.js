import Feature, {createStyleFunction} from '../../../src/ol/Feature.js';
import Point from '../../../src/ol/geom/Point.js';
import {isEmpty} from '../../../src/ol/obj.js';
import Style from '../../../src/ol/style/Style.js';


describe('ol.Feature', function() {

  describe('constructor', function() {

    it('creates a new feature', function() {
      const feature = new Feature();
      expect(feature).to.be.a(Feature);
    });

    it('takes properties', function() {
      const feature = new Feature({
        foo: 'bar'
      });
      expect(feature.get('foo')).to.be('bar');
    });

    it('can store the feature\'s commonly used id', function() {
      const feature = new Feature();
      feature.setId('foo');
      expect(feature.getId()).to.be('foo');
    });

    it('will set the default geometry', function() {
      const feature = new Feature({
        geometry: new Point([10, 20]),
        foo: 'bar'
      });
      const geometry = feature.getGeometry();
      expect(geometry).to.be.a(Point);
      expect(feature.get('geometry')).to.be(geometry);
    });

  });

  describe('#get()', function() {

    it('returns values set at construction', function() {
      const feature = new Feature({
        a: 'first',
        b: 'second'
      });
      expect(feature.get('a')).to.be('first');
      expect(feature.get('b')).to.be('second');
    });

    it('returns undefined for unset attributes', function() {
      const feature = new Feature();
      expect(feature.get('a')).to.be(undefined);
    });

    it('returns values set by set', function() {
      const feature = new Feature();
      feature.set('a', 'b');
      expect(feature.get('a')).to.be('b');
    });

  });

  describe('#getProperties()', function() {

    it('returns an object with all attributes', function() {
      const point = new Point([15, 30]);
      const feature = new Feature({
        foo: 'bar',
        ten: 10,
        geometry: point
      });

      const attributes = feature.getProperties();

      const keys = Object.keys(attributes);
      expect(keys.sort()).to.eql(['foo', 'geometry', 'ten']);

      expect(attributes.foo).to.be('bar');
      expect(attributes.geometry).to.be(point);
      expect(attributes.ten).to.be(10);
    });

    it('is empty by default', function() {
      const feature = new Feature();
      const properties = feature.getProperties();
      expect(isEmpty(properties)).to.be(true);
    });

  });


  describe('#getGeometry()', function() {

    const point = new Point([15, 30]);

    it('returns undefined for unset geometry', function() {
      const feature = new Feature();
      expect(feature.getGeometry()).to.be(undefined);
    });

    it('returns null for null geometry (constructor)', function() {
      const feature = new Feature(null);
      expect(feature.getGeometry()).to.be(undefined);
    });

    it('returns null for null geometry (setGeometry())', function() {
      const feature = new Feature();
      feature.setGeometry(null);
      expect(feature.getGeometry()).to.be(null);
    });

    it('gets the geometry set at construction', function() {
      const feature = new Feature({
        geometry: point
      });
      expect(feature.getGeometry()).to.be(point);
    });

    it('gets any geometry set by setGeometry', function() {
      const feature = new Feature();
      feature.setGeometry(point);
      expect(feature.getGeometry()).to.be(point);

      const point2 = new Point([1, 2]);
      feature.setGeometry(point2);
      expect(feature.getGeometry()).to.be(point2);
    });

  });

  describe('#set()', function() {

    it('sets values', function() {
      const feature = new Feature({
        a: 'first',
        b: 'second'
      });
      feature.set('a', 'new');
      expect(feature.get('a')).to.be('new');
    });

    it('can be used to set the geometry', function() {
      const point = new Point([3, 4]);
      const feature = new Feature({
        geometry: new Point([1, 2])
      });
      feature.set('geometry', point);
      expect(feature.get('geometry')).to.be(point);
      expect(feature.getGeometry()).to.be(point);
    });

    it('can be used to set attributes with arbitrary names', function() {

      const feature = new Feature();

      feature.set('toString', 'string');
      expect(feature.get('toString')).to.be('string');
      expect(typeof feature.toString).to.be('function');

      feature.set('getGeometry', 'x');
      expect(feature.get('getGeometry')).to.be('x');

      feature.set('geometry', new Point([1, 2]));
      expect(feature.getGeometry()).to.be.a(Point);

    });

  });

  describe('#setGeometry()', function() {

    const point = new Point([15, 30]);

    it('sets the default geometry', function() {
      const feature = new Feature();
      feature.setGeometry(point);
      expect(feature.get('geometry')).to.be(point);
    });

    it('replaces previous default geometry', function() {
      const feature = new Feature({
        geometry: point
      });
      expect(feature.getGeometry()).to.be(point);

      const point2 = new Point([1, 2]);
      feature.setGeometry(point2);
      expect(feature.getGeometry()).to.be(point2);
    });

  });

  describe('#setGeometryName()', function() {

    const point = new Point([15, 30]);

    it('sets property where to to look at geometry', function() {
      const feature = new Feature();
      feature.setGeometry(point);
      expect(feature.getGeometry()).to.be(point);

      const point2 = new Point([1, 2]);
      feature.set('altGeometry', point2);
      expect(feature.getGeometry()).to.be(point);
      feature.setGeometryName('altGeometry');
      expect(feature.getGeometry()).to.be(point2);

      feature.on('change', function() {
        expect.fail();
      });
      point.setCoordinates([0, 2]);
    });

    it('changes property listener', function() {
      const feature = new Feature();
      feature.setGeometry(point);
      const point2 = new Point([1, 2]);
      feature.set('altGeometry', point2);
      feature.setGeometryName('altGeometry');

      const spy = sinon.spy();
      feature.on('change', spy);
      point2.setCoordinates([0, 2]);
      expect(spy.callCount).to.be(1);
    });

    it('can use a different geometry name', function() {
      const feature = new Feature();
      feature.setGeometryName('foo');
      const point = new Point([10, 20]);
      feature.setGeometry(point);
      expect(feature.getGeometry()).to.be(point);
    });

  });

  describe('#setId()', function() {

    it('sets the feature identifier', function() {
      const feature = new Feature();
      expect(feature.getId()).to.be(undefined);
      feature.setId('foo');
      expect(feature.getId()).to.be('foo');
    });

    it('accepts a string or number', function() {
      const feature = new Feature();
      feature.setId('foo');
      expect(feature.getId()).to.be('foo');
      feature.setId(2);
      expect(feature.getId()).to.be(2);
    });

    it('dispatches the "change" event', function(done) {
      const feature = new Feature();
      feature.on('change', function() {
        expect(feature.getId()).to.be('foo');
        done();
      });
      feature.setId('foo');
    });

  });

  describe('#getStyleFunction()', function() {

    const styleFunction = function(feature, resolution) {
      return null;
    };

    it('returns undefined after construction', function() {
      const feature = new Feature();
      expect(feature.getStyleFunction()).to.be(undefined);
    });

    it('returns the function passed to setStyle', function() {
      const feature = new Feature();
      feature.setStyle(styleFunction);
      expect(feature.getStyleFunction()).to.be(styleFunction);
    });

    it('does not get confused with user "styleFunction" property', function() {
      const feature = new Feature();
      feature.set('styleFunction', 'foo');
      expect(feature.getStyleFunction()).to.be(undefined);
    });

    it('does not get confused with "styleFunction" option', function() {
      const feature = new Feature({
        styleFunction: 'foo'
      });
      expect(feature.getStyleFunction()).to.be(undefined);
    });

  });

  describe('#setStyle()', function() {

    const style = new Style();

    const styleFunction = function(feature, resolution) {
      return resolution;
    };

    it('accepts a single style', function() {
      const feature = new Feature();
      feature.setStyle(style);
      const func = feature.getStyleFunction();
      expect(func()).to.eql([style]);
    });

    it('accepts an array of styles', function() {
      const feature = new Feature();
      feature.setStyle([style]);
      const func = feature.getStyleFunction();
      expect(func()).to.eql([style]);
    });

    it('accepts a style function', function() {
      const feature = new Feature();
      feature.setStyle(styleFunction);
      expect(feature.getStyleFunction()).to.be(styleFunction);
      expect(feature.getStyleFunction()(feature, 42)).to.be(42);
    });

    it('accepts null', function() {
      const feature = new Feature();
      feature.setStyle(style);
      feature.setStyle(null);
      expect(feature.getStyle()).to.be(null);
      expect(feature.getStyleFunction()).to.be(undefined);
    });

    it('dispatches a change event', function() {
      const feature = new Feature();
      const spy = sinon.spy();
      feature.on('change', spy);
      feature.setStyle(style);
      expect(spy.callCount).to.be(1);
    });

  });

  describe('#getStyle()', function() {

    const style = new Style();

    const styleFunction = function(feature, resolution) {
      return null;
    };

    it('returns what is passed to setStyle', function() {
      const feature = new Feature();

      expect(feature.getStyle()).to.be(null);

      feature.setStyle(style);
      expect(feature.getStyle()).to.be(style);

      feature.setStyle([style]);
      expect(feature.getStyle()).to.eql([style]);

      feature.setStyle(styleFunction);
      expect(feature.getStyle()).to.be(styleFunction);

    });

    it('does not get confused with "style" option to constructor', function() {
      const feature = new Feature({
        style: 'foo'
      });

      expect(feature.getStyle()).to.be(null);
    });

    it('does not get confused with user set "style" property', function() {
      const feature = new Feature();
      feature.set('style', 'foo');

      expect(feature.getStyle()).to.be(null);
    });

  });

  describe('#clone', function() {

    it('correctly clones features', function() {
      const feature = new Feature();
      feature.setProperties({'fookey': 'fooval'});
      feature.setId(1);
      feature.setGeometryName('geom');
      const geometry = new Point([1, 2]);
      feature.setGeometry(geometry);
      const style = new Style({});
      feature.setStyle(style);
      feature.set('barkey', 'barval');

      const clone = feature.clone();
      expect(clone.get('fookey')).to.be('fooval');
      expect(clone.getId()).to.be(undefined);
      expect(clone.getGeometryName()).to.be('geom');
      const geometryClone = clone.getGeometry();
      expect(geometryClone).not.to.be(geometry);
      const coordinates = geometryClone.getFlatCoordinates();
      expect(coordinates[0]).to.be(1);
      expect(coordinates[1]).to.be(2);
      expect(clone.getStyle()).to.be(style);
      expect(clone.get('barkey')).to.be('barval');
    });

    it('correctly clones features with no geometry and no style', function() {
      const feature = new Feature();
      feature.set('fookey', 'fooval');

      const clone = feature.clone();
      expect(clone.get('fookey')).to.be('fooval');
      expect(clone.getGeometry()).to.be(undefined);
      expect(clone.getStyle()).to.be(null);
    });
  });

  describe('#setGeometry()', function() {

    it('dispatches a change event when geometry is set to null',
      function() {
        const feature = new Feature({
          geometry: new Point([0, 0])
        });
        const spy = sinon.spy();
        feature.on('change', spy);
        feature.setGeometry(null);
        expect(spy.callCount).to.be(1);
      });
  });

});

describe('ol.Feature.createStyleFunction()', function() {
  const style = new Style();

  it('creates a feature style function from a single style', function() {
    const styleFunction = createStyleFunction(style);
    expect(styleFunction()).to.eql([style]);
  });

  it('creates a feature style function from an array of styles', function() {
    const styleFunction = createStyleFunction([style]);
    expect(styleFunction()).to.eql([style]);
  });

  it('passes through a function', function() {
    const original = function(feature, resolution) {
      return [style];
    };
    const styleFunction = createStyleFunction(original);
    expect(styleFunction).to.be(original);
  });

  it('throws on (some) unexpected input', function() {
    expect(function() {
      createStyleFunction({bogus: 'input'});
    }).to.throwException();
  });

});
