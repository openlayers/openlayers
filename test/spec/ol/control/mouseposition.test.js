

import _ol_control_MousePosition_ from '../../../../src/ol/control/mouseposition';

describe('ol.control.MousePosition', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var instance = new _ol_control_MousePosition_();
      expect(instance).to.be.an(_ol_control_MousePosition_);
      expect(instance.element.className).to.be('ol-mouse-position');
    });

    it('creates the element with the provided class name', function() {
      var className = 'foobar';
      var instance = new _ol_control_MousePosition_({
        className: className
      });
      expect(instance.element.className).to.be(className);
    });

  });

});
