goog.provide('ol.test.style.Rule');

describe('ol.style.Rule', function() {

  describe('constructor', function() {

    it('accepts a filter option', function() {
      var rule = new ol.style.Rule({
        filter: 'foo == "bar"'
      });
      expect(rule).to.be.a(ol.style.Rule);
    });

    it('accepts a minResolution option', function() {
      var rule = new ol.style.Rule({
        minResolution: 10
      });
      expect(rule).to.be.a(ol.style.Rule);
    });

    it('accepts a maxResolution option', function() {
      var rule = new ol.style.Rule({
        maxResolution: 100
      });
      expect(rule).to.be.a(ol.style.Rule);
    });

  });

  describe('#applies()', function() {
    var feature = new ol.Feature(),
        rule;

    it('returns true for a rule without filter', function() {
      rule = new ol.style.Rule({});
      expect(rule.applies(feature, 1)).to.be(true);
    });

    it('returns false when the filter evaluates to false', function() {
      rule = new ol.style.Rule({
        filter: new ol.expr.Literal(false)
      });
      expect(rule.applies(feature, 1)).to.be(false);
    });

    it('returns true when the filter evaluates to true', function() {
      rule = new ol.style.Rule({
        filter: new ol.expr.Literal(true)
      });
      expect(rule.applies(feature, 1)).to.be(true);
    });

    it('returns false when the resolution is less than min', function() {
      rule = new ol.style.Rule({
        minResolution: 10
      });
      expect(rule.applies(feature, 9)).to.be(false);
    });

    it('returns true when the resolution is greater than min', function() {
      rule = new ol.style.Rule({
        minResolution: 10
      });
      expect(rule.applies(feature, 11)).to.be(true);
    });

    it('returns true when the resolution is equal to min', function() {
      rule = new ol.style.Rule({
        minResolution: 10
      });
      expect(rule.applies(feature, 10)).to.be(true);
    });

    it('returns false if filter evaluates to false (with min res)', function() {
      rule = new ol.style.Rule({
        filter: new ol.expr.Literal(false),
        minResolution: 10
      });
      expect(rule.applies(feature, 11)).to.be(false);
    });

    it('returns true if filter evaluates to true (with min res)', function() {
      rule = new ol.style.Rule({
        filter: new ol.expr.Literal(true),
        minResolution: 10
      });
      expect(rule.applies(feature, 11)).to.be(true);
    });

    it('returns false when the resolution is greater than max', function() {
      rule = new ol.style.Rule({
        maxResolution: 100
      });
      expect(rule.applies(feature, 101)).to.be(false);
    });

    it('returns true when the resolution is less than max', function() {
      rule = new ol.style.Rule({
        maxResolution: 100
      });
      expect(rule.applies(feature, 99)).to.be(true);
    });

    it('returns false when the resolution is equal to max', function() {
      rule = new ol.style.Rule({
        maxResolution: 100
      });
      expect(rule.applies(feature, 100)).to.be(false);
    });

    it('returns false if filter evaluates to false (with max res)', function() {
      rule = new ol.style.Rule({
        filter: new ol.expr.Literal(false),
        maxResolution: 100
      });
      expect(rule.applies(feature, 99)).to.be(false);
    });

    it('returns true if filter evaluates to true (with max res)', function() {
      rule = new ol.style.Rule({
        filter: new ol.expr.Literal(true),
        maxResolution: 100
      });
      expect(rule.applies(feature, 99)).to.be(true);
    });

    it('returns true if resolution is between min and max', function() {
      rule = new ol.style.Rule({
        minResolution: 10,
        maxResolution: 100
      });
      expect(rule.applies(feature, 55)).to.be(true);
    });

    it('returns false if resolution is greater than min and max', function() {
      rule = new ol.style.Rule({
        minResolution: 10,
        maxResolution: 100
      });
      expect(rule.applies(feature, 1000)).to.be(false);
    });

    it('returns false if resolution is less than min and max', function() {
      rule = new ol.style.Rule({
        minResolution: 10,
        maxResolution: 100
      });
      expect(rule.applies(feature, 5)).to.be(false);
    });

  });

});

goog.require('ol.Feature');
goog.require('ol.expr.Literal');
goog.require('ol.style.Rule');
