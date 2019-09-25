import Disposable from '../../../../src/ol/Disposable.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import RenderBox from '../../../../src/ol/render/Box.js';


describe('ol.render.Box', () => {

  let box, map, target;

  beforeEach(() => {
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

  afterEach(() => {
    map.dispose();
    document.body.removeChild(target);
  });

  describe('constructor', () => {
    test('creates an instance', () => {
      const obj = new RenderBox('test-box');
      expect(obj).toBeInstanceOf(RenderBox);
      expect(obj).toBeInstanceOf(Disposable);
      obj.dispose();
    });
    test('creates an absolutely positioned DIV with a className', () => {
      expect(box.element_).toBeInstanceOf(HTMLDivElement);
      expect(box.element_.style.position).toBe('absolute');
      expect(box.element_.className).toBe('ol-box test-box');
      expect(box.element_.style.position).toBe('absolute');
    });
    test('appends the DIV to the map\'s overlay container', () => {
      expect(box.element_.parentNode).toBe(map.getOverlayContainer());
    });
  });

  describe('#setPixels()', () => {
    test('applies correct styles for a box', () => {
      box.setPixels([1, 2], [4, 8]);
      expect(box.element_.style.left).toBe('1px');
      expect(box.element_.style.top).toBe('2px');
      expect(box.element_.style.width).toBe('3px');
      expect(box.element_.style.height).toBe('6px');
    });
    test('applies correct styles for a flipped box', () => {
      box.setPixels([4, 8], [1, 2]);
      expect(box.element_.style.left).toBe('1px');
      expect(box.element_.style.top).toBe('2px');
      expect(box.element_.style.width).toBe('3px');
      expect(box.element_.style.height).toBe('6px');
    });
    test('creates a polygon geometry', () => {
      expect(box.getGeometry()).toBe(null);
      box.setPixels([1, 2], [3, 4]);
      expect(box.getGeometry()).toBeInstanceOf(Polygon);
    });
  });

});
