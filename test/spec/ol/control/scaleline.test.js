import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import ScaleLine, {render} from '../../../../src/ol/control/ScaleLine.js';
import {fromLonLat, clearAllProjections, addCommon} from '../../../../src/ol/proj.js';
import Projection from '../../../../src/ol/proj/Projection.js';
import proj4 from 'proj4';
import {register} from '../../../../src/ol/proj/proj4.js';

describe('ol.control.ScaleLine', function() {
  let map;
  beforeEach(function() {
    const target = document.createElement('div');
    target.style.height = '256px';
    document.body.appendChild(target);
    map = new Map({
      target: target
    });
  });
  afterEach(function() {
    disposeMap(map);
    map = null;
  });

  describe('constructor', function() {
    it('can be constructed without arguments', function() {
      const ctrl = new ScaleLine();
      expect(ctrl).to.be.an(ScaleLine);
    });
  });

  describe('configuration options', function() {

    describe('className', function() {
      it('defaults to "ol-scale-line"', function() {
        const ctrl = new ScaleLine();
        ctrl.setMap(map);
        const element = document.querySelector('.ol-scale-line', map.getTarget());
        expect(element).to.not.be(null);
        expect(element).to.be.a(HTMLDivElement);
      });
      it('can be configured', function() {
        const ctrl = new ScaleLine({
          className: 'humpty-dumpty'
        });
        ctrl.setMap(map);

        // check that the default was not chosen
        const element1 = document.querySelector('.ol-scale-line', map.getTarget());
        expect(element1).to.be(null);
        // check if the configured classname was chosen
        const element2 = document.querySelector('.humpty-dumpty', map.getTarget());
        expect(element2).to.not.be(null);
        expect(element2).to.be.a(HTMLDivElement);
      });
    });

    describe('minWidth', function() {
      it('defaults to 64', function() {
        const ctrl = new ScaleLine();
        expect(ctrl.minWidth_).to.be(64);
      });
      it('can be configured', function() {
        const ctrl = new ScaleLine({
          minWidth: 4711
        });
        expect(ctrl.minWidth_).to.be(4711);
      });
    });

    describe('render', function() {
      it('defaults to `ol.control.ScaleLine.render`', function() {
        const ctrl = new ScaleLine();
        expect(ctrl.render).to.be(render);
      });
      it('can be configured', function() {
        const myRender = function() {};
        const ctrl = new ScaleLine({
          render: myRender
        });
        expect(ctrl.render).to.be(myRender);
      });
    });

  });

  describe('synchronisation with map view', function() {
    it('calls `render` as soon as the map is rendered', function(done) {
      const renderSpy = sinon.spy();
      const ctrl = new ScaleLine({
        render: renderSpy
      });
      expect(renderSpy.called).to.be(false);
      ctrl.setMap(map);
      expect(renderSpy.called).to.be(false);
      map.setView(new View({
        center: [0, 0],
        zoom: 0
      }));
      expect(renderSpy.called).to.be(false);
      map.once('postrender', function() {
        expect(renderSpy.called).to.be(true);
        expect(renderSpy.callCount).to.be(1);
        done();
      });
    });
    it('calls `render` as often as the map is rendered', function() {
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
      expect(renderSpy.callCount).to.be(1);
      map.renderSync();
      expect(renderSpy.callCount).to.be(2);
      map.renderSync();
      expect(renderSpy.callCount).to.be(3);
    });
    it('calls `render` as when the view changes', function(done) {
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
        expect(renderSpy.callCount).to.be(2);
        done();
      });
      map.getView().setCenter([1, 1]);
    });
  });

  describe('static method `render`', function() {
    it('updates the rendered text', function() {
      const ctrl = new ScaleLine();
      expect(ctrl.element.innerText).to.be('');
      ctrl.setMap(map);
      map.setView(new View({
        center: [0, 0],
        multiWorld: true,
        zoom: 0
      }));
      map.renderSync();
      expect(ctrl.element.innerText).to.be('10000 km');
    });
  });

  describe('#getUnits', function() {
    it('returns "metric" by default', function() {
      const ctrl = new ScaleLine();
      expect(ctrl.getUnits()).to.be('metric');
    });
    it('returns what is configured via `units` property', function() {
      const ctrl = new ScaleLine({
        units: 'nautical'
      });
      expect(ctrl.getUnits()).to.be('nautical');
    });
    it('returns what is configured `setUnits` method', function() {
      const ctrl = new ScaleLine();
      ctrl.setUnits('nautical');
      expect(ctrl.getUnits()).to.be('nautical');
    });
  });

  describe('#setUnits', function() {
    it('triggers rerendering', function() {
      const ctrl = new ScaleLine();
      map.setView(new View({
        center: [0, 0],
        multiWorld: true,
        zoom: 0
      }));
      ctrl.setMap(map);

      map.renderSync();
      expect(ctrl.element.innerText).to.be('10000 km');

      ctrl.setUnits('nautical');
      map.renderSync();
      expect(ctrl.element.innerText).to.be('10000 nm');
    });
  });

  describe('different units result in different contents', function() {
    let ctrl;
    let metricHtml;
    let nauticalHtml;
    let degreesHtml;
    let imperialHtml;
    let usHtml;
    beforeEach(function(done) {
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
    afterEach(function() {
      map.setView(null);
      map.removeControl(ctrl);
    });

    it('renders a scaleline for "metric"', function() {
      expect(metricHtml).to.not.be(undefined);
    });
    it('renders a different scaleline for "nautical"', function() {
      ctrl.setUnits('nautical');
      nauticalHtml = ctrl.element.innerHTML;
      expect(nauticalHtml).to.not.be(metricHtml);
    });
    it('renders a different scaleline for "degrees"', function() {
      ctrl.setUnits('degrees');
      degreesHtml = ctrl.element.innerHTML;
      expect(degreesHtml).to.not.be(metricHtml);
      expect(degreesHtml).to.not.be(nauticalHtml);
    });
    it('renders a different scaleline for "imperial"', function() {
      ctrl.setUnits('imperial');
      imperialHtml = ctrl.element.innerHTML;
      expect(imperialHtml).to.not.be(metricHtml);
      expect(imperialHtml).to.not.be(nauticalHtml);
      expect(imperialHtml).to.not.be(degreesHtml);
    });
    it('renders a different scaleline for "us"', function() {
      ctrl.setUnits('us');
      usHtml = ctrl.element.innerHTML;
      expect(usHtml).to.not.be(metricHtml);
      expect(usHtml).to.not.be(nauticalHtml);
      expect(usHtml).to.not.be(degreesHtml);
      // it's hard to actually find a difference in rendering between
      // usHtml and imperialHtml
    });
  });

  describe('projections affect the scaleline', function() {

    beforeEach(function() {
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

    afterEach(function() {
      clearAllProjections();
      addCommon();
    });

    it('is rendered differently for different projections', function() {
      const ctrl = new ScaleLine();
      ctrl.setMap(map);
      map.setView(new View({
        center: fromLonLat([7, 52]),
        zoom: 2,
        projection: 'EPSG:3857'
      }));
      map.renderSync();
      expect(ctrl.element.innerText).to.be('2000 km');
      map.setView(new View({
        center: [7, 52],
        multiWorld: true,
        zoom: 2,
        projection: 'EPSG:4326'
      }));
      map.renderSync();
      expect(ctrl.element.innerText).to.be('5000 km');
      map.setView(new View({
        center: fromLonLat([-85.685, 39.891], 'Indiana-East'),
        zoom: 7,
        projection: 'Indiana-East'
      }));
      map.renderSync();
      expect(ctrl.element.innerText).to.be('100 km');
    });

    it('shows the same scale for different projections at higher resolutions', function() {
      const ctrl = new ScaleLine();
      ctrl.setMap(map);
      map.setView(new View({
        center: fromLonLat([-85.685, 39.891]),
        zoom: 7,
        projection: 'EPSG:3857'
      }));
      map.renderSync();
      expect(ctrl.element.innerText).to.be('100 km');
      map.setView(new View({
        center: [-85.685, 39.891],
        zoom: 7,
        projection: 'EPSG:4326'
      }));
      map.renderSync();
      expect(ctrl.element.innerText).to.be('100 km');
      map.setView(new View({
        center: fromLonLat([-85.685, 39.891], 'Indiana-East'),
        zoom: 7,
        projection: 'Indiana-East'
      }));
      map.renderSync();
      expect(ctrl.element.innerText).to.be('100 km');
    });

    it('Projection\'s metersPerUnit affect scale for non-degree units', function() {
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
      expect(ctrl.element.innerText).to.be('100 m');

      ctrl.setUnits('imperial');
      expect(ctrl.element.innerText).to.be('500 ft');

      ctrl.setUnits('nautical');
      expect(ctrl.element.innerText).to.be('0.05 nm');

      ctrl.setUnits('us');
      expect(ctrl.element.innerText).to.be('500 ft');


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
      expect(ctrl.element.innerText).to.be('100 mm');

      ctrl.setUnits('imperial');
      expect(ctrl.element.innerText).to.be('5 in');

      ctrl.setUnits('nautical');
      expect(ctrl.element.innerText).to.be('0.00005 nm');

      ctrl.setUnits('us');
      expect(ctrl.element.innerText).to.be('5 in');
    });

    it('Metric display works with Geographic (EPSG:4326) projection', function() {
      const ctrl = new ScaleLine();
      ctrl.setMap(map);
      map.setView(new View({
        center: [0, 0],
        multiWorld: true,
        zoom: 0, /* min zoom */
        projection: 'EPSG:4326'
      }));
      map.renderSync();
      expect(ctrl.element.innerText).to.be('10000 km');
      map.getView().setZoom(28); /* max zoom */
      map.renderSync();
      expect(ctrl.element.innerText).to.be('50 mm');
    });
  });

  describe('latitude may affect scale line in EPSG:4326', function() {

    it('is rendered differently at different latitudes for metric', function() {
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
      expect(innerHtml0).to.not.be(innerHtml52);
    });

    it('is rendered the same at different latitudes for degrees', function() {
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
      expect(innerHtml0).to.be(innerHtml52);
    });

  });

  describe('zoom affects the scaleline', function() {
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

    beforeEach(function() {
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
    afterEach(function() {
      map.removeControl(ctrl);
      map.setView(null);
    });

    it('metric: is rendered differently for different zoomlevels', function() {
      ctrl.setUnits('metric');
      map.renderSync();
      renderedHtmls[ctrl.element.innerHTML] = true;
      while (--currentZoom >= 0) {
        mapView.setZoom(currentZoom);
        map.renderSync();
        const currentHtml = ctrl.element.innerHTML;
        expect(currentHtml in renderedHtmls).to.be(false);
        renderedHtmls[currentHtml] = true;

        const unit = ctrl.innerElement_.textContent.match(/\d+ (.+)/)[1];
        expect(unit).to.eql(getMetricUnit(currentZoom));
      }
    });
    it('degrees: is rendered differently for different zoomlevels', function() {
      ctrl.setUnits('degrees');
      map.renderSync();
      renderedHtmls[ctrl.element.innerHTML] = true;
      while (--currentZoom >= 0) {
        mapView.setZoom(currentZoom);
        map.renderSync();
        const currentHtml = ctrl.element.innerHTML;
        expect(currentHtml in renderedHtmls).to.be(false);
        renderedHtmls[currentHtml] = true;
      }
    });
    it('imperial: is rendered differently for different zoomlevels', function() {
      ctrl.setUnits('imperial');
      map.renderSync();
      renderedHtmls[ctrl.element.innerHTML] = true;
      while (--currentZoom >= 0) {
        mapView.setZoom(currentZoom);
        map.renderSync();
        const currentHtml = ctrl.element.innerHTML;
        expect(currentHtml in renderedHtmls).to.be(false);
        renderedHtmls[currentHtml] = true;

        const unit = ctrl.innerElement_.textContent.match(/\d+ (.+)/)[1];
        expect(unit).to.eql(getImperialUnit(currentZoom));
      }
    });
    it('nautical: is rendered differently for different zoomlevels', function() {
      ctrl.setUnits('nautical');
      map.renderSync();
      renderedHtmls[ctrl.element.innerHTML] = true;
      while (--currentZoom >= 0) {
        mapView.setZoom(currentZoom);
        map.renderSync();
        const currentHtml = ctrl.element.innerHTML;
        expect(currentHtml in renderedHtmls).to.be(false);
        renderedHtmls[currentHtml] = true;
      }
    });
    it('us: is rendered differently for different zoomlevels', function() {
      ctrl.setUnits('us');
      map.renderSync();
      renderedHtmls[ctrl.element.innerHTML] = true;
      while (--currentZoom >= 0) {
        mapView.setZoom(currentZoom);
        map.renderSync();
        const currentHtml = ctrl.element.innerHTML;
        expect(currentHtml in renderedHtmls).to.be(false);
        renderedHtmls[currentHtml] = true;
      }
    });
  });

});
