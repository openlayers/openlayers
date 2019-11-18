import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Control from '../../../../src/ol/control/Control.js';
import OverviewMap from '../../../../src/ol/control/OverviewMap.js';

describe('ol.control.OverviewMap', function() {
  let map, target;

  beforeEach(function() {
    target = document.createElement('div');
    document.body.appendChild(target);
    map = new Map({
      target: target
    });
  });

  afterEach(function() {
    map.dispose();
    document.body.removeChild(target);
    map = null;
    target = null;
  });

  describe('constructor', function() {
    it('creates an overview map with the default options', function() {
      const control = new OverviewMap();
      expect(control).to.be.a(OverviewMap);
      expect(control).to.be.a(Control);
    });
  });

  describe('setMap()', function() {

    it('keeps ovmap view rotation in sync with map view rotation', function() {
      const view = new View({
        center: [0, 0],
        zoom: 0,
        rotation: Math.PI / 2
      });
      map.setView(view);

      const control = new OverviewMap({
        rotateWithView: true
      });
      map.addControl(control);
      const ovView = control.ovmap_.getView();
      expect(ovView.getRotation()).to.be(Math.PI / 2);

      view.setRotation(Math.PI / 4);
      expect(ovView.getRotation()).to.be(Math.PI / 4);
    });

    it('maintains rotation in sync if view added later', function() {
      const control = new OverviewMap({
        rotateWithView: true
      });
      map.addControl(control);
      const ovView = control.ovmap_.getView();
      expect(ovView.getRotation()).to.be(0);

      const view = new View({
        center: [0, 0],
        zoom: 0,
        rotation: Math.PI / 2
      });
      map.setView(view);
      expect(ovView.getRotation()).to.be(Math.PI / 2);

      view.setRotation(Math.PI / 4);
      expect(ovView.getRotation()).to.be(Math.PI / 4);
    });

    it('stops listening to old maps', function() {
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
      expect(ovView.getRotation()).to.be(Math.PI / 8);

      map.removeControl(control);

      view.setRotation(Math.PI / 4);
      expect(ovView.getRotation()).to.be(Math.PI / 8);
    });

    it('set target to null', function() {
      const control = new OverviewMap();

      map.addControl(control);

      expect(control.ovmap_.getTarget()).not.to.be(null);

      map.removeControl(control);

      expect(control.ovmap_.getTarget()).to.be(null);
    });

  });

});
