

import _ol_Map_ from '../../../../src/ol/map';
import _ol_control_Control_ from '../../../../src/ol/control/control';

describe('ol.control.Control', function() {
  var map, control;

  beforeEach(function() {
    map = new _ol_Map_({
      target: document.createElement('div')
    });
    var element = document.createElement('DIV');
    control = new _ol_control_Control_({element: element});
    control.setMap(map);
  });

  afterEach(function() {
    disposeMap(map);
    map = null;
    control = null;
  });

  describe('dispose', function() {
    it('removes the control element from its parent', function() {
      control.dispose();
      expect(control.element.parentNode).to.be(null);
    });
  });
});

describe('ol.control.Control\'s target', function() {
  describe('target as string or element', function() {
    it('transforms target from string to element', function() {
      var target = document.createElement('div');
      target.id = 'mycontrol';
      document.body.appendChild(target);
      var ctrl = new _ol_control_Control_({target: 'mycontrol'});
      expect(ctrl.target_.id).to.equal('mycontrol');
      ctrl.dispose();
      target.parentNode.removeChild(target);
    });
    it('accepts element for target', function() {
      var target = document.createElement('div');
      target.id = 'mycontrol';
      document.body.appendChild(target);
      var ctrl = new _ol_control_Control_({target: target});
      expect(ctrl.target_.id).to.equal('mycontrol');
      ctrl.dispose();
      target.parentNode.removeChild(target);
    });
    it('ignores non-existing target id', function() {
      var ctrl = new _ol_control_Control_({target: 'doesnotexist'});
      expect(ctrl.target_).to.equal(null);
      ctrl.dispose();
    });
  });
});
