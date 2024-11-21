import Control from '../../../../../src/ol/control/Control.js';
import Map from '../../../../../src/ol/Map.js';

describe('ol.control.Control', function () {
  let map, control;

  beforeEach(function () {
    map = new Map({
      target: document.createElement('div'),
    });
    const element = document.createElement('div');
    control = new Control({element: element});
    control.setMap(map);
  });

  afterEach(function () {
    disposeMap(map);
    map = null;
    control = null;
  });

  describe('dispose', function () {
    it('removes the control element from its parent', function () {
      control.dispose();
      expect(control.element.parentNode).to.be(null);
    });
  });
});

describe('element', function () {
  it('does not trigger error when it is set to null', function () {
    const map = new Map({
      target: document.createElement('div'),
    });
    try {
      const control = new Control({
        element: null,
      });
      expect(control.element).to.be(null);
      map.addControl(control);
    } catch (e) {
      expect().fail();
    }
    disposeMap(map);
  });

  it('sets `pointer-events: auto` for default target', function () {
    const control = new Control({
      element: document.createElement('div'),
    });
    expect(control.element.style.pointerEvents).to.be('auto');
  });
  it('does not set `pointer-events: auto` for custom target', function () {
    const control = new Control({
      element: document.createElement('div'),
      target: document.createElement('div'),
    });
    expect(control.element.style.pointerEvents).to.be('');
  });
  it('does not override `pointer-events` style', function () {
    const element = document.createElement('div');
    element.style.pointerEvents = 'none';
    const control = new Control({
      element: element,
    });
    expect(control.element.style.pointerEvents).to.be('none');
  });
});

describe("ol.control.Control's target", function () {
  describe('target as string or element', function () {
    it('transforms target from string to element', function () {
      const target = document.createElement('div');
      target.id = 'mycontrol';
      document.body.appendChild(target);
      const ctrl = new Control({target: 'mycontrol'});
      expect(ctrl.target_.id).to.equal('mycontrol');
      ctrl.dispose();
      target.remove();
    });
    it('accepts element for target', function () {
      const target = document.createElement('div');
      target.id = 'mycontrol';
      document.body.appendChild(target);
      const ctrl = new Control({target: target});
      expect(ctrl.target_.id).to.equal('mycontrol');
      ctrl.dispose();
      target.remove();
    });
    it('ignores non-existing target id', function () {
      const ctrl = new Control({target: 'doesnotexist'});
      expect(ctrl.target_).to.equal(null);
      ctrl.dispose();
    });
  });
});

describe("ol.control.Control's event target", function () {
  it('is the Control when the Control uses the default target', function (done) {
    const ctrl = new Control({element: document.createElement('div')});
    ctrl.on('test-event', function (e) {
      expect(e.target).to.be(ctrl);
      done();
    });
    ctrl.dispatchEvent('test-event');
    ctrl.dispose();
  });
  it('is the Control when the Control has a custom target', function (done) {
    const ctrl = new Control({
      element: document.createElement('div'),
      target: document.createElement('div'),
    });
    ctrl.on('test-event', function (e) {
      expect(e.target).to.be(ctrl);
      done();
    });
    ctrl.dispatchEvent('test-event');
    ctrl.dispose();
  });
});
