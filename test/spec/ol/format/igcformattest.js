goog.provide('ol.test.format.IGC');


describe('ol.format.IGC', function() {

  var format;
  beforeEach(function() {
    format = new ol.format.IGC();
  });

  describe('#readFeature', function() {

    it('does not read invalid features', function() {
      expect(format.readFeature('invalid')).to.be(null);
    });

  });

  describe('#readFeatures', function() {

    it('does not read invalid features', function() {
      expect(format.readFeatures('invalid')).to.be.empty();
    });

  });

});

goog.require('ol.format.IGC');
