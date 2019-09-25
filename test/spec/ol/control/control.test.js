import Map from '../../../../src/ol/Map.js';
import Control from '../../../../src/ol/control/Control.js';

describe('ol.control.Control', () => {
  let map, control;

  beforeEach(() => {
    map = new Map({
      target: document.createElement('div')
    });
    const element = document.createElement('div');
    control = new Control({element: element});
    control.setMap(map);
  });

  afterEach(() => {
    disposeMap(map);
    map = null;
    control = null;
  });

  describe('dispose', () => {
    test('removes the control element from its parent', () => {
      control.dispose();
      expect(control.element.parentNode).toBe(null);
    });
  });
});

describe('ol.control.Control\'s target', () => {
  describe('target as string or element', () => {
    test('transforms target from string to element', () => {
      const target = document.createElement('div');
      target.id = 'mycontrol';
      document.body.appendChild(target);
      const ctrl = new Control({target: 'mycontrol'});
      expect(ctrl.target_.id).toBe('mycontrol');
      ctrl.dispose();
      target.parentNode.removeChild(target);
    });
    test('accepts element for target', () => {
      const target = document.createElement('div');
      target.id = 'mycontrol';
      document.body.appendChild(target);
      const ctrl = new Control({target: target});
      expect(ctrl.target_.id).toBe('mycontrol');
      ctrl.dispose();
      target.parentNode.removeChild(target);
    });
    test('ignores non-existing target id', () => {
      const ctrl = new Control({target: 'doesnotexist'});
      expect(ctrl.target_).toBe(null);
      ctrl.dispose();
    });
  });
});
