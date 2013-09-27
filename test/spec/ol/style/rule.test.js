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
      expect(rule.applies(feature)).to.be(true);
    });

    it('returns false when the rule does not apply', function() {
      rule = new ol.style.Rule({
        filter: new ol.expr.Literal(false)
      });
      expect(rule.applies(feature)).to.be(false);
    });

    it('returns true when the rule applies', function() {
      rule = new ol.style.Rule({
        filter: new ol.expr.Literal(true)
      });
      expect(rule.applies(feature)).to.be(true);
    });
  });

});

goog.require('ol.Feature');
goog.require('ol.expr.Literal');
goog.require('ol.style.Rule');
