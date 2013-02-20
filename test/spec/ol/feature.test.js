goog.provide('ol.test.Feature');

describe('ol.Feature', function() {

  describe('constructor', function() {

    it('creates a new feature', function() {
      var feature = new ol.Feature();
      expect(feature).toBeA(ol.Feature);
    });

    it('takes attribute values', function() {
      var feature = new ol.Feature({
        foo: 'bar'
      });
      expect(feature.get('foo')).toBe('bar');
    });

    it('will set the default geometry', function() {
      var feature = new ol.Feature({
        loc: new ol.geom.Point([10, 20]),
        foo: 'bar'
      });
      var geometry = feature.getGeometry();
      expect(geometry).toBeA(ol.geom.Point);
      expect(feature.get('loc')).toBe(geometry);
    });

  });

  describe('#get()', function() {

    it('returns values set at construction', function() {
      var feature = new ol.Feature({
        a: 'first',
        b: 'second'
      });
      expect(feature.get('a')).toBe('first');
      expect(feature.get('b')).toBe('second');
    });

    it('returns undefined for unset attributes', function() {
      var feature = new ol.Feature();
      expect(feature.get('a')).toBeUndefined();
    });

    it('returns values set by set', function() {
      var feature = new ol.Feature();
      feature.set('a', 'b');
      expect(feature.get('a')).toBe('b');
    });

  });

  describe('#getAttributes()', function() {

    it('returns an object with all attributes', function() {
      var point = new ol.geom.Point([15, 30]);
      var feature = new ol.Feature({
        foo: 'bar',
        ten: 10,
        loc: point
      });

      var attributes = feature.getAttributes();

      var keys = goog.object.getKeys(attributes);
      expect(keys.sort()).toEqual(['foo', 'loc', 'ten']);

      expect(attributes.foo).toBe('bar');
      expect(attributes.loc).toBe(point);
      expect(attributes.ten).toBe(10);
    });

  });


  describe('#getGeometry()', function() {

    var point = new ol.geom.Point([15, 30]);

    it('returns null for no geometry', function() {
      var feature = new ol.Feature();
      expect(feature.getGeometry()).toBeNull();
    });

    it('gets the geometry set at construction', function() {
      var feature = new ol.Feature({
        geom: point
      });
      expect(feature.getGeometry()).toBe(point);
    });

    it('gets any geometry set by setGeometry', function() {
      var feature = new ol.Feature();
      feature.setGeometry(point);
      expect(feature.getGeometry()).toBe(point);

      var point2 = new ol.geom.Point([1, 2]);
      feature.setGeometry(point2);
      expect(feature.getGeometry()).toBe(point2);
    });

    it('gets the first geometry set by set', function() {
      var feature = new ol.Feature();
      feature.set('foo', point);
      expect(feature.getGeometry()).toBe(point);

      feature.set('bar', new ol.geom.Point([1, 2]));
      expect(feature.getGeometry()).toBe(point);
    });

  });

  describe('#set()', function() {

    it('sets values', function() {
      var feature = new ol.Feature({
        a: 'first',
        b: 'second'
      });
      feature.set('a', 'new');
      expect(feature.get('a')).toBe('new');
    });

    it('can be used to set the geometry', function() {
      var point = new ol.geom.Point([3, 4]);
      var feature = new ol.Feature({
        loc: new ol.geom.Point([1, 2])
      });
      feature.set('loc', point);
      expect(feature.get('loc')).toBe(point);
      expect(feature.getGeometry()).toBe(point);
    });

  });

  describe('#setGeometry()', function() {

    var point = new ol.geom.Point([15, 30]);

    it('sets the default geometry', function() {
      var feature = new ol.Feature();
      feature.setGeometry(point);
      expect(feature.get(ol.Feature.DEFAULT_GEOMETRY)).toBe(point);
    });

    it('replaces previous default geometry', function() {
      var feature = new ol.Feature({
        geom: point
      });
      expect(feature.getGeometry()).toBe(point);

      var point2 = new ol.geom.Point([1, 2]);
      feature.setGeometry(point2);
      expect(feature.getGeometry()).toBe(point2);
    });

    it('gets any geometry set by setGeometry', function() {
      var feature = new ol.Feature();
      feature.setGeometry(point);
      expect(feature.getGeometry()).toBe(point);

      var point2 = new ol.geom.Point([1, 2]);
      feature.setGeometry(point2);
      expect(feature.getGeometry()).toBe(point2);
    });

    it('gets the first geometry set by set', function() {
      var feature = new ol.Feature();
      feature.set('foo', point);
      expect(feature.getGeometry()).toBe(point);

      feature.set('bar', new ol.geom.Point([1, 2]));
      expect(feature.getGeometry()).toBe(point);
    });

  });

});


goog.require('goog.object');
goog.require('ol.Feature');
goog.require('ol.geom.Point');
