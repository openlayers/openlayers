import Feature, {createStyleFunction} from '../../../src/ol/Feature.js';
import Point from '../../../src/ol/geom/Point.js';
import {isEmpty} from '../../../src/ol/obj.js';
import Style from '../../../src/ol/style/Style.js';


describe('ol.Feature', () => {

  describe('constructor', () => {

    test('creates a new feature', () => {
      const feature = new Feature();
      expect(feature).toBeInstanceOf(Feature);
    });

    test('takes properties', () => {
      const feature = new Feature({
        foo: 'bar'
      });
      expect(feature.get('foo')).toBe('bar');
    });

    test('can store the feature\'s commonly used id', () => {
      const feature = new Feature();
      feature.setId('foo');
      expect(feature.getId()).toBe('foo');
    });

    test('will set the default geometry', () => {
      const feature = new Feature({
        geometry: new Point([10, 20]),
        foo: 'bar'
      });
      const geometry = feature.getGeometry();
      expect(geometry).toBeInstanceOf(Point);
      expect(feature.get('geometry')).toBe(geometry);
    });

  });

  describe('#get()', () => {

    test('returns values set at construction', () => {
      const feature = new Feature({
        a: 'first',
        b: 'second'
      });
      expect(feature.get('a')).toBe('first');
      expect(feature.get('b')).toBe('second');
    });

    test('returns undefined for unset attributes', () => {
      const feature = new Feature();
      expect(feature.get('a')).toBe(undefined);
    });

    test('returns values set by set', () => {
      const feature = new Feature();
      feature.set('a', 'b');
      expect(feature.get('a')).toBe('b');
    });

  });

  describe('#getProperties()', () => {

    test('returns an object with all attributes', () => {
      const point = new Point([15, 30]);
      const feature = new Feature({
        foo: 'bar',
        ten: 10,
        geometry: point
      });

      const attributes = feature.getProperties();

      const keys = Object.keys(attributes);
      expect(keys.sort()).toEqual(['foo', 'geometry', 'ten']);

      expect(attributes.foo).toBe('bar');
      expect(attributes.geometry).toBe(point);
      expect(attributes.ten).toBe(10);
    });

    test('is empty by default', () => {
      const feature = new Feature();
      const properties = feature.getProperties();
      expect(isEmpty(properties)).toBe(true);
    });

  });


  describe('#getGeometry()', () => {

    const point = new Point([15, 30]);

    test('returns undefined for unset geometry', () => {
      const feature = new Feature();
      expect(feature.getGeometry()).toBe(undefined);
    });

    test('returns null for null geometry (constructor)', () => {
      const feature = new Feature(null);
      expect(feature.getGeometry()).toBe(undefined);
    });

    test('returns null for null geometry (setGeometry())', () => {
      const feature = new Feature();
      feature.setGeometry(null);
      expect(feature.getGeometry()).toBe(null);
    });

    test('gets the geometry set at construction', () => {
      const feature = new Feature({
        geometry: point
      });
      expect(feature.getGeometry()).toBe(point);
    });

    test('gets any geometry set by setGeometry', () => {
      const feature = new Feature();
      feature.setGeometry(point);
      expect(feature.getGeometry()).toBe(point);

      const point2 = new Point([1, 2]);
      feature.setGeometry(point2);
      expect(feature.getGeometry()).toBe(point2);
    });

  });

  describe('#set()', () => {

    test('sets values', () => {
      const feature = new Feature({
        a: 'first',
        b: 'second'
      });
      feature.set('a', 'new');
      expect(feature.get('a')).toBe('new');
    });

    test('can be used to set the geometry', () => {
      const point = new Point([3, 4]);
      const feature = new Feature({
        geometry: new Point([1, 2])
      });
      feature.set('geometry', point);
      expect(feature.get('geometry')).toBe(point);
      expect(feature.getGeometry()).toBe(point);
    });

    test('can be used to set attributes with arbitrary names', () => {

      const feature = new Feature();

      feature.set('toString', 'string');
      expect(feature.get('toString')).toBe('string');
      expect(typeof feature.toString).toBe('function');

      feature.set('getGeometry', 'x');
      expect(feature.get('getGeometry')).toBe('x');

      feature.set('geometry', new Point([1, 2]));
      expect(feature.getGeometry()).toBeInstanceOf(Point);

    });

  });

  describe('#setGeometry()', () => {

    const point = new Point([15, 30]);

    test('sets the default geometry', () => {
      const feature = new Feature();
      feature.setGeometry(point);
      expect(feature.get('geometry')).toBe(point);
    });

    test('replaces previous default geometry', () => {
      const feature = new Feature({
        geometry: point
      });
      expect(feature.getGeometry()).toBe(point);

      const point2 = new Point([1, 2]);
      feature.setGeometry(point2);
      expect(feature.getGeometry()).toBe(point2);
    });

  });

  describe('#setGeometryName()', () => {

    const point = new Point([15, 30]);

    test('sets property where to to look at geometry', () => {
      const feature = new Feature();
      feature.setGeometry(point);
      expect(feature.getGeometry()).toBe(point);

      const point2 = new Point([1, 2]);
      feature.set('altGeometry', point2);
      expect(feature.getGeometry()).toBe(point);
      feature.setGeometryName('altGeometry');
      expect(feature.getGeometry()).toBe(point2);

      feature.on('change', function() {
        expect.fail();
      });
      point.setCoordinates([0, 2]);
    });

    test('changes property listener', () => {
      const feature = new Feature();
      feature.setGeometry(point);
      const point2 = new Point([1, 2]);
      feature.set('altGeometry', point2);
      feature.setGeometryName('altGeometry');

      const spy = sinon.spy();
      feature.on('change', spy);
      point2.setCoordinates([0, 2]);
      expect(spy.callCount).toBe(1);
    });

    test('can use a different geometry name', () => {
      const feature = new Feature();
      feature.setGeometryName('foo');
      const point = new Point([10, 20]);
      feature.setGeometry(point);
      expect(feature.getGeometry()).toBe(point);
    });

  });

  describe('#setId()', () => {

    test('sets the feature identifier', () => {
      const feature = new Feature();
      expect(feature.getId()).toBe(undefined);
      feature.setId('foo');
      expect(feature.getId()).toBe('foo');
    });

    test('accepts a string or number', () => {
      const feature = new Feature();
      feature.setId('foo');
      expect(feature.getId()).toBe('foo');
      feature.setId(2);
      expect(feature.getId()).toBe(2);
    });

    test('dispatches the "change" event', done => {
      const feature = new Feature();
      feature.on('change', function() {
        expect(feature.getId()).toBe('foo');
        done();
      });
      feature.setId('foo');
    });

  });

  describe('#getStyleFunction()', () => {

    const styleFunction = function(feature, resolution) {
      return null;
    };

    test('returns undefined after construction', () => {
      const feature = new Feature();
      expect(feature.getStyleFunction()).toBe(undefined);
    });

    test('returns the function passed to setStyle', () => {
      const feature = new Feature();
      feature.setStyle(styleFunction);
      expect(feature.getStyleFunction()).toBe(styleFunction);
    });

    test('does not get confused with user "styleFunction" property', () => {
      const feature = new Feature();
      feature.set('styleFunction', 'foo');
      expect(feature.getStyleFunction()).toBe(undefined);
    });

    test('does not get confused with "styleFunction" option', () => {
      const feature = new Feature({
        styleFunction: 'foo'
      });
      expect(feature.getStyleFunction()).toBe(undefined);
    });

  });

  describe('#setStyle()', () => {

    const style = new Style();

    const styleFunction = function(feature, resolution) {
      return resolution;
    };

    test('accepts a single style', () => {
      const feature = new Feature();
      feature.setStyle(style);
      const func = feature.getStyleFunction();
      expect(func()).toEqual([style]);
    });

    test('accepts an array of styles', () => {
      const feature = new Feature();
      feature.setStyle([style]);
      const func = feature.getStyleFunction();
      expect(func()).toEqual([style]);
    });

    test('accepts a style function', () => {
      const feature = new Feature();
      feature.setStyle(styleFunction);
      expect(feature.getStyleFunction()).toBe(styleFunction);
      expect(feature.getStyleFunction()(feature, 42)).toBe(42);
    });

    test('accepts null', () => {
      const feature = new Feature();
      feature.setStyle(style);
      feature.setStyle(null);
      expect(feature.getStyle()).toBe(null);
      expect(feature.getStyleFunction()).toBe(undefined);
    });

    test('dispatches a change event', () => {
      const feature = new Feature();
      const spy = sinon.spy();
      feature.on('change', spy);
      feature.setStyle(style);
      expect(spy.callCount).toBe(1);
    });

  });

  describe('#getStyle()', () => {

    const style = new Style();

    const styleFunction = function(feature, resolution) {
      return null;
    };

    test('returns what is passed to setStyle', () => {
      const feature = new Feature();

      expect(feature.getStyle()).toBe(null);

      feature.setStyle(style);
      expect(feature.getStyle()).toBe(style);

      feature.setStyle([style]);
      expect(feature.getStyle()).toEqual([style]);

      feature.setStyle(styleFunction);
      expect(feature.getStyle()).toBe(styleFunction);

    });

    test('does not get confused with "style" option to constructor', () => {
      const feature = new Feature({
        style: 'foo'
      });

      expect(feature.getStyle()).toBe(null);
    });

    test('does not get confused with user set "style" property', () => {
      const feature = new Feature();
      feature.set('style', 'foo');

      expect(feature.getStyle()).toBe(null);
    });

  });

  describe('#clone', () => {

    test('correctly clones features', () => {
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
      expect(clone.get('fookey')).toBe('fooval');
      expect(clone.getId()).toBe(undefined);
      expect(clone.getGeometryName()).toBe('geom');
      const geometryClone = clone.getGeometry();
      expect(geometryClone).not.toBe(geometry);
      const coordinates = geometryClone.getFlatCoordinates();
      expect(coordinates[0]).toBe(1);
      expect(coordinates[1]).toBe(2);
      expect(clone.getStyle()).toBe(style);
      expect(clone.get('barkey')).toBe('barval');
    });

    test('correctly clones features with no geometry and no style', () => {
      const feature = new Feature();
      feature.set('fookey', 'fooval');

      const clone = feature.clone();
      expect(clone.get('fookey')).toBe('fooval');
      expect(clone.getGeometry()).toBe(undefined);
      expect(clone.getStyle()).toBe(null);
    });
  });

  describe('#setGeometry()', () => {

    test('dispatches a change event when geometry is set to null', () => {
      const feature = new Feature({
        geometry: new Point([0, 0])
      });
      const spy = sinon.spy();
      feature.on('change', spy);
      feature.setGeometry(null);
      expect(spy.callCount).toBe(1);
    });
  });

});

describe('ol.Feature.createStyleFunction()', () => {
  const style = new Style();

  test('creates a feature style function from a single style', () => {
    const styleFunction = createStyleFunction(style);
    expect(styleFunction()).toEqual([style]);
  });

  test('creates a feature style function from an array of styles', () => {
    const styleFunction = createStyleFunction([style]);
    expect(styleFunction()).toEqual([style]);
  });

  test('passes through a function', () => {
    const original = function(feature, resolution) {
      return [style];
    };
    const styleFunction = createStyleFunction(original);
    expect(styleFunction).toBe(original);
  });

  test('throws on (some) unexpected input', () => {
    expect(function() {
      createStyleFunction({bogus: 'input'});
    }).toThrow();
  });

});
