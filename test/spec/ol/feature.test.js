goog.provide('ol.test.Feature');

describe('ol.Feature', function() {

  describe('constructor', function() {

    it('creates a new feature', function() {
      var feature = new ol.Feature();
      expect(feature).to.be.a(ol.Feature);
    });

    it('takes attribute values', function() {
      var feature = new ol.Feature({
        foo: 'bar'
      });
      expect(feature.get('foo')).to.be('bar');
    });

    it('can store the feature\'s commonly used id', function() {
      var feature = new ol.Feature();
      feature.setId('foo');
      expect(feature.getId()).to.be('foo');
    });

    it('will set the default geometry', function() {
      var feature = new ol.Feature({
        loc: new ol.geom.Point([10, 20]),
        foo: 'bar'
      });
      var geometry = feature.getGeometry();
      expect(geometry).to.be.a(ol.geom.Point);
      expect(feature.get('loc')).to.be(geometry);
    });

  });

  describe('#get()', function() {

    it('returns values set at construction', function() {
      var feature = new ol.Feature({
        a: 'first',
        b: 'second'
      });
      expect(feature.get('a')).to.be('first');
      expect(feature.get('b')).to.be('second');
    });

    it('returns undefined for unset attributes', function() {
      var feature = new ol.Feature();
      expect(feature.get('a')).to.be(undefined);
    });

    it('returns values set by set', function() {
      var feature = new ol.Feature();
      feature.set('a', 'b');
      expect(feature.get('a')).to.be('b');
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
      expect(keys.sort()).to.eql(['foo', 'loc', 'ten']);

      expect(attributes.foo).to.be('bar');
      expect(attributes.loc).to.be(point);
      expect(attributes.ten).to.be(10);
    });

  });


  describe('#getGeometry()', function() {

    var point = new ol.geom.Point([15, 30]);

    it('returns null for no geometry', function() {
      var feature = new ol.Feature();
      expect(feature.getGeometry()).to.be(null);
    });

    it('gets the geometry set at construction', function() {
      var feature = new ol.Feature({
        geom: point
      });
      expect(feature.getGeometry()).to.be(point);
    });

    it('gets any geometry set by setGeometry', function() {
      var feature = new ol.Feature();
      feature.setGeometry(point);
      expect(feature.getGeometry()).to.be(point);

      var point2 = new ol.geom.Point([1, 2]);
      feature.setGeometry(point2);
      expect(feature.getGeometry()).to.be(point2);
    });

    it('gets the first geometry set by set', function() {
      var feature = new ol.Feature();
      feature.set('foo', point);
      expect(feature.getGeometry()).to.be(point);

      feature.set('bar', new ol.geom.Point([1, 2]));
      expect(feature.getGeometry()).to.be(point);
    });

  });

  describe('#set()', function() {

    it('sets values', function() {
      var feature = new ol.Feature({
        a: 'first',
        b: 'second'
      });
      feature.set('a', 'new');
      expect(feature.get('a')).to.be('new');
    });

    it('can be used to set the geometry', function() {
      var point = new ol.geom.Point([3, 4]);
      var feature = new ol.Feature({
        loc: new ol.geom.Point([1, 2])
      });
      feature.set('loc', point);
      expect(feature.get('loc')).to.be(point);
      expect(feature.getGeometry()).to.be(point);
    });

    it('can be used to set attributes with arbitrary names', function() {

      var feature = new ol.Feature();

      feature.set('toString', 'string');
      expect(feature.get('toString')).to.be('string');
      expect(typeof feature.toString).to.be('function');

      feature.set('getGeometry', 'x');
      expect(feature.get('getGeometry')).to.be('x');

      feature.set('geom', new ol.geom.Point([1, 2]));
      expect(feature.getGeometry()).to.be.a(ol.geom.Point);

    });

  });

  describe('#setGeometry()', function() {

    var point = new ol.geom.Point([15, 30]);

    it('sets the default geometry', function() {
      var feature = new ol.Feature();
      feature.setGeometry(point);
      expect(feature.get(ol.Feature.DEFAULT_GEOMETRY)).to.be(point);
    });

    it('replaces previous default geometry', function() {
      var feature = new ol.Feature({
        geom: point
      });
      expect(feature.getGeometry()).to.be(point);

      var point2 = new ol.geom.Point([1, 2]);
      feature.setGeometry(point2);
      expect(feature.getGeometry()).to.be(point2);
    });

    it('gets any geometry set by setGeometry', function() {
      var feature = new ol.Feature();
      feature.setGeometry(point);
      expect(feature.getGeometry()).to.be(point);

      var point2 = new ol.geom.Point([1, 2]);
      feature.setGeometry(point2);
      expect(feature.getGeometry()).to.be(point2);
    });

    it('gets the first geometry set by set', function() {
      var feature = new ol.Feature();
      feature.set('foo', point);
      expect(feature.getGeometry()).to.be(point);

      feature.set('bar', new ol.geom.Point([1, 2]));
      expect(feature.getGeometry()).to.be(point);
    });

  });

});


goog.require('goog.object');
goog.require('ol.Feature');
goog.require('ol.geom.Point');
