goog.provide('ol.test.render.Box');

describe('ol.render.Box', function() {

  var box, map, target;

  beforeEach(function() {
    box = new ol.render.Box('test-box');

    target = document.createElement('div');
    document.body.appendChild(target);

    map = new ol.Map({
      target: target,
      view: new ol.View({
        center: [0, 0],
        zoom: 0
      })
    });
    map.renderSync();
    box.setMap(map);
  });

  afterEach(function() {
    goog.dispose(map);
    document.body.removeChild(target);
  });

  describe('constructor', function() {
    it('creates an absolutely positioned DIV with a className', function() {
      expect(box.element_).to.be.a(HTMLDivElement);
      expect(box.element_.style.position).to.be('absolute');
      expect(box.element_.className).to.be('ol-box test-box');
      expect(box.element_.style.position).to.be('absolute');
    });
    it('appends the DIV to the map\'s overlay container', function() {
      expect(box.element_.parentNode).to.equal(map.getOverlayContainer());
    });
  });

  describe('#setPixels()', function() {
    it('applies correct styles for a box', function()  {
      box.setPixels([1, 2], [4, 8]);
      expect(box.element_.style.left).to.be('1px');
      expect(box.element_.style.top).to.be('2px');
      expect(box.element_.style.width).to.be('3px');
      expect(box.element_.style.height).to.be('6px');
    });
    it('applies correct styles for a flipped box', function() {
      box.setPixels([4, 8], [1, 2]);
      expect(box.element_.style.left).to.be('1px');
      expect(box.element_.style.top).to.be('2px');
      expect(box.element_.style.width).to.be('3px');
      expect(box.element_.style.height).to.be('6px');
    });
    it('creates a polygon geometry', function() {
      expect(box.getGeometry()).to.be(null);
      box.setPixels([1, 2], [3, 4]);
      expect(box.getGeometry()).to.be.a(ol.geom.Polygon);
    });
  });

});

goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.geom.Polygon');
goog.require('ol.render.Box');
