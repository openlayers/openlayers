import {assert} from 'chai';
import proj4 from 'proj4';

import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import ScaleLine from '../../../../../src/ol/control/ScaleLine.js';
import {
  addCommon,
  clearAllProjections,
  fromLonLat,
} from '../../../../../src/ol/proj.js';
import Projection from '../../../../../src/ol/proj/Projection.js';
import {register} from '../../../../../src/ol/proj/proj4.js';

describe('ol.control.ScaleLine', function () {
  let map;
  beforeEach(function () {
    const target = document.createElement('div');
    target.style.height = '256px';
    document.body.appendChild(target);
    map = new Map({
      target: target,
    });
  });
  afterEach(function () {
    disposeMap(map);
    map = null;
  });

  describe('constructor', function () {
    it('can be constructed without arguments', function () {
      const ctrl = new ScaleLine();
      assert.instanceOf(ctrl, ScaleLine);
    });
  });

  describe('configuration options', function () {
    describe('className', function () {
      it('defaults to "ol-scale-line"', function () {
        const ctrl = new ScaleLine();
        ctrl.setMap(map);
        const element = document.querySelector('.ol-scale-line');
        assert.notEqual(element, null);
        assert.instanceOf(element, HTMLDivElement);
      });
      it('can be configured', function () {
        const ctrl = new ScaleLine({
          className: 'humpty-dumpty',
        });
        ctrl.setMap(map);

        // check that the default was not chosen
        const element1 = document.querySelector('.ol-scale-line');
        assert.strictEqual(element1, null);
        // check if the configured classname was chosen
        const element2 = document.querySelector('.humpty-dumpty');
        assert.notEqual(element2, null);
        assert.instanceOf(element2, HTMLDivElement);
      });
    });

    describe('minWidth', function () {
      it('defaults to 64', function () {
        const ctrl = new ScaleLine();
        assert.strictEqual(ctrl.minWidth_, 64);
      });
      it('can be configured', function () {
        const ctrl = new ScaleLine({
          minWidth: 4711,
        });
        assert.strictEqual(ctrl.minWidth_, 4711);
      });
    });

    describe('maxWidth', function () {
      it('defaults to undefined', function () {
        const ctrl = new ScaleLine();
        assert.strictEqual(ctrl.maxWidth_, undefined);
      });
      it('can be configured', function () {
        const ctrl = new ScaleLine({
          maxWidth: 4711,
        });
        assert.strictEqual(ctrl.maxWidth_, 4711);
      });
    });

    describe('render', function () {
      it('defaults to `ol.control.ScaleLine.render`', function () {
        const ctrl = new ScaleLine();
        assert.strictEqual(ctrl.render, ScaleLine.prototype.render);
      });
      it('can be configured', function () {
        const myRender = function () {};
        const ctrl = new ScaleLine({
          render: myRender,
        });
        assert.strictEqual(ctrl.render, myRender);
      });
    });
  });

  describe('synchronisation with map view', function () {
    it('calls `render` as soon as the map is rendered', () =>
      new Promise((resolve) => {
        const renderSpy = vi.fn();
        const ctrl = new ScaleLine({
          render: renderSpy,
        });
        assert.strictEqual(renderSpy.mock.calls.length, 0);
        ctrl.setMap(map);
        assert.strictEqual(renderSpy.mock.calls.length, 0);
        map.setView(
          new View({
            center: [0, 0],
            zoom: 0,
          }),
        );
        assert.strictEqual(renderSpy.mock.calls.length, 0);
        map.once('postrender', function () {
          assert.isAbove(renderSpy.mock.calls.length, 0);
          assert.strictEqual(renderSpy.mock.calls.length, 1);
          resolve();
        });
      }));
    it('calls `render` as often as the map is rendered', function () {
      const renderSpy = vi.fn();
      const ctrl = new ScaleLine({
        render: renderSpy,
      });
      ctrl.setMap(map);
      map.setView(
        new View({
          center: [0, 0],
          zoom: 0,
        }),
      );
      map.renderSync();
      assert.strictEqual(renderSpy.mock.calls.length, 1);
      map.renderSync();
      assert.strictEqual(renderSpy.mock.calls.length, 2);
      map.renderSync();
      assert.strictEqual(renderSpy.mock.calls.length, 3);
    });
    it('calls `render` as when the view changes', () =>
      new Promise((resolve) => {
        const renderSpy = vi.fn();
        const ctrl = new ScaleLine({
          render: renderSpy,
        });
        ctrl.setMap(map);
        map.setView(
          new View({
            center: [0, 0],
            zoom: 0,
          }),
        );
        map.renderSync();
        map.once('postrender', function () {
          assert.strictEqual(renderSpy.mock.calls.length, 2);
          resolve();
        });
        map.getView().setCenter([1, 1]);
      }));
  });

  describe('static method `render`', function () {
    it('updates the rendered text', function () {
      const ctrl = new ScaleLine();
      assert.strictEqual(ctrl.element.innerText, '');
      ctrl.setMap(map);
      map.setView(
        new View({
          center: [0, 0],
          multiWorld: true,
          zoom: 0,
        }),
      );
      map.renderSync();
      assert.strictEqual(ctrl.element.innerText, '10000 km');
    });
  });

  describe('#getUnits', function () {
    it('returns "metric" by default', function () {
      const ctrl = new ScaleLine();
      assert.strictEqual(ctrl.getUnits(), 'metric');
    });
    it('returns what is configured via `units` property', function () {
      const ctrl = new ScaleLine({
        units: 'nautical',
      });
      assert.strictEqual(ctrl.getUnits(), 'nautical');
    });
    it('returns what is configured `setUnits` method', function () {
      const ctrl = new ScaleLine();
      ctrl.setUnits('nautical');
      assert.strictEqual(ctrl.getUnits(), 'nautical');
    });
  });

  describe('#setUnits', function () {
    it('triggers rerendering', function () {
      const ctrl = new ScaleLine();
      map.setView(
        new View({
          center: [0, 0],
          multiWorld: true,
          zoom: 0,
        }),
      );
      ctrl.setMap(map);

      map.renderSync();
      assert.strictEqual(ctrl.element.innerText, '10000 km');

      ctrl.setUnits('nautical');
      map.renderSync();
      assert.strictEqual(ctrl.element.innerText, '10000 NM');
    });
  });

  describe('different units result in different contents', function () {
    let ctrl;
    let metricHtml;
    let nauticalHtml;
    let degreesHtml;
    let imperialHtml;
    let usHtml;
    beforeEach(
      () =>
        new Promise((resolve) => {
          ctrl = new ScaleLine();
          ctrl.setMap(map);
          map.setView(
            new View({
              center: [0, 0],
              zoom: 0,
            }),
          );
          map.once('postrender', function () {
            metricHtml = ctrl.element.innerHTML;
            resolve();
          });
        }),
    );
    afterEach(function () {
      map.setView(null);
      map.removeControl(ctrl);
    });

    it('renders a scaleline for "metric"', function () {
      assert.notEqual(metricHtml, undefined);
    });
    it('renders a different scaleline for "nautical"', function () {
      ctrl.setUnits('nautical');
      nauticalHtml = ctrl.element.innerHTML;
      assert.notEqual(nauticalHtml, metricHtml);
    });
    it('renders a different scaleline for "degrees"', function () {
      ctrl.setUnits('degrees');
      degreesHtml = ctrl.element.innerHTML;
      assert.notEqual(degreesHtml, metricHtml);
      assert.notEqual(degreesHtml, nauticalHtml);
    });
    it('renders a different scaleline for "imperial"', function () {
      ctrl.setUnits('imperial');
      imperialHtml = ctrl.element.innerHTML;
      assert.notEqual(imperialHtml, metricHtml);
      assert.notEqual(imperialHtml, nauticalHtml);
      assert.notEqual(imperialHtml, degreesHtml);
    });
    it('renders a different scaleline for "us"', function () {
      ctrl.setUnits('us');
      usHtml = ctrl.element.innerHTML;
      assert.notEqual(usHtml, metricHtml);
      assert.notEqual(usHtml, nauticalHtml);
      assert.notEqual(usHtml, degreesHtml);
    });
  });

  describe('projections affect the scaleline', function () {
    beforeEach(function () {
      proj4.defs(
        'Indiana-East',
        'PROJCS["IN83-EF",GEOGCS["LL83",DATUM["NAD83",' +
          'SPHEROID["GRS1980",6378137.000,298.25722210]],PRIMEM["Greenwich",0],' +
          'UNIT["Degree",0.017453292519943295]],PROJECTION["Transverse_Mercator"],' +
          'PARAMETER["false_easting",328083.333],' +
          'PARAMETER["false_northing",820208.333],' +
          'PARAMETER["scale_factor",0.999966666667],' +
          'PARAMETER["central_meridian",-85.66666666666670],' +
          'PARAMETER["latitude_of_origin",37.50000000000000],' +
          'UNIT["Foot_US",0.30480060960122]]',
      );
      register(proj4);
    });

    afterEach(function () {
      clearAllProjections();
      addCommon();
    });

    it('is rendered differently for different projections', function () {
      const ctrl = new ScaleLine();
      ctrl.setMap(map);
      map.setView(
        new View({
          center: fromLonLat([7, 52]),
          zoom: 2,
          projection: 'EPSG:3857',
        }),
      );
      map.renderSync();
      assert.strictEqual(ctrl.element.innerText, '2000 km');
      map.setView(
        new View({
          center: [7, 52],
          multiWorld: true,
          zoom: 2,
          projection: 'EPSG:4326',
        }),
      );
      map.renderSync();
      assert.strictEqual(ctrl.element.innerText, '5000 km');
      map.setView(
        new View({
          center: fromLonLat([-85.685, 39.891], 'Indiana-East'),
          zoom: 7,
          projection: 'Indiana-East',
        }),
      );
      map.renderSync();
      assert.strictEqual(ctrl.element.innerText, '100 km');
    });

    it('maxWidth is applied correctly', function () {
      const ctrl = new ScaleLine({maxWidth: 50});
      ctrl.setMap(map);
      map.setView(
        new View({
          center: fromLonLat([-85.685, 39.891], 'Indiana-East'),
          zoom: 7,
          projection: 'Indiana-East',
        }),
      );
      map.renderSync();
      assert.strictEqual(ctrl.element.innerText, '50 km');
    });

    it('shows the same scale for different projections at higher resolutions', function () {
      const ctrl = new ScaleLine();
      ctrl.setMap(map);
      map.setView(
        new View({
          center: fromLonLat([-85.685, 39.891]),
          zoom: 7,
          projection: 'EPSG:3857',
        }),
      );
      map.renderSync();
      assert.strictEqual(ctrl.element.innerText, '100 km');
      map.setView(
        new View({
          center: [-85.685, 39.891],
          zoom: 7,
          projection: 'EPSG:4326',
        }),
      );
      map.renderSync();
      assert.strictEqual(ctrl.element.innerText, '100 km');
      map.setView(
        new View({
          center: fromLonLat([-85.685, 39.891], 'Indiana-East'),
          zoom: 7,
          projection: 'Indiana-East',
        }),
      );
      map.renderSync();
      assert.strictEqual(ctrl.element.innerText, '100 km');
    });

    it("Projection's metersPerUnit affect scale for non-degree units", function () {
      const ctrl = new ScaleLine();
      ctrl.setMap(map);
      map.setView(
        new View({
          center: [0, 0],
          zoom: 0,
          resolutions: [1],
          projection: new Projection({
            code: 'METERS',
            units: 'm',
            getPointResolution: function (r) {
              return r;
            },
          }),
        }),
      );
      map.renderSync();

      ctrl.setUnits('metric');
      assert.strictEqual(ctrl.element.innerText, '100 m');

      ctrl.setUnits('imperial');
      assert.strictEqual(ctrl.element.innerText, '500 ft');

      ctrl.setUnits('nautical');
      assert.strictEqual(ctrl.element.innerText, '0.05 NM');

      ctrl.setUnits('us');
      assert.strictEqual(ctrl.element.innerText, '500 ft');

      map.setView(
        new View({
          center: [0, 0],
          zoom: 0,
          resolutions: [1],
          projection: new Projection({
            code: 'PIXELS',
            units: 'pixels',
            metersPerUnit: 1 / 1000,
            getPointResolution: function (r) {
              return r;
            },
          }),
        }),
      );
      map.renderSync();

      ctrl.setUnits('metric');
      assert.strictEqual(ctrl.element.innerText, '100 mm');

      ctrl.setUnits('imperial');
      assert.strictEqual(ctrl.element.innerText, '5 in');

      ctrl.setUnits('nautical');
      assert.strictEqual(ctrl.element.innerText, '0.00005 NM');

      ctrl.setUnits('us');
      assert.strictEqual(ctrl.element.innerText, '5 in');
    });

    it('Metric display works with Geographic (EPSG:4326) projection', function () {
      const ctrl = new ScaleLine();
      ctrl.setMap(map);
      map.setView(
        new View({
          center: [0, 0],
          multiWorld: true,
          zoom: 0 /* min zoom */,
          projection: 'EPSG:4326',
        }),
      );
      map.renderSync();
      assert.strictEqual(ctrl.element.innerText, '10000 km');
      map.getView().setZoom(28); /* max zoom */
      map.renderSync();
      assert.strictEqual(ctrl.element.innerText, '50 mm');
    });
  });

  describe('latitude may affect scale line in EPSG:4326', function () {
    it('is rendered differently at different latitudes for metric', function () {
      const ctrl = new ScaleLine();
      ctrl.setMap(map);
      map.setView(
        new View({
          center: [7, 0],
          zoom: 2,
          projection: 'EPSG:4326',
        }),
      );
      map.renderSync();
      const innerHtml0 = ctrl.element.innerHTML;
      map.getView().setCenter([7, 52]);
      map.renderSync();
      const innerHtml52 = ctrl.element.innerHTML;
      assert.notEqual(innerHtml0, innerHtml52);
    });

    it('is rendered the same at different latitudes for degrees', function () {
      const ctrl = new ScaleLine({
        units: 'degrees',
      });
      ctrl.setMap(map);
      map.setView(
        new View({
          center: [7, 0],
          zoom: 2,
          projection: 'EPSG:4326',
          multiWorld: true,
        }),
      );
      map.renderSync();
      const innerHtml0 = ctrl.element.innerHTML;
      map.getView().setCenter([7, 52]);
      map.renderSync();
      const innerHtml52 = ctrl.element.innerHTML;
      assert.strictEqual(innerHtml0, innerHtml52);
    });
  });

  describe('zoom affects the scaleline', function () {
    let currentZoom;
    let ctrl;
    let renderedHtmls;
    let mapView;

    const getMetricUnit = function (zoom) {
      if (zoom > 40) {
        return 'nm';
      }
      if (zoom > 30) {
        return 'μm';
      }
      if (zoom > 20) {
        return 'mm';
      }
      if (zoom > 10) {
        return 'm';
      }
      return 'km';
    };

    const getImperialUnit = function (zoom) {
      if (zoom >= 21) {
        return 'in';
      }
      if (zoom >= 10) {
        return 'ft';
      }
      return 'mi';
    };

    beforeEach(function () {
      currentZoom = 33;
      renderedHtmls = {};
      ctrl = new ScaleLine({
        minWidth: 10,
      });
      ctrl.setMap(map);
      map.setView(
        new View({
          center: [0, 0],
          zoom: currentZoom,
          maxZoom: currentZoom,
          multiWorld: true,
        }),
      );
      mapView = map.getView();
      map.renderSync();
    });
    afterEach(function () {
      map.removeControl(ctrl);
      map.setView(null);
    });

    it('metric: is rendered differently for different zoomlevels', function () {
      ctrl.setUnits('metric');
      map.renderSync();
      renderedHtmls[ctrl.element.innerHTML] = true;
      while (--currentZoom >= 0) {
        mapView.setZoom(currentZoom);
        map.renderSync();
        const currentHtml = ctrl.element.innerHTML;
        assert.strictEqual(currentHtml in renderedHtmls, false);
        renderedHtmls[currentHtml] = true;

        const unit = ctrl.innerElement_.textContent.match(/\d+ (.+)/)[1];
        assert.deepEqual(unit, getMetricUnit(currentZoom));
      }
    });
    it('degrees: is rendered differently for different zoomlevels', function () {
      ctrl.setUnits('degrees');
      map.renderSync();
      renderedHtmls[ctrl.element.innerHTML] = true;
      while (--currentZoom >= 0) {
        mapView.setZoom(currentZoom);
        map.renderSync();
        const currentHtml = ctrl.element.innerHTML;
        assert.strictEqual(currentHtml in renderedHtmls, false);
        renderedHtmls[currentHtml] = true;
      }
    });
    it('imperial: is rendered differently for different zoomlevels', function () {
      ctrl.setUnits('imperial');
      map.renderSync();
      renderedHtmls[ctrl.element.innerHTML] = true;
      while (--currentZoom >= 0) {
        mapView.setZoom(currentZoom);
        map.renderSync();
        const currentHtml = ctrl.element.innerHTML;
        assert.strictEqual(currentHtml in renderedHtmls, false);
        renderedHtmls[currentHtml] = true;

        const unit = ctrl.innerElement_.textContent.match(/\d+ (.+)/)[1];
        assert.deepEqual(unit, getImperialUnit(currentZoom));
      }
    });
    it('nautical: is rendered differently for different zoomlevels', function () {
      ctrl.setUnits('nautical');
      map.renderSync();
      renderedHtmls[ctrl.element.innerHTML] = true;
      while (--currentZoom >= 0) {
        mapView.setZoom(currentZoom);
        map.renderSync();
        const currentHtml = ctrl.element.innerHTML;
        assert.strictEqual(currentHtml in renderedHtmls, false);
        renderedHtmls[currentHtml] = true;
      }
    });
    it('us: is rendered differently for different zoomlevels', function () {
      ctrl.setUnits('us');
      map.renderSync();
      renderedHtmls[ctrl.element.innerHTML] = true;
      while (--currentZoom >= 0) {
        mapView.setZoom(currentZoom);
        map.renderSync();
        const currentHtml = ctrl.element.innerHTML;
        assert.strictEqual(currentHtml in renderedHtmls, false);
        renderedHtmls[currentHtml] = true;
      }
    });
  });

  describe('scalebar text', function () {
    it('it corresponds to the resolution', function () {
      const ctrl = new ScaleLine({
        bar: true,
        text: true,
      });
      ctrl.setMap(map);
      map.setView(
        new View({
          center: [0, 0],
          zoom: 2,
          multiWorld: true,
        }),
      );
      map.renderSync();
      const element = document.querySelector('.ol-scale-text');
      assert.notEqual(element, null);
      assert.instanceOf(element, HTMLDivElement);
      const text = element.innerText;
      assert.strictEqual(text.slice(0, 4), '1 : ');
      assert.equal(text.replace(/^1|\D/g, ''), 139770566);
    });
    it('it changes with latitude', function () {
      const ctrl = new ScaleLine({
        bar: true,
        text: true,
      });
      ctrl.setMap(map);
      map.setView(
        new View({
          center: fromLonLat([0, 60]),
          zoom: 2,
          multiWorld: true,
        }),
      );
      map.renderSync();
      const element = document.querySelector('.ol-scale-text');
      assert.notEqual(element, null);
      assert.instanceOf(element, HTMLDivElement);
      const text = element.innerText;
      assert.strictEqual(text.slice(0, 4), '1 : ');
      assert.equal(text.replace(/^1|\D/g, ''), 69885283);
    });
    it('it corresponds to the resolution in EPSG:4326', function () {
      const ctrl = new ScaleLine({
        bar: true,
        text: true,
      });
      ctrl.setMap(map);
      map.setView(
        new View({
          center: [0, 0],
          zoom: 2,
          multiWorld: true,
          projection: 'EPSG:4326',
        }),
      );
      map.renderSync();
      const element = document.querySelector('.ol-scale-text');
      assert.notEqual(element, null);
      assert.instanceOf(element, HTMLDivElement);
      const text = element.innerText;
      assert.strictEqual(text.slice(0, 4), '1 : ');
      assert.equal(text.replace(/^1|\D/g, ''), 139614359);
    });
    it('it changes with latitude in EPSG:4326', function () {
      const ctrl = new ScaleLine({
        bar: true,
        text: true,
      });
      ctrl.setMap(map);
      map.setView(
        new View({
          center: [0, 60],
          zoom: 2,
          multiWorld: true,
          projection: 'EPSG:4326',
        }),
      );
      map.renderSync();
      const element = document.querySelector('.ol-scale-text');
      assert.notEqual(element, null);
      assert.instanceOf(element, HTMLDivElement);
      const text = element.innerText;
      assert.strictEqual(text.slice(0, 4), '1 : ');
      assert.equal(text.replace(/^1|\D/g, ''), 104710728);
    });
  });
});
