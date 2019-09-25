import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import ScaleLine, {render} from '../../../../src/ol/control/ScaleLine.js';
import {fromLonLat, clearAllProjections, addCommon} from '../../../../src/ol/proj.js';
import Projection from '../../../../src/ol/proj/Projection.js';
import proj4 from 'proj4';
import {register} from '../../../../src/ol/proj/proj4.js';

describe('ol.control.ScaleLine', () => {
  let map;
  beforeEach(() => {
    const target = document.createElement('div');
    target.style.height = '256px';
    document.body.appendChild(target);
    map = new Map({
      target: target
    });
  });
  afterEach(() => {
    disposeMap(map);
    map = null;
  });

  describe('constructor', () => {
    test('can be constructed without arguments', () => {
      const ctrl = new ScaleLine();
      expect(ctrl).toBeInstanceOf(ScaleLine);
    });
  });

  describe('configuration options', () => {

    describe('className', () => {
      test('defaults to "ol-scale-line"', () => {
        const ctrl = new ScaleLine();
        ctrl.setMap(map);
        const element = document.querySelector('.ol-scale-line', map.getTarget());
        expect(element).not.toBe(null);
        expect(element).toBeInstanceOf(HTMLDivElement);
      });
      test('can be configured', () => {
        const ctrl = new ScaleLine({
          className: 'humpty-dumpty'
        });
        ctrl.setMap(map);

        // check that the default was not chosen
        const element1 = document.querySelector('.ol-scale-line', map.getTarget());
        expect(element1).toBe(null);
        // check if the configured classname was chosen
        const element2 = document.querySelector('.humpty-dumpty', map.getTarget());
        expect(element2).not.toBe(null);
        expect(element2).toBeInstanceOf(HTMLDivElement);
      });
    });

    describe('minWidth', () => {
      test('defaults to 64', () => {
        const ctrl = new ScaleLine();
        expect(ctrl.minWidth_).toBe(64);
      });
      test('can be configured', () => {
        const ctrl = new ScaleLine({
          minWidth: 4711
        });
        expect(ctrl.minWidth_).toBe(4711);
      });
    });

    describe('render', () => {
      test('defaults to `ol.control.ScaleLine.render`', () => {
        const ctrl = new ScaleLine();
        expect(ctrl.render).toBe(render);
      });
      test('can be configured', () => {
        const myRender = function() {};
        const ctrl = new ScaleLine({
          render: myRender
        });
        expect(ctrl.render).toBe(myRender);
      });
    });

  });

  describe('synchronisation with map view', () => {
    test('calls `render` as soon as the map is rendered', done => {
      const renderSpy = sinon.spy();
      const ctrl = new ScaleLine({
        render: renderSpy
      });
      expect(renderSpy.called).toBe(false);
      ctrl.setMap(map);
      expect(renderSpy.called).toBe(false);
      map.setView(new View({
        center: [0, 0],
        zoom: 0
      }));
      expect(renderSpy.called).toBe(false);
      map.once('postrender', function() {
        expect(renderSpy.called).toBe(true);
        expect(renderSpy.callCount).toBe(1);
        done();
      });
    });
    test('calls `render` as often as the map is rendered', () => {
      const renderSpy = sinon.spy();
      const ctrl = new ScaleLine({
        render: renderSpy
      });
      ctrl.setMap(map);
      map.setView(new View({
        center: [0, 0],
        zoom: 0
      }));
      map.renderSync();
      expect(renderSpy.callCount).toBe(1);
      map.renderSync();
      expect(renderSpy.callCount).toBe(2);
      map.renderSync();
      expect(renderSpy.callCount).toBe(3);
    });
    test('calls `render` as when the view changes', done => {
      const renderSpy = sinon.spy();
      const ctrl = new ScaleLine({
        render: renderSpy
      });
      ctrl.setMap(map);
      map.setView(new View({
        center: [0, 0],
        zoom: 0
      }));
      map.renderSync();
      map.once('postrender', function() {
        expect(renderSpy.callCount).toBe(2);
        done();
      });
      map.getView().setCenter([1, 1]);
    });
  });

  describe('static method `render`', () => {
    test('updates the rendered text', () => {
      const ctrl = new ScaleLine();
      expect(ctrl.element.innerText).toBe('');
      ctrl.setMap(map);
      map.setView(new View({
        center: [0, 0],
        multiWorld: true,
        zoom: 0
      }));
      map.renderSync();
      expect(ctrl.element.innerText).toBe('10000 km');
    });
  });

  describe('#getUnits', () => {
    test('returns "metric" by default', () => {
      const ctrl = new ScaleLine();
      expect(ctrl.getUnits()).toBe('metric');
    });
    test('returns what is configured via `units` property', () => {
      const ctrl = new ScaleLine({
        units: 'nautical'
      });
      expect(ctrl.getUnits()).toBe('nautical');
    });
    test('returns what is configured `setUnits` method', () => {
      const ctrl = new ScaleLine();
      ctrl.setUnits('nautical');
      expect(ctrl.getUnits()).toBe('nautical');
    });
  });

  describe('#setUnits', () => {
    test('triggers rerendering', () => {
      const ctrl = new ScaleLine();
      map.setView(new View({
        center: [0, 0],
        multiWorld: true,
        zoom: 0
      }));
      ctrl.setMap(map);

      map.renderSync();
      expect(ctrl.element.innerText).toBe('10000 km');

      ctrl.setUnits('nautical');
      map.renderSync();
      expect(ctrl.element.innerText).toBe('10000 nm');
    });
  });

  describe('different units result in different contents', () => {
    let ctrl;
    let metricHtml;
    let nauticalHtml;
    let degreesHtml;
    let imperialHtml;
    let usHtml;
    beforeEach(done => {
      ctrl = new ScaleLine();
      ctrl.setMap(map);
      map.setView(new View({
        center: [0, 0],
        zoom: 0
      }));
      map.once('postrender', function() {
        metricHtml = ctrl.element.innerHTML;
        done();
      });
    });
    afterEach(() => {
      map.setView(null);
      map.removeControl(ctrl);
    });

    test('renders a scaleline for "metric"', () => {
      expect(metricHtml).not.toBe(undefined);
    });
    test('renders a different scaleline for "nautical"', () => {
      ctrl.setUnits('nautical');
      nauticalHtml = ctrl.element.innerHTML;
      expect(nauticalHtml).not.toBe(metricHtml);
    });
    test('renders a different scaleline for "degrees"', () => {
      ctrl.setUnits('degrees');
      degreesHtml = ctrl.element.innerHTML;
      expect(degreesHtml).not.toBe(metricHtml);
      expect(degreesHtml).not.toBe(nauticalHtml);
    });
    test('renders a different scaleline for "imperial"', () => {
      ctrl.setUnits('imperial');
      imperialHtml = ctrl.element.innerHTML;
      expect(imperialHtml).not.toBe(metricHtml);
      expect(imperialHtml).not.toBe(nauticalHtml);
      expect(imperialHtml).not.toBe(degreesHtml);
    });
    test('renders a different scaleline for "us"', () => {
      ctrl.setUnits('us');
      usHtml = ctrl.element.innerHTML;
      expect(usHtml).not.toBe(metricHtml);
      expect(usHtml).not.toBe(nauticalHtml);
      expect(usHtml).not.toBe(degreesHtml);
    });
  });

  describe('projections affect the scaleline', () => {

    beforeEach(() => {
      proj4.defs('Indiana-East', 'PROJCS["IN83-EF",GEOGCS["LL83",DATUM["NAD83",' +
        'SPHEROID["GRS1980",6378137.000,298.25722210]],PRIMEM["Greenwich",0],' +
        'UNIT["Degree",0.017453292519943295]],PROJECTION["Transverse_Mercator"],' +
        'PARAMETER["false_easting",328083.333],' +
        'PARAMETER["false_northing",820208.333],' +
        'PARAMETER["scale_factor",0.999966666667],' +
        'PARAMETER["central_meridian",-85.66666666666670],' +
        'PARAMETER["latitude_of_origin",37.50000000000000],' +
        'UNIT["Foot_US",0.30480060960122]]');
      register(proj4);
    });

    afterEach(() => {
      clearAllProjections();
      addCommon();
    });

    test('is rendered differently for different projections', () => {
      const ctrl = new ScaleLine();
      ctrl.setMap(map);
      map.setView(new View({
        center: fromLonLat([7, 52]),
        zoom: 2,
        projection: 'EPSG:3857'
      }));
      map.renderSync();
      expect(ctrl.element.innerText).toBe('2000 km');
      map.setView(new View({
        center: [7, 52],
        multiWorld: true,
        zoom: 2,
        projection: 'EPSG:4326'
      }));
      map.renderSync();
      expect(ctrl.element.innerText).toBe('5000 km');
      map.setView(new View({
        center: fromLonLat([-85.685, 39.891], 'Indiana-East'),
        zoom: 7,
        projection: 'Indiana-East'
      }));
      map.renderSync();
      expect(ctrl.element.innerText).toBe('100 km');
    });

    test(
      'shows the same scale for different projections at higher resolutions',
      () => {
        const ctrl = new ScaleLine();
        ctrl.setMap(map);
        map.setView(new View({
          center: fromLonLat([-85.685, 39.891]),
          zoom: 7,
          projection: 'EPSG:3857'
        }));
        map.renderSync();
        expect(ctrl.element.innerText).toBe('100 km');
        map.setView(new View({
          center: [-85.685, 39.891],
          zoom: 7,
          projection: 'EPSG:4326'
        }));
        map.renderSync();
        expect(ctrl.element.innerText).toBe('100 km');
        map.setView(new View({
          center: fromLonLat([-85.685, 39.891], 'Indiana-East'),
          zoom: 7,
          projection: 'Indiana-East'
        }));
        map.renderSync();
        expect(ctrl.element.innerText).toBe('100 km');
      }
    );

    test(
      'Projection\'s metersPerUnit affect scale for non-degree units',
      () => {
        const ctrl = new ScaleLine();
        ctrl.setMap(map);
        map.setView(new View({
          center: [0, 0],
          zoom: 0,
          resolutions: [1],
          projection: new Projection({
            code: 'METERS',
            units: 'm',
            getPointResolution: function(r) {
              return r;
            }
          })
        }));
        map.renderSync();

        ctrl.setUnits('metric');
        expect(ctrl.element.innerText).toBe('100 m');

        ctrl.setUnits('imperial');
        expect(ctrl.element.innerText).toBe('500 ft');

        ctrl.setUnits('nautical');
        expect(ctrl.element.innerText).toBe('0.05 nm');

        ctrl.setUnits('us');
        expect(ctrl.element.innerText).toBe('500 ft');


        map.setView(new View({
          center: [0, 0],
          zoom: 0,
          resolutions: [1],
          projection: new Projection({
            code: 'PIXELS',
            units: 'pixels',
            metersPerUnit: 1 / 1000,
            getPointResolution: function(r) {
              return r;
            }
          })
        }));
        map.renderSync();

        ctrl.setUnits('metric');
        expect(ctrl.element.innerText).toBe('100 mm');

        ctrl.setUnits('imperial');
        expect(ctrl.element.innerText).toBe('5 in');

        ctrl.setUnits('nautical');
        expect(ctrl.element.innerText).toBe('0.00005 nm');

        ctrl.setUnits('us');
        expect(ctrl.element.innerText).toBe('5 in');
      }
    );

    test(
      'Metric display works with Geographic (EPSG:4326) projection',
      () => {
        const ctrl = new ScaleLine();
        ctrl.setMap(map);
        map.setView(new View({
          center: [0, 0],
          multiWorld: true,
          zoom: 0, /* min zoom */
          projection: 'EPSG:4326'
        }));
        map.renderSync();
        expect(ctrl.element.innerText).toBe('10000 km');
        map.getView().setZoom(28); /* max zoom */
        map.renderSync();
        expect(ctrl.element.innerText).toBe('50 mm');
      }
    );
  });

  describe('latitude may affect scale line in EPSG:4326', () => {

    test('is rendered differently at different latitudes for metric', () => {
      const ctrl = new ScaleLine();
      ctrl.setMap(map);
      map.setView(new View({
        center: [7, 0],
        zoom: 2,
        projection: 'EPSG:4326'
      }));
      map.renderSync();
      const innerHtml0 = ctrl.element.innerHTML;
      map.getView().setCenter([7, 52]);
      map.renderSync();
      const innerHtml52 = ctrl.element.innerHTML;
      expect(innerHtml0).not.toBe(innerHtml52);
    });

    test('is rendered the same at different latitudes for degrees', () => {
      const ctrl = new ScaleLine({
        units: 'degrees'
      });
      ctrl.setMap(map);
      map.setView(new View({
        center: [7, 0],
        zoom: 2,
        projection: 'EPSG:4326',
        multiWorld: true
      }));
      map.renderSync();
      const innerHtml0 = ctrl.element.innerHTML;
      map.getView().setCenter([7, 52]);
      map.renderSync();
      const innerHtml52 = ctrl.element.innerHTML;
      expect(innerHtml0).toBe(innerHtml52);
    });

  });

  describe('zoom affects the scaleline', () => {
    let currentZoom;
    let ctrl;
    let renderedHtmls;
    let mapView;

    const getMetricUnit = function(zoom) {
      if (zoom > 30) {
        return 'μm';
      } else if (zoom > 20) {
        return 'mm';
      } else if (zoom > 10) {
        return 'm';
      } else {
        return 'km';
      }
    };

    const getImperialUnit = function(zoom) {
      if (zoom >= 21) {
        return 'in';
      } else if (zoom >= 10) {
        return 'ft';
      } else {
        return 'mi';
      }
    };

    beforeEach(() => {
      currentZoom = 33;
      renderedHtmls = {};
      ctrl = new ScaleLine({
        minWidth: 10
      });
      ctrl.setMap(map);
      map.setView(new View({
        center: [0, 0],
        zoom: currentZoom,
        maxZoom: currentZoom,
        multiWorld: true
      }));
      mapView = map.getView();
      map.renderSync();

    });
    afterEach(() => {
      map.removeControl(ctrl);
      map.setView(null);
    });

    test('metric: is rendered differently for different zoomlevels', () => {
      ctrl.setUnits('metric');
      map.renderSync();
      renderedHtmls[ctrl.element.innerHTML] = true;
      while (--currentZoom >= 0) {
        mapView.setZoom(currentZoom);
        map.renderSync();
        const currentHtml = ctrl.element.innerHTML;
        expect(currentHtml in renderedHtmls).toBe(false);
        renderedHtmls[currentHtml] = true;

        const unit = ctrl.innerElement_.textContent.match(/\d+ (.+)/)[1];
        expect(unit).toEqual(getMetricUnit(currentZoom));
      }
    });
    test('degrees: is rendered differently for different zoomlevels', () => {
      ctrl.setUnits('degrees');
      map.renderSync();
      renderedHtmls[ctrl.element.innerHTML] = true;
      while (--currentZoom >= 0) {
        mapView.setZoom(currentZoom);
        map.renderSync();
        const currentHtml = ctrl.element.innerHTML;
        expect(currentHtml in renderedHtmls).toBe(false);
        renderedHtmls[currentHtml] = true;
      }
    });
    test('imperial: is rendered differently for different zoomlevels', () => {
      ctrl.setUnits('imperial');
      map.renderSync();
      renderedHtmls[ctrl.element.innerHTML] = true;
      while (--currentZoom >= 0) {
        mapView.setZoom(currentZoom);
        map.renderSync();
        const currentHtml = ctrl.element.innerHTML;
        expect(currentHtml in renderedHtmls).toBe(false);
        renderedHtmls[currentHtml] = true;

        const unit = ctrl.innerElement_.textContent.match(/\d+ (.+)/)[1];
        expect(unit).toEqual(getImperialUnit(currentZoom));
      }
    });
    test('nautical: is rendered differently for different zoomlevels', () => {
      ctrl.setUnits('nautical');
      map.renderSync();
      renderedHtmls[ctrl.element.innerHTML] = true;
      while (--currentZoom >= 0) {
        mapView.setZoom(currentZoom);
        map.renderSync();
        const currentHtml = ctrl.element.innerHTML;
        expect(currentHtml in renderedHtmls).toBe(false);
        renderedHtmls[currentHtml] = true;
      }
    });
    test('us: is rendered differently for different zoomlevels', () => {
      ctrl.setUnits('us');
      map.renderSync();
      renderedHtmls[ctrl.element.innerHTML] = true;
      while (--currentZoom >= 0) {
        mapView.setZoom(currentZoom);
        map.renderSync();
        const currentHtml = ctrl.element.innerHTML;
        expect(currentHtml in renderedHtmls).toBe(false);
        renderedHtmls[currentHtml] = true;
      }
    });
  });

});
