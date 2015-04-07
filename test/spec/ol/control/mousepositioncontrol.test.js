goog.provide('ol.test.control.MousePosition');

describe('ol.control.MousePosition', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var instance = new ol.control.MousePosition();
      expect(instance).to.be.an(ol.control.MousePosition);
    });

  });

});

goog.require('ol.control.MousePosition');
