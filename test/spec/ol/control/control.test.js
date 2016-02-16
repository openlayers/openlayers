goog.provide('ol.test.control.Control');

describe('ol.control.Control', function() {
  var map, control;

  beforeEach(function() {
    map = new ol.Map({
      target: document.createElement('div')
    });
    var element = document.createElement('DIV');
    control = new ol.control.Control({element: element});
    control.setMap(map);
  });

  afterEach(function() {
    goog.dispose(map);
  });

  describe('dispose', function() {
    it('removes the control element from its parent', function() {
      goog.dispose(control);
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
      var ctrl = new ol.control.Control({target: 'mycontrol'});
      expect(ctrl.target_.id).to.equal('mycontrol');
      goog.dispose(ctrl);
    });
    it('accepts element for target', function() {
      var target = document.createElement('div');
      target.id = 'mycontrol';
      document.body.appendChild(target);
      var ctrl = new ol.control.Control({target: target});
      expect(ctrl.target_.id).to.equal('mycontrol');
      goog.dispose(ctrl);
    });
    it('ignores non-existing target id', function() {
      var ctrl = new ol.control.Control({target: 'doesnotexist'});
      expect(ctrl.target_).to.equal(null);
      goog.dispose(ctrl);
    });
  });
});

goog.require('goog.dispose');
goog.require('ol.Map');
goog.require('ol.control.Control');
