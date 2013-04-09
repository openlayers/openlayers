goog.provide('ol.test.filter.Logical');


describe('ol.filter.Logical', function() {

  var OR = ol.filter.LogicalOperator.OR;
  var AND = ol.filter.LogicalOperator.AND;
  var NOT = ol.filter.LogicalOperator.NOT;
  var include = new ol.filter.Filter(function() {return true});
  var exclude = new ol.filter.Filter(function() {return false});

  var apple = new ol.Feature({});
  var orange = new ol.Feature({});
  var duck = new ol.Feature({});

  var isApple = new ol.filter.Filter(function(feature) {
    return feature === apple;
  });
  var isOrange = new ol.filter.Filter(function(feature) {
    return feature === orange;
  });
  var isDuck = new ol.filter.Filter(function(feature) {
    return feature === duck;
  });

  describe('constructor', function() {
    it('creates a new filter', function() {
      var filter = new ol.filter.Logical([include, exclude], OR);
      expect(filter).to.be.a(ol.filter.Logical);
    });
  });

  describe('#operator', function() {
    it('can be OR', function() {
      var filter = new ol.filter.Logical([include, exclude], OR);
      expect(filter.operator).to.be(OR);
    });

    it('can be AND', function() {
      var filter = new ol.filter.Logical([include, exclude], AND);
      expect(filter.operator).to.be(AND);
    });

    it('can be NOT', function() {
      var filter = new ol.filter.Logical([include], NOT);
      expect(filter.operator).to.be(NOT);
    });
  });

  describe('#applies', function() {

    it('works for OR', function() {
      var isFruit = new ol.filter.Logical([isApple, isOrange], OR);

      expect(isApple.applies(apple)).to.be(true);
      expect(isOrange.applies(apple)).to.be(false);
      expect(isFruit.applies(apple)).to.be(true);

      expect(isApple.applies(duck)).to.be(false);
      expect(isOrange.applies(duck)).to.be(false);
      expect(isFruit.applies(duck)).to.be(false);
    });

    it('works for AND', function() {
      expect(include.applies(apple)).to.be(true);
      expect(isApple.applies(apple)).to.be(true);
      expect(isDuck.applies(apple)).to.be(false);

      var pass = new ol.filter.Logical([include, isApple], AND);
      expect(pass.applies(apple)).to.be(true);

      var fail = new ol.filter.Logical([isApple, isDuck], AND);
      expect(fail.applies(apple)).to.be(false);
    });

    it('works for NOT', function() {
      expect(isApple.applies(apple)).to.be(true);
      expect(isDuck.applies(apple)).to.be(false);
      expect(isDuck.applies(duck)).to.be(true);
      expect(isDuck.applies(apple)).to.be(false);

      var notApple = new ol.filter.Logical([isApple], NOT);
      expect(notApple.applies(apple)).to.be(false);
      expect(notApple.applies(duck)).to.be(true);

      var notDuck = new ol.filter.Logical([isDuck], NOT);
      expect(notDuck.applies(apple)).to.be(true);
      expect(notDuck.applies(duck)).to.be(false);
    });
  });

});

describe('ol.filter.and', function() {
  it('creates the a logical AND filter', function() {
    var a = new ol.filter.Filter();
    var b = new ol.filter.Filter();
    var c = new ol.filter.Filter();
    var and = ol.filter.and(a, b, c);
    expect(and).to.be.a(ol.filter.Logical);
    expect(and.operator).to.be(ol.filter.LogicalOperator.AND);
    var filters = and.getFilters();
    expect(filters[0]).to.be(a);
    expect(filters[1]).to.be(b);
    expect(filters[2]).to.be(c);
  });
});

describe('ol.filter.not', function() {
  it('creates the logical compliment of another filter', function() {
    var include = new ol.filter.Filter(function() {return true;});
    var notInclude = ol.filter.not(include);
    expect(notInclude).to.be.a(ol.filter.Logical);
    expect(notInclude.applies()).to.be(false);

    var exclude = new ol.filter.Filter(function() {return false;});
    var notExclude = ol.filter.not(exclude);
    expect(notExclude).to.be.a(ol.filter.Logical);
    expect(notExclude.applies()).to.be(true);
  });
});

describe('ol.filter.or', function() {
  it('creates the a logical OR filter', function() {
    var a = new ol.filter.Filter();
    var b = new ol.filter.Filter();
    var c = new ol.filter.Filter();
    var and = ol.filter.or(a, b, c);
    expect(and).to.be.a(ol.filter.Logical);
    expect(and.operator).to.be(ol.filter.LogicalOperator.OR);
    var filters = and.getFilters();
    expect(filters[0]).to.be(a);
    expect(filters[1]).to.be(b);
    expect(filters[2]).to.be(c);
  });
});

goog.require('ol.Feature');
goog.require('ol.filter.Filter');
goog.require('ol.filter.Logical');
goog.require('ol.filter.LogicalOperator');
goog.require('ol.filter.and');
goog.require('ol.filter.not');
goog.require('ol.filter.or');
