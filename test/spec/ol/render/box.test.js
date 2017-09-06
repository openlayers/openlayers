

import _ol_Disposable_ from '../../../../src/ol/disposable';
import _ol_Map_ from '../../../../src/ol/map';
import _ol_View_ from '../../../../src/ol/view';
import _ol_geom_Polygon_ from '../../../../src/ol/geom/polygon';
import _ol_render_Box_ from '../../../../src/ol/render/box';


describe('ol.render.Box', function() {

  var box, map, target;

  beforeEach(function() {
    box = new _ol_render_Box_('test-box');

    target = document.createElement('div');
    document.body.appendChild(target);

    map = new _ol_Map_({
      target: target,
      view: new _ol_View_({
        center: [0, 0],
        zoom: 0
      })
    });
    map.renderSync();
    box.setMap(map);
  });

  afterEach(function() {
    map.dispose();
    document.body.removeChild(target);
  });

  describe('constructor', function() {
    it('creates an instance', function() {
      var obj = new _ol_render_Box_('test-box');
      expect(obj).to.be.a(_ol_render_Box_);
      expect(obj).to.be.a(_ol_Disposable_);
      obj.dispose();
    });
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
      expect(box.getGeometry()).to.be.a(_ol_geom_Polygon_);
    });
  });

});
