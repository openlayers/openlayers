import Disposable from '../../../../src/ol/Disposable.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import RenderBox from '../../../../src/ol/render/Box.js';


describe('ol.render.Box', function() {

  let box, map, target;

  beforeEach(function() {
    box = new RenderBox('test-box');

    target = document.createElement('div');
    target.style.height = '256px';

    document.body.appendChild(target);

    map = new Map({
      target: target,
      view: new View({
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
      const obj = new RenderBox('test-box');
      expect(obj).to.be.a(RenderBox);
      expect(obj).to.be.a(Disposable);
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
    it('applies correct styles for a box', function() {
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
      expect(box.getGeometry()).to.be.a(Polygon);
    });
  });

});
