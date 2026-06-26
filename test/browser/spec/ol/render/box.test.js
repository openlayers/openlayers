import {assert} from 'chai';
import Disposable from '../../../../../src/ol/Disposable.js';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import RenderBox from '../../../../../src/ol/render/Box.js';

describe('ol.render.Box', function () {
  let box, map, target;

  beforeEach(function () {
    box = new RenderBox('test-box');

    target = document.createElement('div');
    target.style.height = '256px';

    document.body.appendChild(target);

    map = new Map({
      target: target,
      view: new View({
        center: [0, 0],
        zoom: 0,
      }),
    });
    map.renderSync();
    box.setMap(map);
  });

  afterEach(function () {
    disposeMap(map);
  });

  describe('constructor', function () {
    it('creates an instance', function () {
      const obj = new RenderBox('test-box');
      assert.instanceOf(obj, RenderBox);
      assert.instanceOf(obj, Disposable);
      obj.dispose();
    });
    it('creates an absolutely positioned DIV with a className', function () {
      assert.instanceOf(box.element_, HTMLDivElement);
      assert.strictEqual(box.element_.style.position, 'absolute');
      assert.strictEqual(box.element_.className, 'ol-box test-box');
      assert.strictEqual(box.element_.style.position, 'absolute');
    });
    it("appends the DIV to the map's overlay container", function () {
      assert.equal(box.element_.parentNode, map.getOverlayContainer());
    });
  });

  describe('#setPixels()', function () {
    it('applies correct styles for a box', function () {
      box.setPixels([1, 2], [4, 8]);
      assert.strictEqual(box.element_.style.left, '1px');
      assert.strictEqual(box.element_.style.top, '2px');
      assert.strictEqual(box.element_.style.width, '3px');
      assert.strictEqual(box.element_.style.height, '6px');
    });
    it('applies correct styles for a flipped box', function () {
      box.setPixels([4, 8], [1, 2]);
      assert.strictEqual(box.element_.style.left, '1px');
      assert.strictEqual(box.element_.style.top, '2px');
      assert.strictEqual(box.element_.style.width, '3px');
      assert.strictEqual(box.element_.style.height, '6px');
    });
    it('creates a polygon geometry', function () {
      assert.strictEqual(box.getGeometry(), null);
      box.setPixels([1, 2], [3, 4]);
      assert.instanceOf(box.getGeometry(), Polygon);
    });
  });
});
