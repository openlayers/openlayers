import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import Control from '../../../../../src/ol/control/Control.js';
import OverviewMap from '../../../../../src/ol/control/OverviewMap.js';
import Point from '../../../../../src/ol/geom/Point.js';
import VectorLayer from '../../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';

describe('ol.control.OverviewMap', function () {
  let map, target;

  beforeEach(function () {
    target = document.createElement('div');
    target.style.width = '256px';
    target.style.height = '256px';
    document.body.appendChild(target);
    map = new Map({
      target: target,
    });
  });

  afterEach(function () {
    disposeMap(map);
    map = null;
    target = null;
  });

  describe('constructor', function () {
    it('creates an overview map with the default options', function () {
      const control = new OverviewMap();
      expect(control).to.be.a(OverviewMap);
      expect(control).to.be.a(Control);
    });
  });

  describe('recenter', function () {
    it('recenters main map on overview map click', function () {
      map.setView(new View({center: [0, 0], resolution: 1}));
      map.addLayer(
        new VectorLayer({
          source: new VectorSource({
            features: [new Feature(new Point([0, 0]))],
          }),
        }),
      );
      const control = new OverviewMap({collapsed: false, collapsible: false});
      control.ovmapDiv_.style.width = '100px';
      control.ovmapDiv_.style.height = '100px';
      map.addControl(control);
      control.getOverviewMap().renderSync();
      const [x, y] = control.ovmap_.getPixelFromCoordinate([100, 100]);
      const origin = control.ovmapDiv_.getBoundingClientRect();
      const down = new PointerEvent('pointerdown', {
        clientX: origin.left + x,
        clientY: origin.top + y,
      });
      const up = new PointerEvent('pointerup', {
        clientX: origin.left + x,
        clientY: origin.top + y,
      });
      control.ovmapDiv_.dispatchEvent(down);
      map.getOwnerDocument().dispatchEvent(up);
      expect(map.getView().getCenter()).to.eql([100, 100]);
    });
  });

  describe('setMap()', function () {
    it('keeps ovmap view rotation in sync with map view rotation', function () {
      const view = new View({
        center: [0, 0],
        zoom: 0,
        rotation: Math.PI / 2,
      });
      map.setView(view);

      const control = new OverviewMap({
        rotateWithView: true,
      });
      map.addControl(control);
      const ovView = control.ovmap_.getView();
      expect(ovView.getRotation()).to.be(Math.PI / 2);

      view.setRotation(Math.PI / 4);
      expect(ovView.getRotation()).to.be(Math.PI / 4);
    });

    it('maintains rotation in sync if view added later', function () {
      const control = new OverviewMap({
        rotateWithView: true,
      });
      map.addControl(control);
      const ovInitialView = control.ovmap_.getView();
      expect(ovInitialView.getRotation()).to.be(0);

      const view = new View({
        center: [0, 0],
        zoom: 0,
        rotation: Math.PI / 2,
      });
      map.setView(view);
      const ovView = control.ovmap_.getView();
      expect(ovView.getRotation()).to.be(Math.PI / 2);

      view.setRotation(Math.PI / 4);
      expect(ovView.getRotation()).to.be(Math.PI / 4);
    });

    it('stops listening to old maps', function () {
      const control = new OverviewMap({
        rotateWithView: true,
      });

      const view = new View({
        center: [0, 0],
        zoom: 0,
        rotation: 0,
      });
      map.setView(view);
      map.addControl(control);
      const ovView = control.ovmap_.getView();

      view.setRotation(Math.PI / 8);
      expect(ovView.getRotation()).to.be(Math.PI / 8);

      map.removeControl(control);

      view.setRotation(Math.PI / 4);
      expect(ovView.getRotation()).to.be(Math.PI / 8);
    });

    it('reflects projection change of main map', function () {
      const control = new OverviewMap({
        rotateWithView: true,
      });

      map.addControl(control);
      expect(control.ovmap_.getView().getProjection().getCode()).to.be(
        'EPSG:3857',
      );

      map.setView(
        new View({
          projection: 'EPSG:4326',
        }),
      );
      expect(control.ovmap_.getView().getProjection().getCode()).to.be(
        'EPSG:4326',
      );
    });

    it('retains explicitly set view', function () {
      const overviewMapView = new View();
      const control = new OverviewMap({
        rotateWithView: true,
        view: overviewMapView,
      });

      map.addControl(control);
      expect(control.ovmap_.getView()).to.be(overviewMapView);
      expect(control.ovmap_.getView().getProjection().getCode()).to.be(
        'EPSG:3857',
      );

      map.setView(
        new View({
          projection: 'EPSG:4326',
        }),
      );
      expect(control.ovmap_.getView()).to.be(overviewMapView);
      expect(control.ovmap_.getView().getProjection().getCode()).to.be(
        'EPSG:3857',
      );
    });

    it('set target to null', function () {
      const control = new OverviewMap();

      map.addControl(control);

      expect(control.ovmap_.getTarget()).not.to.be(null);

      map.removeControl(control);

      expect(control.ovmap_.getTarget()).to.be(null);
    });
  });
});
