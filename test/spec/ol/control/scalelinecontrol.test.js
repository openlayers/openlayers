goog.provide('ol.test.control.ScaleLine');

describe('ol.control.ScaleLine', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var instance = new ol.control.ScaleLine();
      expect(instance).to.be.an(ol.control.ScaleLine);
    });

  });

});

goog.require('ol.control.ScaleLine');
