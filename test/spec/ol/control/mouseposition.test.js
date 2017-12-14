import MousePosition from '../../../../src/ol/control/MousePosition.js';

describe('ol.control.MousePosition', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var instance = new MousePosition();
      expect(instance).to.be.an(MousePosition);
      expect(instance.element.className).to.be('ol-mouse-position');
    });

    it('creates the element with the provided class name', function() {
      var className = 'foobar';
      var instance = new MousePosition({
        className: className
      });
      expect(instance.element.className).to.be(className);
    });

  });

});
