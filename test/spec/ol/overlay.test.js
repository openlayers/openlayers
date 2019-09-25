import Map from '../../../src/ol/Map.js';
import Overlay from '../../../src/ol/Overlay.js';
import View from '../../../src/ol/View.js';


describe('ol.Overlay', () => {
  let target, map;

  const width = 360;
  const height = 180;

  beforeEach(() => {
    target = document.createElement('div');

    const style = target.style;
    style.position = 'absolute';
    style.left = '-1000px';
    style.top = '-1000px';
    style.width = width + 'px';
    style.height = height + 'px';
    document.body.appendChild(target);

    map = new Map({
      target: target,
      view: new View({
        projection: 'EPSG:4326',
        center: [0, 0],
        resolution: 1
      })
    });
  });

  afterEach(() => {
    map.dispose();
    document.body.removeChild(target);
  });

  describe('constructor', () => {

    test('can be constructed with minimal arguments', () => {
      const instance = new Overlay({});
      expect(instance).toBeInstanceOf(Overlay);
    });

    test('can be constructed with className', () => {
      const instance = new Overlay({className: 'my-class'});
      expect(instance).toBeInstanceOf(Overlay);
      expect(instance.element.className).toBe('my-class');
    });

  });

  describe('#getId()', () => {
    let overlay, target;

    beforeEach(() => {
      target = document.createElement('div');
    });
    afterEach(() => {
      map.removeOverlay(overlay);
    });

    test('returns the overlay identifier', () => {
      overlay = new Overlay({
        element: target,
        position: [0, 0]
      });
      map.addOverlay(overlay);
      expect(overlay.getId()).toBe(undefined);
      map.removeOverlay(overlay);
      overlay = new Overlay({
        id: 'foo',
        element: target,
        position: [0, 0]
      });
      map.addOverlay(overlay);
      expect(overlay.getId()).toBe('foo');
    });

  });

  describe('#setVisible()', () => {
    let overlay, target;

    beforeEach(() => {
      target = document.createElement('div');
    });
    afterEach(() => {
      map.removeOverlay(overlay);
    });

    test('changes the CSS display value', () => {
      overlay = new Overlay({
        element: target,
        position: [0, 0]
      });
      map.addOverlay(overlay);
      map.renderSync();
      expect(overlay.element.style.display).not.toBe('none');
      overlay.setVisible(false);
      expect(overlay.element.style.display).toBe('none');
    });

  });

});
