goog.provide('ol.test.control.MousePosition');

goog.require('ol.control.MousePosition');

describe('ol.control.MousePosition', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var instance = new ol.control.MousePosition();
      expect(instance).to.be.an(ol.control.MousePosition);
      expect(instance.element.className).to.be('ol-mouse-position');
    });

    it('creates the element with the provided class name', function() {
      var className = 'foobar';
      var instance = new ol.control.MousePosition({
        className: className
      });
      expect(instance.element.className).to.be(className);
    });

  });

});
