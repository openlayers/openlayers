goog.provide('ol.test.control.Control');

describe('ol.control.Control', function() {
  var map, control;

  beforeEach(function() {
    map = new ol.Map({
      target: document.createElement('div')
    });
    var element = goog.dom.createDom(goog.dom.TagName.DIV);
    control = new ol.control.Control({element: element});
    control.setMap(map);
  });

  afterEach(function() {
    map.dispose();
  });

  describe('dispose', function() {
    it('removes the control element from its parent', function() {
      control.dispose();
      expect(goog.dom.getParentElement(control.element)).to.be(null);
    });
  });
});

goog.require('goog.dom');
goog.require('ol.Map');
goog.require('ol.control.Control');
