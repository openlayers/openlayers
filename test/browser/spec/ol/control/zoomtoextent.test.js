import {assert} from 'chai';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import ZoomToExtent from '../../../../../src/ol/control/ZoomToExtent.js';
import {
  clearUserProjection,
  useGeographic,
} from '../../../../../src/ol/proj.js';

describe('ol.control.ZoomToExtent', function () {
  describe('constructor', function () {
    it('can be constructed without arguments', function () {
      const instance = new ZoomToExtent();
      assert.instanceOf(instance, ZoomToExtent);
    });
  });

  describe('#handleZoomToExtent', function () {
    let map;
    beforeEach(function () {
      const target = document.createElement('div');
      target.style.width = '256px';
      target.style.height = '256px';
      document.body.appendChild(target);
      map = new Map({
        target: target,
        view: new View({
          center: [0, 0],
          zoom: 0,
        }),
      });
    });

    afterEach(function () {
      disposeMap(map);
      clearUserProjection();
    });

    it('it handles view coordinates', function () {
      const control = new ZoomToExtent({extent: [10, 48, 12, 50]});
      map.addControl(control);
      control.handleZoomToExtent();
      map.renderSync();
      const extent = map.getView().calculateExtent();
      assert.approximately(extent[0], 10, 1e-10);
      assert.approximately(extent[1], 48, 1e-10);
      assert.approximately(extent[2], 12, 1e-10);
      assert.approximately(extent[3], 50, 1e-10);
    });

    it('it handles user coordinates', function () {
      useGeographic();
      const control = new ZoomToExtent({extent: [10, 48, 12, 50]});
      map.addControl(control);
      control.handleZoomToExtent();
      map.renderSync();
      const extent = map.getView().calculateExtent();
      assert.approximately(extent[0], 9.4754646122, 1e-10);
      assert.approximately(extent[1], 48, 1e-10);
      assert.approximately(extent[2], 12.5245353878, 1e-10);
      assert.approximately(extent[3], 50, 1e-10);
    });

    it('it handles projection extent', function () {
      useGeographic();
      const control = new ZoomToExtent();
      map.addControl(control);
      control.handleZoomToExtent();
      map.renderSync();
      const extent = map.getView().calculateExtent();
      assert.approximately(extent[0], -180, 1e-10);
      assert.approximately(extent[1], -85.0511287798, 1e-10);
      assert.approximately(extent[2], 180, 1e-10);
      assert.approximately(extent[3], 85.0511287798, 1e-10);
    });
  });
});
