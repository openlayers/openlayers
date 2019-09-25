import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Control from '../../../../src/ol/control/Control.js';
import OverviewMap from '../../../../src/ol/control/OverviewMap.js';

describe('ol.control.OverviewMap', () => {
  let map, target;

  beforeEach(() => {
    target = document.createElement('div');
    document.body.appendChild(target);
    map = new Map({
      target: target
    });
  });

  afterEach(() => {
    map.dispose();
    document.body.removeChild(target);
    map = null;
    target = null;
  });

  describe('constructor', () => {
    test('creates an overview map with the default options', () => {
      const control = new OverviewMap();
      expect(control).toBeInstanceOf(OverviewMap);
      expect(control).toBeInstanceOf(Control);
    });
  });

  describe('setMap()', () => {

    test('keeps ovmap view rotation in sync with map view rotation', () => {
      const view = new View({
        center: [0, 0],
        zoom: 0,
        rotation: 0
      });
      map.setView(view);

      const control = new OverviewMap({
        rotateWithView: true
      });
      map.addControl(control);
      const ovView = control.ovmap_.getView();
      expect(ovView.getRotation()).toBe(0);

      view.setRotation(Math.PI / 4);
      expect(ovView.getRotation()).toBe(Math.PI / 4);
    });

    test('maintains rotation in sync if view added later', () => {
      const control = new OverviewMap({
        rotateWithView: true
      });
      map.addControl(control);
      const ovView = control.ovmap_.getView();
      expect(ovView.getRotation()).toBe(0);

      const view = new View({
        center: [0, 0],
        zoom: 0,
        rotation: 0
      });
      map.setView(view);
      view.setRotation(Math.PI / 4);
      expect(ovView.getRotation()).toBe(Math.PI / 4);
    });

    test('stops listening to old maps', () => {
      const control = new OverviewMap({
        rotateWithView: true
      });
      const ovView = control.ovmap_.getView();

      const view = new View({
        center: [0, 0],
        zoom: 0,
        rotation: 0
      });
      map.setView(view);
      map.addControl(control);

      view.setRotation(Math.PI / 8);
      expect(ovView.getRotation()).toBe(Math.PI / 8);

      map.removeControl(control);

      view.setRotation(Math.PI / 4);
      expect(ovView.getRotation()).toBe(Math.PI / 8);
    });

    test('set target to null', () => {
      const control = new OverviewMap();

      map.addControl(control);

      expect(control.ovmap_.getTarget()).not.toBe(null);

      map.removeControl(control);

      expect(control.ovmap_.getTarget()).toBe(null);
    });

  });

});
