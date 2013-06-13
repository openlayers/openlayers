goog.provide('ol.test.filter.Comparison');


describe('ol.filter.Comparison', function() {

  describe('#equal', function() {
    it('equal to works as expected', function() {
      var feature = new ol.Feature({'foo': 'bar'});
      var filter = new ol.filter.Comparison({
        type: ol.filter.ComparisonType.EQUAL_TO,
        property: 'foo',
        value: 'bar'
      });
      expect(filter.applies(feature)).to.be(true);
      feature = new ol.Feature({'foo': 'baz'});
      expect(filter.applies(feature)).to.be(false);
      filter = new ol.filter.Comparison({
        type: ol.filter.ComparisonType.EQUAL_TO,
        property: 'foo',
        value: 15
      });
      feature = new ol.Feature({'foo': 15});
      expect(filter.applies(feature)).to.be(true);
      feature = new ol.Feature({'foo': 25});
      expect(filter.applies(feature)).to.be(false);
    });
  });

  describe('#notequal', function() {
    it('not equal to works as expected', function() {
      var feature = new ol.Feature({'foo': 'bar'});
      var filter = new ol.filter.Comparison({
        type: ol.filter.ComparisonType.NOT_EQUAL_TO,
        property: 'foo',
        value: 'bar'
      });
      expect(filter.applies(feature)).to.be(false);
      feature = new ol.Feature({'foo': 'baz'});
      expect(filter.applies(feature)).to.be(true);
      filter = new ol.filter.Comparison({
        type: ol.filter.ComparisonType.NOT_EQUAL_TO,
        property: 'foo',
        value: 15
      });
      feature = new ol.Feature({'foo': 15});
      expect(filter.applies(feature)).to.be(false);
      feature = new ol.Feature({'foo': 25});
      expect(filter.applies(feature)).to.be(true);
    });
  });

  describe('#greater than', function() {
    it('greater than works as expected', function() {
      var feature = new ol.Feature({'foo': 15});
      var filter = new ol.filter.Comparison({
        type: ol.filter.ComparisonType.GREATER_THAN,
        property: 'foo',
        value: 10
      });
      expect(filter.applies(feature)).to.be(true);
      feature = new ol.Feature({'foo': 5});
      expect(filter.applies(feature)).to.be(false);
      feature = new ol.Feature({'foo': 10});
      expect(filter.applies(feature)).to.be(false);
    });
  });

  describe('#greater than or equal to', function() {
    it('greater than or equal to works as expected', function() {
      var feature = new ol.Feature({'foo': 10});
      var filter = new ol.filter.Comparison({
        type: ol.filter.ComparisonType.GREATER_THAN_OR_EQUAL_TO,
        property: 'foo',
        value: 10
      });
      expect(filter.applies(feature)).to.be(true);
    });
  });

  describe('#less than', function() {
    it('less than works as expected', function() {
      var feature = new ol.Feature({'foo': 15});
      var filter = new ol.filter.Comparison({
        type: ol.filter.ComparisonType.LESS_THAN,
        property: 'foo',
        value: 10
      });
      expect(filter.applies(feature)).to.be(false);
      feature = new ol.Feature({'foo': 5});
      expect(filter.applies(feature)).to.be(true);
      feature = new ol.Feature({'foo': 10});
      expect(filter.applies(feature)).to.be(false);
    });
  });

  describe('#less than or equal to', function() {
    it('less than or equal to works as expected', function() {
      var feature = new ol.Feature({'foo': 10});
      var filter = new ol.filter.Comparison({
        type: ol.filter.ComparisonType.LESS_THAN_OR_EQUAL_TO,
        property: 'foo',
        value: 10
      });
      expect(filter.applies(feature)).to.be(true);
    });
  });

  describe('#between', function() {
    it('between filtering works as expected', function() {
      var feature = new ol.Feature({'foo': 10});
      var filter = new ol.filter.Comparison({
        type: ol.filter.ComparisonType.BETWEEN,
        property: 'foo',
        lowerBoundary: 5,
        upperBoundary: 15
      });
      expect(filter.applies(feature)).to.be(true);
      feature = new ol.Feature({'foo': 5});
      expect(filter.applies(feature)).to.be(true);
      feature = new ol.Feature({'foo': 15});
      expect(filter.applies(feature)).to.be(true);
      feature = new ol.Feature({'foo': 20});
      expect(filter.applies(feature)).to.be(false);
      feature = new ol.Feature({'foo': 4});
      expect(filter.applies(feature)).to.be(false);
    });
  });

  describe('#value2regex', function() {
    it('value2regex works as expected', function() {
      var filter = new ol.filter.Comparison({
        type: ol.filter.ComparisonType.LIKE,
        property: 'foo',
        value: '*b?r\\*\\?*'
      });
      filter.value2regex('*', '?', '\\');
      expect(filter.value_).to.eql('.*b.r\\*\\?.*');
      filter.value_ = '%b.r!%!.%';
      filter.value2regex('%', '.', '!');
      expect(filter.value_).to.eql('.*b.r\\%\\..*');
      filter.value_ = '!!';
      filter.value2regex();
      expect(filter.value_).to.eql('\\!');
      filter.value_ = '!!c!!!d!e';
      filter.value2regex();
      expect(filter.value_).to.eql('\\!c\\!\\d\\e');
    });
  });

  describe('#isnull', function() {
    it('is null filtering works as expected', function() {
      var feature = new ol.Feature({'foo': null});
      var filter = new ol.filter.Comparison({
        type: ol.filter.ComparisonType.IS_NULL,
        property: 'foo'
      });
      expect(filter.applies(feature)).to.be(true);
      feature = new ol.Feature({'foo': undefined});
      expect(filter.applies(feature)).to.be(false);
      feature = new ol.Feature({'foo': 'bar'});
      expect(filter.applies(feature)).to.be(false);
    });
  });

});

goog.require('ol.Feature');
goog.require('ol.filter.Comparison');
goog.require('ol.filter.ComparisonType');
